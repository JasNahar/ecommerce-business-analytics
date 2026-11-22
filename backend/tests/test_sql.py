import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parents[1] / "ecommerce.db"


def test_database_views_and_metrics():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    monthly = conn.execute("SELECT COUNT(*) AS count FROM v_monthly_performance").fetchone()
    rfm = conn.execute("SELECT COUNT(*) AS count FROM v_rfm").fetchone()
    repeat_purchase = conn.execute("""
        WITH customer_orders AS (
            SELECT customer_id, COUNT(DISTINCT order_id) AS orders
            FROM orders WHERE status='Completed' GROUP BY customer_id
        )
        SELECT ROUND(100.0 * SUM(CASE WHEN orders > 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS pct
        FROM customer_orders
    """).fetchone()
    conn.close()
    assert monthly["count"] >= 12
    assert rfm["count"] > 100
    assert 0 <= repeat_purchase["pct"] <= 100
