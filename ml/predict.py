import argparse
import json
from pathlib import Path

import joblib


ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "backend" / "models" / "purchase_propensity.joblib"


def main():
    parser = argparse.ArgumentParser(description="Predict 30-day purchase propensity")
    parser.add_argument("--loyalty-member", type=int, choices=[0, 1], required=True)
    parser.add_argument("--segment-cohort", required=True)
    parser.add_argument("--region-name", required=True)
    parser.add_argument("--order-count", type=int, default=0)
    parser.add_argument("--category-count", type=int, default=0)
    parser.add_argument("--monetary", type=float, default=0)
    parser.add_argument("--refund-amount", type=float, default=0)
    parser.add_argument("--recency-days", type=int, default=999)
    args = parser.parse_args()

    model = joblib.load(MODEL_PATH)
    features = [{
        "loyalty_member": args.loyalty_member,
        "segment_cohort": args.segment_cohort,
        "region_name": args.region_name,
        "order_count": args.order_count,
        "category_count": args.category_count,
        "monetary": args.monetary,
        "refund_amount": args.refund_amount,
        "recency_days": args.recency_days,
    }]
    probability = float(model.predict_proba(features)[:, 1][0])
    print(json.dumps({"purchase_probability_30d": round(probability, 4), "prediction": probability >= 0.5}))


if __name__ == "__main__":
    main()
