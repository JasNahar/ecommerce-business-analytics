from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["provider"] == "sqlite"


def test_summary_endpoint():
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["revenue"] > 0
    assert data["orders"] > 0
    assert 0 <= data["repeat_purchase_rate"] <= 100


def test_filters_endpoint():
    response = client.get("/api/filters")
    assert response.status_code == 200
    data = response.json()
    assert len(data["regions"]) == 5
    assert len(data["channels"]) == 5


def test_trends_endpoint():
    response = client.get("/api/trends")
    assert response.status_code == 200
    assert len(response.json()) >= 12
