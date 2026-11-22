import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = ROOT / "backend" / "models"


def test_model_artifact_and_metrics_exist():
    assert (MODEL_DIR / "purchase_propensity.joblib").exists()
    metrics = json.loads((MODEL_DIR / "purchase_propensity_metrics.json").read_text(encoding="utf-8"))
    assert 0 <= metrics["accuracy"] <= 1
    assert 0 <= metrics["roc_auc"] <= 1
    assert (MODEL_DIR / "feature_importance.json").exists()
