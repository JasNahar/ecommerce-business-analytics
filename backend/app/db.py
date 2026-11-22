import sqlite3
from contextlib import contextmanager
from pathlib import Path


DB_PATH = Path(__file__).resolve().parents[1] / "ecommerce.db"


def connect():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    if not DB_PATH.exists():
        raise RuntimeError(
            f"{DB_PATH.name} is missing. Run python scripts/load_sqlite.py before starting the API."
        )


@contextmanager
def db():
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()
