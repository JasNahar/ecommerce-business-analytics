import json
import sqlite3
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "backend" / "ecommerce.db"
MODEL_DIR = ROOT / "backend" / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def customer_features(as_of):
    conn = sqlite3.connect(DB_PATH)
    query = """
    WITH history AS (
        SELECT o.customer_id,
               COUNT(DISTINCT o.order_id) AS order_count,
               COUNT(DISTINCT p.category) AS category_count,
               SUM(CASE WHEN o.status = 'Completed' THEN oi.net_revenue ELSE 0 END) AS monetary,
               SUM(CASE WHEN r.return_id IS NOT NULL THEN r.refund_amount ELSE 0 END) AS refund_amount,
               CAST(julianday(?) - julianday(MAX(o.ordered_at)) AS INTEGER) AS recency_days
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        JOIN products p ON p.product_id = oi.product_id
        LEFT JOIN returns r ON r.order_item_id = oi.order_item_id
        WHERE o.ordered_at < ?
        GROUP BY o.customer_id
    ),
    future AS (
        SELECT DISTINCT o.customer_id
        FROM orders o
        WHERE o.ordered_at >= ? AND o.ordered_at < date(?, '+30 day')
          AND o.status = 'Completed'
    )
    SELECT c.customer_id, c.loyalty_member, c.segment_cohort, r.region_name,
           COALESCE(h.order_count, 0) AS order_count,
           COALESCE(h.category_count, 0) AS category_count,
           COALESCE(h.monetary, 0) AS monetary,
           COALESCE(h.refund_amount, 0) AS refund_amount,
           COALESCE(h.recency_days, 999) AS recency_days,
           CASE WHEN f.customer_id IS NOT NULL THEN 1 ELSE 0 END AS purchased_next_30d
    FROM customers c
    JOIN regions r ON r.region_id = c.region_id
    LEFT JOIN history h ON h.customer_id = c.customer_id
    LEFT JOIN future f ON f.customer_id = c.customer_id
    """
    frame = pd.read_sql_query(query, conn, params=(as_of, as_of, as_of, as_of))
    conn.close()
    return frame


def train():
    train_frame = customer_features("2025-08-01")
    test_frame = customer_features("2025-10-01")

    features = ["loyalty_member", "segment_cohort", "region_name", "order_count",
                "category_count", "monetary", "refund_amount", "recency_days"]
    numeric = ["loyalty_member", "order_count", "category_count", "monetary", "refund_amount", "recency_days"]
    categorical = ["segment_cohort", "region_name"]

    preprocessing = ColumnTransformer([
        ("numeric", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), numeric),
        ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical),
    ])
    model = Pipeline([
        ("preprocessing", preprocessing),
        ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])

    model.fit(train_frame[features], train_frame["purchased_next_30d"])
    probabilities = model.predict_proba(test_frame[features])[:, 1]
    predictions = (probabilities >= 0.5).astype(int)
    labels = test_frame["purchased_next_30d"]

    metrics = {
        "method": "Temporally split customer features; train cutoff 2025-08-01, test cutoff 2025-10-01",
        "positive_rate_test": round(float(labels.mean()), 4),
        "accuracy": round(float(accuracy_score(labels, predictions)), 4),
        "precision": round(float(precision_score(labels, predictions, zero_division=0)), 4),
        "recall": round(float(recall_score(labels, predictions, zero_division=0)), 4),
        "f1": round(float(f1_score(labels, predictions, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(labels, probabilities)), 4),
    }

    joblib.dump(model, MODEL_DIR / "purchase_propensity.joblib")
    (MODEL_DIR / "purchase_propensity_metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    feature_names = model.named_steps["preprocessing"].get_feature_names_out()
    coefficients = model.named_steps["classifier"].coef_[0]
    importance = sorted(
        ({"feature": name, "coefficient": round(float(value), 5)} for name, value in zip(feature_names, coefficients)),
        key=lambda row: abs(row["coefficient"]),
        reverse=True,
    )
    (MODEL_DIR / "feature_importance.json").write_text(json.dumps(importance[:20], indent=2), encoding="utf-8")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    train()
