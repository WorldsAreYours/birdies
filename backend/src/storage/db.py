from __future__ import annotations

import json
import sqlite3
from collections import defaultdict
from datetime import datetime, timezone
from os import PathLike
from pathlib import Path
from typing import Any


class Database:
    def __init__(self, path: str | PathLike[str], connection: sqlite3.Connection | None = None):
        self.path = Path(path)
        self.connection = connection

    def connect(self) -> sqlite3.Connection:
        if self.connection is not None:
            self.connection.row_factory = sqlite3.Row
            self.connection.execute("pragma foreign_keys = on")
            return self.connection

        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(self.path)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("pragma foreign_keys = on")
        return self.connection

    def close(self) -> None:
        if self.connection is not None:
            self.connection.close()
            self.connection = None

    def initialize_schema(self) -> None:
        conn = self.connect()
        conn.executescript(
            """
            create table if not exists users (
                id integer primary key autoincrement,
                name text,
                created_at text not null
            );

            create table if not exists sessions (
                id integer primary key autoincrement,
                user_id integer not null references users(id) on delete cascade,
                started_at text not null,
                ended_at text,
                latitude real,
                longitude real
            );

            create table if not exists detection_windows (
                id integer primary key autoincrement,
                session_id integer not null references sessions(id) on delete cascade,
                sequence_number integer not null,
                observed_at text not null,
                analysis_state text not null,
                human_speech_ratio real,
                birds_json text not null,
                review_status text not null default 'accepted',
                accepted_at text,
                rejected_at text,
                filter_version text,
                unique(session_id, sequence_number)
            );

            create table if not exists observations (
                id integer primary key autoincrement,
                session_id integer not null references sessions(id) on delete cascade,
                species_common_name text not null,
                first_detected_at text not null,
                last_detected_at text not null,
                first_window_sequence integer not null,
                last_window_sequence integer not null,
                detection_count integer not null,
                max_confidence real
            );
            """
        )
        self._migrate_detection_windows_schema(conn)

    def _migrate_detection_windows_schema(self, conn: sqlite3.Connection) -> None:
        columns = {
            row["name"]
            for row in conn.execute("pragma table_info(detection_windows)").fetchall()
        }

        migrations = [
            ("review_status", "alter table detection_windows add column review_status text not null default 'accepted'"),
            ("accepted_at", "alter table detection_windows add column accepted_at text"),
            ("rejected_at", "alter table detection_windows add column rejected_at text"),
            ("filter_version", "alter table detection_windows add column filter_version text"),
        ]
        for column_name, sql in migrations:
            if column_name not in columns:
                conn.execute(sql)

        conn.execute(
            """
            update detection_windows
            set accepted_at = coalesce(accepted_at, observed_at)
            where review_status = 'accepted' and accepted_at is null
            """
        )

    def create_user(self, name: str | None = None) -> int:
        conn = self.connect()
        created_at = self._now()
        cursor = conn.execute(
            "insert into users (name, created_at) values (?, ?)",
            (name, created_at),
        )
        conn.commit()

        if cursor.lastrowid is None:
            raise RuntimeError("insert resulted in now Row ID")
        return int(cursor.lastrowid)

    def create_session(
        self,
        user_id: int,
        *,
        started_at: str | datetime | None = None,
        ended_at: str | datetime | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
    ) -> int:
        conn = self.connect()
        cursor = conn.execute(
            """
            insert into sessions (user_id, started_at, ended_at, latitude, longitude)
            values (?, ?, ?, ?, ?)
            """,
            (
                user_id,
                self._serialize_datetime(started_at) or self._now(),
                self._serialize_datetime(ended_at),
                latitude,
                longitude,
            ),
        )
        conn.commit()
        if cursor.lastrowid is None:
            raise RuntimeError("insert resulted in now Row ID")
        return int(cursor.lastrowid)

    def end_session(self, session_id: int, ended_at: str | datetime | None = None) -> None:
        conn = self.connect()
        conn.execute(
            "update sessions set ended_at = ? where id = ?",
            (self._serialize_datetime(ended_at) or self._now(), session_id),
        )
        conn.commit()

    def record_analysis_pass(
        self,
        *,
        session_id: int,
        sequence_number: int,
        observed_at: str | datetime,
        birds: list[dict[str, Any]],
        human_speech_ratio: float,
        analysis_state: str,
        review_status: str = "accepted",
        filter_version: str | None = None,
    ) -> int:
        conn = self.connect()
        serialized_observed_at = self._serialize_datetime(observed_at) or self._now()
        stored_birds = [dict(bird) for bird in birds]
        accepted_at = serialized_observed_at if review_status == "accepted" else None
        rejected_at = serialized_observed_at if review_status == "rejected" else None

        with conn:
            cursor = conn.execute(
                """
                insert into detection_windows (
                    session_id,
                    sequence_number,
                    observed_at,
                    analysis_state,
                    human_speech_ratio,
                    birds_json,
                    review_status,
                    accepted_at,
                    rejected_at,
                    filter_version
                ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    sequence_number,
                    serialized_observed_at,
                    analysis_state,
                    human_speech_ratio,
                    json.dumps(stored_birds),
                    review_status,
                    accepted_at,
                    rejected_at,
                    filter_version,
                ),
            )
            if cursor.lastrowid is None:
                raise RuntimeError("insert resulted in now Row ID")
            detection_window_id = int(cursor.lastrowid)

            if review_status != "accepted":
                return detection_window_id

            self._record_observation_links(
                conn,
                session_id=session_id,
                sequence_number=sequence_number,
                observed_at=serialized_observed_at,
                birds=stored_birds,
            )

        return detection_window_id

    def rebuild_observations(self, *, session_id: int | None = None) -> None:
        conn = self.connect()

        with conn:
            if session_id is None:
                conn.execute("delete from observations")
                window_rows = conn.execute(
                    """
                    select id, session_id, sequence_number, observed_at, birds_json
                    from detection_windows
                    where review_status = 'accepted'
                    order by session_id, sequence_number, id
                    """
                ).fetchall()
            else:
                conn.execute("delete from observations where session_id = ?", (session_id,))
                window_rows = conn.execute(
                    """
                    select id, session_id, sequence_number, observed_at, birds_json
                    from detection_windows
                    where session_id = ? and review_status = 'accepted'
                    order by sequence_number, id
                    """,
                    (session_id,),
                ).fetchall()

            for row in window_rows:
                birds = json.loads(row["birds_json"])
                self._record_observation_links(
                    conn,
                    session_id=int(row["session_id"]),
                    sequence_number=int(row["sequence_number"]),
                    observed_at=str(row["observed_at"]),
                    birds=birds,
                )

    def _find_extendable_observation(
        self,
        conn: sqlite3.Connection,
        *,
        session_id: int,
        species_common_name: str,
        sequence_number: int,
    ) -> int | None:
        if sequence_number <= 1:
            return None

        row = conn.execute(
            """
            select id
            from observations
            where session_id = ?
              and species_common_name = ?
              and last_window_sequence = ?
            order by last_detected_at desc, id desc
            limit 1
            """,
            (session_id, species_common_name, sequence_number - 1),
        ).fetchone()

        if row is None:
            return None

        return int(row["id"])

    def _record_observation_links(
        self,
        conn: sqlite3.Connection,
        *,
        session_id: int,
        sequence_number: int,
        observed_at: str,
        birds: list[dict[str, Any]],
    ) -> None:
        for species_common_name, summary in self._summarize_birds(birds).items():
            observation_id = self._find_extendable_observation(
                conn,
                session_id=session_id,
                species_common_name=species_common_name,
                sequence_number=sequence_number,
            )

            if observation_id is None:
                observation_id = self._create_observation(
                    conn,
                    session_id=session_id,
                    species_common_name=species_common_name,
                    observed_at=observed_at,
                    sequence_number=sequence_number,
                    detection_count=summary["count"],
                    max_confidence=summary["max_confidence"],
                )
            else:
                self._extend_observation(
                    conn,
                    observation_id=observation_id,
                    observed_at=observed_at,
                    sequence_number=sequence_number,
                    detection_count=summary["count"],
                    max_confidence=summary["max_confidence"],
                )

    def _create_observation(
        self,
        conn: sqlite3.Connection,
        *,
        session_id: int,
        species_common_name: str,
        observed_at: str,
        sequence_number: int,
        detection_count: int,
        max_confidence: float | None,
    ) -> int:
        cursor = conn.execute(
            """
            insert into observations (
                session_id,
                species_common_name,
                first_detected_at,
                last_detected_at,
                first_window_sequence,
                last_window_sequence,
                detection_count,
                max_confidence
            ) values (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                species_common_name,
                observed_at,
                observed_at,
                sequence_number,
                sequence_number,
                detection_count,
                max_confidence,
            ),
        )
        if cursor.lastrowid is None:
            raise RuntimeError("insert resulted in now Row ID")
        return int(cursor.lastrowid)

    def _extend_observation(
        self,
        conn: sqlite3.Connection,
        *,
        observation_id: int,
        observed_at: str,
        sequence_number: int,
        detection_count: int,
        max_confidence: float | None,
    ) -> None:
        row = conn.execute(
            "select detection_count, max_confidence from observations where id = ?",
            (observation_id,),
        ).fetchone()
        if row is None:
            raise LookupError(f"observation {observation_id} no longer exists")

        existing_count = int(row["detection_count"])
        existing_confidence = row["max_confidence"]
        if existing_confidence is None:
            new_max_confidence = max_confidence
        elif max_confidence is None:
            new_max_confidence = existing_confidence
        else:
            new_max_confidence = max(existing_confidence, max_confidence)

        conn.execute(
            """
            update observations
            set last_detected_at = ?,
                last_window_sequence = ?,
                detection_count = ?,
                max_confidence = ?
            where id = ?
            """,
            (
                observed_at,
                sequence_number,
                existing_count + detection_count,
                new_max_confidence,
                observation_id,
            ),
        )

    def _summarize_birds(self, birds: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
        summary: dict[str, dict[str, Any]] = defaultdict(lambda: {"count": 0, "max_confidence": None})

        for bird in birds:
            species_common_name = bird.get("common_name")
            if not species_common_name:
                continue

            species_summary = summary[species_common_name]
            species_summary["count"] += 1

            confidence = bird.get("confidence")
            if confidence is None:
                continue

            if species_summary["max_confidence"] is None:
                species_summary["max_confidence"] = confidence
            else:
                species_summary["max_confidence"] = max(species_summary["max_confidence"], confidence)

        return dict(summary)

    def _serialize_datetime(self, value: str | datetime | None) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            return value
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat()
