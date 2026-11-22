import csv
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DB_PATH = ROOT / "backend" / "ecommerce.db"


def read_csv(name):
    with (DATA_DIR / name).open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def convert(row):
    return tuple(
        int(value) if value is not None and value.lstrip("-").isdigit() else
        float(value) if value is not None and value.replace(".", "", 1).lstrip("-").isdigit() else
        value
        for value in row.values()
    )


def main():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript((ROOT / "sql" / "schema.sql").read_text(encoding="utf-8"))

    tables = [
        ("regions", "regions.csv"),
        ("channels", "channels.csv"),
        ("customers", "customers.csv"),
        ("products", "products.csv"),
        ("orders", "orders.csv"),
        ("order_items", "order_items.csv"),
        ("returns", "returns.csv"),
    ]
    for table, filename in tables:
        rows = read_csv(filename)
        if not rows:
            continue
        columns = list(rows[0].keys())
        placeholders = ", ".join("?" for _ in columns)
        conn.executemany(
            f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})",
            [convert(row) for row in rows],
        )
    conn.commit()
    conn.executescript((ROOT / "sql" / "views.sql").read_text(encoding="utf-8"))
    conn.commit()

    tables_count = {}
    for table, _ in tables:
        tables_count[table] = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    conn.close()
    print(f"Loaded SQLite database at {DB_PATH}")
    print(tables_count)


if __name__ == "__main__":
    main()
