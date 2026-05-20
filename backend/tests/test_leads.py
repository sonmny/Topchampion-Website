import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://green-automation-pro.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Health
def test_health(session):
    r = session.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert "time" in data


# Create lead - happy path
def test_create_lead_and_persist(session):
    payload = {
        "name": "TEST_John Doe",
        "company": "TEST_Acme Industrial",
        "email": "test_qa@example.com",
        "phone": "+1-555-1234",
        "industry": "bess",
        "plc_brand": "siemens",
        "project_description": "Need a 2MWh BESS container with EMS and Siemens S7-1500 integration.",
    }
    r = session.post(f"{API}/leads", json=payload, timeout=20)
    assert r.status_code == 201, r.text
    data = r.json()
    assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 10
    assert "created_at" in data
    assert data["name"] == payload["name"]
    assert data["industry"] == "bess"
    assert data["plc_brand"] == "siemens"

    # Verify via GET /api/leads
    r2 = session.get(f"{API}/leads", timeout=20)
    assert r2.status_code == 200
    leads = r2.json()
    assert isinstance(leads, list)
    ids = [l["id"] for l in leads]
    assert data["id"] in ids
    # No _id exposed
    for lead in leads:
        assert "_id" not in lead


# Sorted desc by created_at
def test_leads_sorted_desc(session):
    r = session.get(f"{API}/leads", timeout=20)
    assert r.status_code == 200
    leads = r.json()
    if len(leads) >= 2:
        timestamps = [l["created_at"] for l in leads]
        assert timestamps == sorted(timestamps, reverse=True)


# Missing required fields -> 422
@pytest.mark.parametrize("missing_key", ["name", "company", "industry", "plc_brand", "project_description"])
def test_missing_required(session, missing_key):
    payload = {
        "name": "TEST_X",
        "company": "TEST_Co",
        "industry": "other",
        "plc_brand": "rockwell",
        "project_description": "Valid description here",
    }
    del payload[missing_key]
    r = session.post(f"{API}/leads", json=payload, timeout=15)
    assert r.status_code == 422, f"Expected 422 for missing {missing_key}, got {r.status_code}"


# Invalid enums -> 422
def test_invalid_industry(session):
    payload = {
        "name": "TEST_X",
        "company": "TEST_Co",
        "industry": "invalid_industry",
        "plc_brand": "rockwell",
        "project_description": "Valid description here",
    }
    r = session.post(f"{API}/leads", json=payload, timeout=15)
    assert r.status_code == 422


def test_invalid_plc(session):
    payload = {
        "name": "TEST_X",
        "company": "TEST_Co",
        "industry": "other",
        "plc_brand": "mitsubishi",
        "project_description": "Valid description here",
    }
    r = session.post(f"{API}/leads", json=payload, timeout=15)
    assert r.status_code == 422
