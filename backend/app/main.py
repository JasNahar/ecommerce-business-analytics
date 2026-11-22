import json
from pathlib import Path
from datetime import date

import joblib
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .db import db, init_db


app = FastAPI(title="E-commerce Analytics API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "backend" / "models" / "purchase_propensity.joblib"
METRICS_PATH = ROOT / "backend" / "models" / "purchase_propensity_metrics.json"
IMPORTANCE_PATH = ROOT / "backend" / "models" / "feature_importance.json"


class PredictionRequest(BaseModel):
    loyalty_member: int = Field(ge=0, le=1)
    segment_cohort: str
    region_name: str
    order_count: int = Field(ge=0, default=0)
    category_count: int = Field(ge=0, default=0)
    monetary: float = Field(ge=0, default=0)
    refund_amount: float = Field(ge=0, default=0)
    recency_days: int = Field(ge=0, default=999)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "provider": "sqlite", "database": "ecommerce"}


def filter_clause(region: str | None, channel: str | None, date_from: str | None, date_to: str | None):
    clauses = ["o.status = 'Completed'"]
    params = []
    if region:
        clauses.append("r.region_name = ?")
        params.append(region)
    if channel:
        clauses.append("c.channel_name = ?")
        params.append(channel)
    if date_from:
        clauses.append("o.ordered_at >= ?")
        params.append(date_from)
    if date_to:
        clauses.append("o.ordered_at <= ?")
        params.append(date_to)
    return " AND ".join(clauses), params


@app.get("/api/filters")
def filters():
    with db() as conn:
        regions = [row["region_name"] for row in conn.execute("SELECT region_name FROM regions ORDER BY region_name")]
        channels = [row["channel_name"] for row in conn.execute("SELECT channel_name FROM channels ORDER BY channel_name")]
        categories = [row["category"] for row in conn.execute("SELECT DISTINCT category FROM products ORDER BY category")]
        date_range = conn.execute("SELECT MIN(ordered_at) AS start, MAX(ordered_at) AS end FROM orders").fetchone()
    return {"regions": regions, "channels": channels, "categories": categories, "start": date_range["start"], "end": date_range["end"]}


@app.get("/api/summary")
def summary(region: str | None = None, channel: str | None = None,
            date_from: str | None = None, date_to: str | None = None):
    with db() as conn:
        where, params = filter_clause(region, channel, date_from, date_to)
        base = f"""
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        LEFT JOIN regions r ON r.region_id = o.region_id
        LEFT JOIN channels c ON c.channel_id = o.channel_id
        WHERE {where}
        """
        row = conn.execute(f"""
        SELECT ROUND(COALESCE(SUM(oi.net_revenue), 0), 2) AS revenue,
               ROUND(COALESCE(SUM(oi.net_revenue - oi.cost), 0), 2) AS profit,
               COUNT(DISTINCT o.order_id) AS orders,
               COUNT(DISTINCT o.customer_id) AS customers,
               ROUND(COALESCE(SUM(oi.net_revenue) / NULLIF(COUNT(DISTINCT o.order_id), 0), 0), 2) AS aov
        {base}
        """, params).fetchone()
        repeat_row = conn.execute("""
        WITH customer_orders AS (
            SELECT customer_id, COUNT(DISTINCT order_id) AS orders
            FROM orders WHERE status = 'Completed' GROUP BY customer_id
        )
        SELECT ROUND(100.0 * SUM(CASE WHEN orders > 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS repeat_purchase
        FROM customer_orders
        """).fetchone()
        return_row = conn.execute("""
        SELECT ROUND(100.0 * COUNT(DISTINCT r.return_id) / NULLIF(COUNT(DISTINCT oi.order_item_id), 0), 2) AS return_rate
        FROM order_items oi LEFT JOIN returns r ON r.order_item_id = oi.order_item_id
        """).fetchone()
    return {
        "revenue": row["revenue"],
        "profit": row["profit"],
        "orders": row["orders"],
        "customers": row["customers"],
        "aov": row["aov"],
        "repeat_purchase_rate": repeat_row["repeat_purchase"],
        "return_rate": return_row["return_rate"],
    }


@app.get("/api/trends")
def trends(region: str | None = None, channel: str | None = None,
           date_from: str | None = None, date_to: str | None = None):
    with db() as conn:
        where, params = filter_clause(region, channel, date_from, date_to)
        rows = conn.execute(f"""
        SELECT substr(o.ordered_at, 1, 7) AS month,
               ROUND(SUM(oi.net_revenue), 2) AS revenue,
               ROUND(SUM(oi.net_revenue - oi.cost), 2) AS profit,
               ROUND(SUM(oi.net_revenue) / COUNT(DISTINCT o.order_id), 2) AS aov
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        LEFT JOIN regions r ON r.region_id = o.region_id
        LEFT JOIN channels c ON c.channel_id = o.channel_id
        WHERE {where}
        GROUP BY month ORDER BY month
        """, params).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/categories")
def categories(region: str | None = None, channel: str | None = None,
               date_from: str | None = None, date_to: str | None = None):
    with db() as conn:
        clauses = ["o.status = 'Completed'"]
        params = []
        if region:
            clauses.append("r.region_name = ?"); params.append(region)
        if channel:
            clauses.append("c.channel_name = ?"); params.append(channel)
        if date_from:
            clauses.append("o.ordered_at >= ?"); params.append(date_from)
        if date_to:
            clauses.append("o.ordered_at <= ?"); params.append(date_to)
        rows = conn.execute(f"""
        SELECT p.category,
               ROUND(SUM(oi.net_revenue), 2) AS revenue,
               ROUND(SUM(oi.net_revenue - oi.cost), 2) AS profit,
               SUM(oi.quantity) AS units,
               ROUND(100.0 * SUM(oi.net_revenue - oi.cost) / NULLIF(SUM(oi.net_revenue), 0), 1) AS margin_pct
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        JOIN products p ON p.product_id = oi.product_id
        LEFT JOIN regions r ON r.region_id = o.region_id
        LEFT JOIN channels c ON c.channel_id = o.channel_id
        WHERE {' AND '.join(clauses)}
        GROUP BY p.category ORDER BY revenue DESC
        """, params).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/regions")
def regions():
    with db() as conn:
        rows = conn.execute("""
        SELECT r.region_name,
               ROUND(SUM(oi.net_revenue), 2) AS revenue,
               ROUND(SUM(oi.net_revenue - oi.cost), 2) AS profit,
               COUNT(DISTINCT o.customer_id) AS customers
        FROM orders o JOIN regions r ON r.region_id = o.region_id
        JOIN order_items oi ON oi.order_id = o.order_id
        WHERE o.status = 'Completed'
        GROUP BY r.region_name ORDER BY revenue DESC
        """).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/channels")
def channels():
    with db() as conn:
        rows = conn.execute("""
        SELECT c.channel_name, COUNT(DISTINCT o.order_id) AS orders,
               ROUND(SUM(oi.net_revenue), 2) AS revenue,
               ROUND(100.0 * SUM(oi.net_revenue) / (SELECT SUM(net_revenue) FROM order_items), 1) AS revenue_share_pct
        FROM orders o JOIN channels c ON c.channel_id = o.channel_id
        JOIN order_items oi ON oi.order_id = o.order_id
        WHERE o.status = 'Completed'
        GROUP BY c.channel_name ORDER BY revenue DESC
        """).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/rfm")
def rfm(limit: int = Query(default=20, ge=1, le=200)):
    with db() as conn:
        rows = conn.execute("""
        SELECT c.customer_id, c.name, c.segment_cohort,
               ROUND(SUM(oi.net_revenue), 2) AS monetary,
               COUNT(DISTINCT o.order_id) AS frequency,
               CAST(julianday((SELECT date(MAX(ordered_at), '+1 day') FROM orders)) - julianday(MAX(o.ordered_at)) AS INTEGER) AS recency
        FROM customers c JOIN orders o ON o.customer_id = c.customer_id
        JOIN order_items oi ON oi.order_id = o.order_id
        WHERE o.status = 'Completed'
        GROUP BY c.customer_id, c.name, c.segment_cohort
        ORDER BY monetary DESC LIMIT ?
        """, (limit,)).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/customers")
def customers(limit: int = Query(default=20, ge=1, le=200)):
    with db() as conn:
        rows = conn.execute("""
        SELECT c.customer_id, c.name, c.email, c.loyalty_member, c.segment_cohort, r.region_name,
               COUNT(DISTINCT o.order_id) AS orders,
               ROUND(SUM(oi.net_revenue), 2) AS lifetime_value,
               CAST(julianday((SELECT date(MAX(ordered_at), '+1 day') FROM orders)) - julianday(MAX(o.ordered_at)) AS INTEGER) AS recency_days
        FROM customers c JOIN regions r ON r.region_id = c.region_id
        JOIN orders o ON o.customer_id = c.customer_id
        JOIN order_items oi ON oi.order_id = o.order_id
        WHERE o.status = 'Completed'
        GROUP BY c.customer_id, c.name, c.email, c.loyalty_member, c.segment_cohort, r.region_name
        ORDER BY lifetime_value DESC LIMIT ?
        """, (limit,)).fetchall()
    return [dict(row) for row in rows]


@app.post("/api/predict")
def predict(payload: PredictionRequest):
    if not MODEL_PATH.exists():
        return {"error": "Model artifact missing", "purchase_probability_30d": None}
    model = joblib.load(MODEL_PATH)
    frame = pd.DataFrame([payload.model_dump()])
    probability = float(model.predict_proba(frame)[0, 1])
    return {
        "purchase_probability_30d": round(probability, 4),
        "prediction": probability >= 0.5,
    }


@app.get("/api/model")
def model_details():
    metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8")) if METRICS_PATH.exists() else {}
    importance = json.loads(IMPORTANCE_PATH.read_text(encoding="utf-8")) if IMPORTANCE_PATH.exists() else []
    return {"metrics": metrics, "feature_importance": importance}


frontend_out = ROOT / "out"
if frontend_out.exists():
    app.mount("/", StaticFiles(directory=frontend_out, html=True), name="frontend")
