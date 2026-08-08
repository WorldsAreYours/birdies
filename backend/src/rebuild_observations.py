from __future__ import annotations

import argparse
import os

from storage.db import Database


def main() -> None:
    parser = argparse.ArgumentParser(description="Rebuild observations from accepted detection windows.")
    parser.add_argument(
        "--db-path",
        default=os.path.expanduser("~/.birdie/birdies.sqlite"),
        help="Path to the SQLite database. Defaults to ~/.birdie/birdies.sqlite",
    )
    parser.add_argument(
        "--session-id",
        type=int,
        default=None,
        help="Optional session id to rebuild. If omitted, rebuilds all sessions.",
    )
    args = parser.parse_args()

    database = Database(args.db_path)
    try:
        database.initialize_schema()
        database.rebuild_observations(session_id=args.session_id)
    finally:
        database.close()


if __name__ == "__main__":
    main()
