"""Iteration 8 — Phase 11 Project Management workflow upgrade tests."""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://green-automation-pro.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"username": "admin", "password": "Topchampion"}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def H(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# (A) Migration check
def test_a_status_migration(H):
    r = requests.get(f"{API}/projects", headers=H, timeout=20)
    assert r.status_code == 200
    legacy = {"draft", "in_design", "in_production", "commissioning", "delivered"}
    canonical = {"entry", "design", "procurement", "manufacturing", "testing", "shipping", "archived"}
    for p in r.json():
        assert p["status"] not in legacy, f"Legacy status leaked: {p['status']}"
        assert p["status"] in canonical


# Helper: build a tiny PNG (8 bytes header + minimal valid PNG body)
def _png_bytes():
    # Minimal valid 1x1 PNG
    return bytes.fromhex(
        "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
        "890000000A49444154789C6300010000000500010D0A2DB40000000049454E44AE426082"
    )


def _upload(H, pid, category, name="f.png"):
    files = {"file": (name, io.BytesIO(_png_bytes()), "image/png")}
    return requests.post(f"{API}/projects/{pid}/files",
                         headers=H, files=files,
                         data={"category": category}, timeout=30)


@pytest.fixture(scope="module")
def project(H):
    r = requests.post(f"{API}/projects", headers=H, json={
        "name": "TEST_R8_phase11",
        "work_order_no": "WO-R8-001",
        "customer_email": f"test_r8_{os.urandom(3).hex()}@example.com",
        "status": "entry",
    }, timeout=20)
    assert r.status_code == 201, r.text
    pid = r.json()["id"]
    yield r.json()
    # cleanup
    requests.delete(f"{API}/projects/{pid}", headers=H, timeout=20)


# (F) Verify new file categories actually persist (not coerced to 'drawing')
def test_f_new_categories_persist(H, project):
    pid = project["id"]
    new_cats = ["approval_drawing", "design_input", "design_output",
                "as_built_drawing", "product_photo", "inspection_report"]
    for cat in new_cats:
        r = _upload(H, pid, cat, name=f"{cat}.png")
        assert r.status_code == 201, f"{cat}: {r.status_code} {r.text}"
        body = r.json()
        assert body["category"] == cat, f"Category coerced! expected={cat} got={body['category']}"


# (B) Stage gating - design->procurement requires approval_drawing
def test_b_stage_gates(H):
    # Create fresh project for gating test
    r = requests.post(f"{API}/projects", headers=H, json={
        "name": "TEST_R8_gates", "customer_email": "gate@test.com", "status": "entry"
    }, timeout=20)
    assert r.status_code == 201
    pid = r.json()["id"]
    try:
        # entry -> design (no requirements)
        r1 = requests.post(f"{API}/projects/{pid}/request-advance",
                           headers=H, json={"to_status": "design"}, timeout=20)
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/projects/{pid}/approve-advance",
                           headers=H, json={}, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["status"] == "design"

        # design -> procurement WITHOUT approval_drawing should fail
        requests.post(f"{API}/projects/{pid}/request-advance",
                      headers=H, json={"to_status": "procurement"}, timeout=20)
        rfail = requests.post(f"{API}/projects/{pid}/approve-advance",
                              headers=H, json={}, timeout=20)
        assert rfail.status_code == 409, f"Expected 409, got {rfail.status_code}: {rfail.text}"

        # Upload approval_drawing
        up = _upload(H, pid, "approval_drawing")
        assert up.status_code == 201
        # Verify category persisted
        proj = requests.get(f"{API}/projects/{pid}", headers=H, timeout=20).json()
        cats = [f["category"] for f in proj["files"]]
        assert "approval_drawing" in cats, f"approval_drawing missing - cats={cats}"

        # Now approve should succeed
        rok = requests.post(f"{API}/projects/{pid}/approve-advance",
                            headers=H, json={}, timeout=20)
        assert rok.status_code == 200, rok.text
        assert rok.json()["status"] == "procurement"
    finally:
        requests.delete(f"{API}/projects/{pid}", headers=H, timeout=20)


# (C) Customer materials CRUD
def test_c_materials_crud(H, project):
    pid = project["id"]
    r = requests.post(f"{API}/projects/{pid}/materials", headers=H,
                      json={"name": "TEST_motor", "note": "10kW", "supplied": False}, timeout=20)
    assert r.status_code == 200, r.text
    mats = r.json()["customer_materials"]
    assert any(m["name"] == "TEST_motor" for m in mats)
    mat_id = [m for m in mats if m["name"] == "TEST_motor"][0]["id"]
    # PATCH
    r2 = requests.patch(f"{API}/projects/{pid}/materials/{mat_id}", headers=H,
                       json={"name": "TEST_motor", "note": "10kW", "supplied": True}, timeout=20)
    assert r2.status_code == 200
    upd = [m for m in r2.json()["customer_materials"] if m["id"] == mat_id][0]
    assert upd["supplied"] is True
    # DELETE
    r3 = requests.delete(f"{API}/projects/{pid}/materials/{mat_id}", headers=H, timeout=20)
    assert r3.status_code == 204


# (D) Customer account auto-provisioning
def test_d_customer_account(H):
    email = f"test_cust_{os.urandom(3).hex()}@example.com"
    r = requests.post(f"{API}/projects", headers=H, json={
        "name": "TEST_R8_provision", "customer_email": email, "status": "entry"
    }, timeout=20)
    pid = r.json()["id"]
    try:
        # Provision
        r1 = requests.post(f"{API}/projects/{pid}/customer-account", headers=H, timeout=20)
        assert r1.status_code == 200, r1.text
        body = r1.json()
        assert body["username"] == email
        assert body["temporary_password"]
        assert body["email_sent"] is False  # RESEND_API_KEY empty
        assert "Email pipeline disabled" in (body.get("notice") or "")
        temp_pw = body["temporary_password"]
        user_id = body["user_id"]

        # Idempotent
        r2 = requests.post(f"{API}/projects/{pid}/customer-account", headers=H, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["user_id"] == user_id

        # Customer can login
        rl = requests.post(f"{API}/auth/login", json={"username": email, "password": temp_pw}, timeout=20)
        assert rl.status_code == 200
        ctok = rl.json()["access_token"]
        assert rl.json()["user"]["role"] == "customer"

        # Customer sees only their project
        rp = requests.get(f"{API}/projects", headers={"Authorization": f"Bearer {ctok}"}, timeout=20)
        assert rp.status_code == 200
        ids = [p["id"] for p in rp.json()]
        assert pid in ids
        assert len(ids) == 1

        # (E) Notifications - customer should have customer_welcome
        rn = requests.get(f"{API}/notifications", headers={"Authorization": f"Bearer {ctok}"}, timeout=20)
        assert rn.status_code == 200
        notifs = rn.json()
        assert any(n["kind"] == "customer_welcome" for n in notifs), f"No customer_welcome in {notifs}"

        # Mark one read
        nid = notifs[0]["id"]
        rmr = requests.post(f"{API}/notifications/{nid}/read",
                            headers={"Authorization": f"Bearer {ctok}"}, timeout=20)
        assert rmr.status_code == 204

        # Mark all read
        rma = requests.post(f"{API}/notifications/read-all",
                            headers={"Authorization": f"Bearer {ctok}"}, timeout=20)
        assert rma.status_code == 204
        rn2 = requests.get(f"{API}/notifications", headers={"Authorization": f"Bearer {ctok}"}, timeout=20)
        assert all(n["read"] is True for n in rn2.json())

        # Cleanup user
        requests.delete(f"{API}/users/{user_id}", headers=H, timeout=20)
    finally:
        requests.delete(f"{API}/projects/{pid}", headers=H, timeout=20)


def test_d_no_email_returns_422(H):
    r = requests.post(f"{API}/projects", headers=H, json={
        "name": "TEST_R8_noemail", "status": "entry"
    }, timeout=20)
    pid = r.json()["id"]
    try:
        r1 = requests.post(f"{API}/projects/{pid}/customer-account", headers=H, timeout=20)
        assert r1.status_code == 422
    finally:
        requests.delete(f"{API}/projects/{pid}", headers=H, timeout=20)


# (K) Regression: dashboard stats still works
def test_k_dashboard_regression(H):
    r = requests.get(f"{API}/dashboard/stats", headers=H, timeout=20)
    assert r.status_code == 200
    d = r.json()
    for k in ("projects_total", "leads_total", "users_total", "can_see_leads"):
        assert k in d
