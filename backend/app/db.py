import sqlite3
from contextlib import contextmanager
import os
from pathlib import Path


DB_PATH = Path(os.getenv(
    "MACHINEMEMORY_DB_PATH",
    str(Path(__file__).resolve().parents[1] / "machinememory.db"),
))


def connect():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS machines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                manufacturer TEXT DEFAULT '',
                model TEXT DEFAULT '',
                serial_number TEXT DEFAULT '',
                status TEXT DEFAULT 'Stable',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                machine_id INTEGER,
                machine_name TEXT DEFAULT '',
                technician TEXT DEFAULT '',
                text TEXT NOT NULL,
                source TEXT DEFAULT 'technician',
                approved INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS parts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                machine_id INTEGER,
                original_part TEXT NOT NULL,
                substitute_part TEXT NOT NULL,
                match_confidence INTEGER DEFAULT 0,
                notes TEXT DEFAULT '',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            """
        )


@contextmanager
def db():
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()
