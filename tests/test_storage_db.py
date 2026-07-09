import sqlite3
from datetime import datetime, timezone

import pytest

from storage.db import Database


def _now() -> datetime:
    return datetime(2026, 7, 8, 12, 0, tzinfo=timezone.utc)


def test_database_initializes_schema_and_enforces_foreign_keys(tmp_path):
    db = Database(tmp_path / "birdies.sqlite")
    conn = db.connect()
    db.initialize_schema()

    tables = {
        row[0]
        for row in conn.execute(
            "select name from sqlite_master where type = 'table' order by name"
        )
    }

    assert {"users", "sessions", "detection_windows", "observations", "observation_windows"}.issubset(tables)
    assert conn.execute("pragma foreign_keys").fetchone()[0] == 1

    with pytest.raises(sqlite3.IntegrityError):
        conn.execute(
            "insert into sessions (user_id, started_at, latitude, longitude) values (?, ?, ?, ?)",
            (999, _now().isoformat(), 0.0, 0.0),
        )


def test_record_analysis_pass_groups_adjacent_windows_and_links_same_observation(tmp_path):
    db = Database(tmp_path / "birdies.sqlite")
    conn = db.connect()
    db.initialize_schema()
    user_id = db.create_user("Alex")
    session_id = db.create_session(user_id, started_at=_now().isoformat(), latitude=44.98, longitude=-93.26)

    first_window_id = db.record_analysis_pass(
        session_id=session_id,
        sequence_number=1,
        observed_at=_now().isoformat(),
        birds=[{"common_name": "Northern Cardinal", "confidence": 0.92}],
        human_speech_ratio=0.1,
        analysis_state="birds",
    )
    second_window_id = db.record_analysis_pass(
        session_id=session_id,
        sequence_number=2,
        observed_at=_now().isoformat(),
        birds=[{"common_name": "Northern Cardinal", "confidence": 0.81}],
        human_speech_ratio=0.1,
        analysis_state="birds",
    )

    assert first_window_id != second_window_id

    observations = conn.execute(
        """
        select species_common_name, first_window_sequence, last_window_sequence, detection_count, max_confidence
        from observations
        """
    ).fetchall()
    assert len(observations) == 1
    assert observations[0]["species_common_name"] == "Northern Cardinal"
    assert observations[0]["first_window_sequence"] == 1
    assert observations[0]["last_window_sequence"] == 2
    assert observations[0]["detection_count"] == 2
    assert observations[0]["max_confidence"] == 0.92

    links = conn.execute("select observation_id, detection_window_id from observation_windows order by detection_window_id").fetchall()
    assert len(links) == 2


def test_record_analysis_pass_starts_new_observation_after_gap(tmp_path):
    db = Database(tmp_path / "birdies.sqlite")
    conn = db.connect()
    db.initialize_schema()
    user_id = db.create_user("Alex")
    session_id = db.create_session(user_id, started_at=_now().isoformat(), latitude=44.98, longitude=-93.26)

    db.record_analysis_pass(
        session_id=session_id,
        sequence_number=1,
        observed_at=_now().isoformat(),
        birds=[{"common_name": "Northern Cardinal", "confidence": 0.92}],
        human_speech_ratio=0.1,
        analysis_state="birds",
    )
    db.record_analysis_pass(
        session_id=session_id,
        sequence_number=2,
        observed_at=_now().isoformat(),
        birds=[],
        human_speech_ratio=0.1,
        analysis_state="no_birds",
    )
    db.record_analysis_pass(
        session_id=session_id,
        sequence_number=3,
        observed_at=_now().isoformat(),
        birds=[{"common_name": "Northern Cardinal", "confidence": 0.77}],
        human_speech_ratio=0.1,
        analysis_state="birds",
    )

    observations = conn.execute(
        """
        select species_common_name, first_window_sequence, last_window_sequence, detection_count
        from observations
        order by id
        """
    ).fetchall()
    assert len(observations) == 2
    assert [row["first_window_sequence"] for row in observations] == [1, 3]
    assert [row["last_window_sequence"] for row in observations] == [1, 3]
    assert [row["detection_count"] for row in observations] == [1, 1]


def test_record_analysis_pass_links_multiple_species_from_same_window(tmp_path):
    db = Database(tmp_path / "birdies.sqlite")
    conn = db.connect()
    db.initialize_schema()
    user_id = db.create_user("Alex")
    session_id = db.create_session(user_id, started_at=_now().isoformat(), latitude=44.98, longitude=-93.26)

    db.record_analysis_pass(
        session_id=session_id,
        sequence_number=1,
        observed_at=_now().isoformat(),
        birds=[
            {"common_name": "Northern Cardinal", "confidence": 0.92},
            {"common_name": "Blue Jay", "confidence": 0.81},
        ],
        human_speech_ratio=0.1,
        analysis_state="birds",
    )

    observations = conn.execute(
        "select species_common_name, detection_count from observations order by species_common_name"
    ).fetchall()
    assert [row["species_common_name"] for row in observations] == ["Blue Jay", "Northern Cardinal"]
    assert [row["detection_count"] for row in observations] == [1, 1]

    links = conn.execute("select count(*) from observation_windows").fetchone()[0]
    assert links == 2

