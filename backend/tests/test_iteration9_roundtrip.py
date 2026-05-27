"""Iteration 9 — Full round-trip stage gate test for Phase 11 Project Management.

Validates the entire 7-stage workflow with all gates:
entry -> design -> procurement -> manufacturing -> testing -> shipping -> archived
"""
import io
import os
import pytest
import requests

def _load_url():
    url = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
    if not url:
        try:
            with open("/app/frontend/.env") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        url = line.split("=", 1)[1].strip().rstrip("/")
                        break
        except Exception:
            pass
    return url


BASE_URL = _load_url()
API = f"{BASE_URL}/api"


def _png():
    return bytes.fromhex(
        "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
        "890000000A49444154789C6300010000000500010D0A2DB40000000049454E44AE426082"
    )


def _upload(H, pid, category, name=None):
    files = {"file": (name or f"{category}.png", io.BytesIO(_png()), "image/png")}
    return requests.post(f"{API}/projects/{pid}/files",
                         headers=H, files=files,
                         data={"category": category}, timeout=30)


def _req_adv(H, pid, to_status):
    return requests.post(f"{API}/projects/{pid}/request-advance",
                         headers=H, json={"to_status": to_status}, timeout=20)


def _approve(H, pid):
    return requests.post(f"{API}/projects/{pid}/approve-advance",
                         headers=H, json={}, timeout=20)


@pytest.fixture(scope="module")
def H():
    r = requests.post(f"{API}/auth/login",
                      json={"username": "admin", "password": "Topchampion"}, timeout=20)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="module")
def pid(H):
    r = requests.post(f"{API}/projects", headers=H, json={
        "name": "TEST_R9_roundtrip",
        "work_order_no": "WO-R9-RT",
        "customer_email": f"test_r9_{os.urandom(3).hex()}@example.com",
        "status": "entry",
    }, timeout=20)
    assert r.status_code == 201, r.text
    pid_ = r.json()["id"]
    yield pid_
    # full cleanup
    requests.delete(f"{API}/projects/{pid_}", headers=H, timeout=20)


def test_full_roundtrip_all_gates(H, pid):
    # === entry -> design (no gate) ===
    assert _req_adv(H, pid, "design").status_code == 200
    r = _approve(H, pid)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "design"

    # === design -> procurement (REQUIRES approval_drawing) ===
    assert _req_adv(H, pid, "procurement").status_code == 200
    # Should 409 (no approval_drawing yet)
    r = _approve(H, pid)
    assert r.status_code == 409, f"Expected 409, got {r.status_code}: {r.text}"
    # Upload approval_drawing
    up = _upload(H, pid, "approval_drawing")
    assert up.status_code == 201, up.text
    assert up.json()["category"] == "approval_drawing"
    # Now should 200
    r = _approve(H, pid)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "procurement"

    # === procurement -> manufacturing (REQUIRES all customer_materials supplied) ===
    # Add a customer material with supplied=False
    rm = requests.post(f"{API}/projects/{pid}/materials", headers=H,
                       json={"name": "TEST_part", "supplied": False}, timeout=20)
    assert rm.status_code == 200, rm.text
    mat_id = [m for m in rm.json()["customer_materials"] if m["name"] == "TEST_part"][0]["id"]

    assert _req_adv(H, pid, "manufacturing").status_code == 200
    # Should 409 (material not supplied)
    r = _approve(H, pid)
    assert r.status_code == 409, f"Expected 409, got {r.status_code}: {r.text}"
    # Mark material supplied
    rp = requests.patch(f"{API}/projects/{pid}/materials/{mat_id}", headers=H,
                       json={"name": "TEST_part", "supplied": True}, timeout=20)
    assert rp.status_code == 200, rp.text
    # Now should 200
    r = _approve(H, pid)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "manufacturing"

    # === manufacturing -> testing (no gate) ===
    assert _req_adv(H, pid, "testing").status_code == 200
    r = _approve(H, pid)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "testing"

    # === testing -> shipping (REQUIRES product_photo + inspection_report) ===
    assert _req_adv(H, pid, "shipping").status_code == 200
    # Should 409 (missing files)
    r = _approve(H, pid)
    assert r.status_code == 409, f"Expected 409, got {r.status_code}: {r.text}"
    # Upload both
    up1 = _upload(H, pid, "product_photo")
    assert up1.status_code == 201 and up1.json()["category"] == "product_photo"
    up2 = _upload(H, pid, "inspection_report")
    assert up2.status_code == 201 and up2.json()["category"] == "inspection_report"
    # Now should 200
    r = _approve(H, pid)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "shipping"

    # === shipping -> archived (REQUIRES as_built_drawing) ===
    assert _req_adv(H, pid, "archived").status_code == 200
    # Should 409 (missing as_built_drawing)
    r = _approve(H, pid)
    assert r.status_code == 409, f"Expected 409, got {r.status_code}: {r.text}"
    # Upload as_built_drawing
    up3 = _upload(H, pid, "as_built_drawing")
    assert up3.status_code == 201 and up3.json()["category"] == "as_built_drawing"
    # Now should 200
    r = _approve(H, pid)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "archived"


# Regression sanity checks
def test_regression_dashboard_cms_leads_login(H):
    # Dashboard stats
    r = requests.get(f"{API}/dashboard/stats", headers=H, timeout=20)
    assert r.status_code == 200

    # CMS endpoints (case studies, partners, stats are exposed)
    r = requests.get(f"{API}/site/case-studies", timeout=20)
    assert r.status_code == 200, f"CMS case-studies failed: {r.status_code}"

    # Leads list (admin)
    r = requests.get(f"{API}/leads", headers=H, timeout=20)
    assert r.status_code == 200

    # Login still works
    r = requests.post(f"{API}/auth/login",
                      json={"username": "admin", "password": "Topchampion"}, timeout=20)
    assert r.status_code == 200


def test_legitimate_project_preserved(H):
    # Confirm existing project is at status=manufacturing, customer_materials=[]
    r = requests.get(f"{API}/projects/5b138ec0-f769-418f-ad83-87fbdca01d99", headers=H, timeout=20)
    if r.status_code == 200:
        p = r.json()
        assert p["status"] == "manufacturing", f"Legitimate project status changed: {p['status']}"
        assert p.get("customer_materials") == [], f"customer_materials should be []: {p.get('customer_materials')}"
