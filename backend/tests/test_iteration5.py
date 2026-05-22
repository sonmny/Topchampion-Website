"""Iteration 5 backend tests - 9-point feature update.

Covers:
- POST /api/leads multipart with country + optional file
- GET /api/leads admin/permission protection
- GET /api/leads/{id}/file streams uploaded file
- PATCH /api/leads/{id} (multipart) status update
- POST/PATCH /api/users with department + permissions
- Permission-based access (role=user with view_leads)
"""
import os
import io
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:3000").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USER = "admin"
ADMIN_PASS = "Topchampion"


# ---------------- Fixtures ----------------
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def cleanup(admin_headers):
    created_users = []
    created_leads = []
    yield {"users": created_users, "leads": created_leads}
    # Teardown - delete users (leads have no DELETE endpoint)
    for uid in created_users:
        try:
            requests.delete(f"{API}/users/{uid}", headers=admin_headers, timeout=10)
        except Exception:
            pass


# ---------------- Tests: leads POST (public multipart) ----------------
class TestLeadsCreate:
    def test_create_lead_required_only_no_file(self, cleanup):
        payload = {
            "name": "TEST_R5_Alice",
            "company": "TEST_R5 Corp",
            "industry": "tire_mfg",
            "country": "US",
            "project_description": "We need a complete MCC for our tire plant in Ohio.",
        }
        r = requests.post(f"{API}/leads", data=payload, timeout=15)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["name"] == "TEST_R5_Alice"
        assert body["country"] == "US"
        assert body["industry"] == "tire_mfg"
        assert body["status"] == "new"
        assert body["file_meta"] is None
        cleanup["leads"].append(body["id"])

    def test_create_lead_with_pdf_file(self, cleanup):
        pdf_bytes = b"%PDF-1.4\n%TEST_R5\n%%EOF"
        files = {"file": ("spec_TEST_R5.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
        data = {
            "name": "TEST_R5_Bob",
            "company": "TEST_R5 BESS GmbH",
            "industry": "bess",
            "country": "DE",
            "project_description": "1MWh BESS container PCS integration",
            "email": "bob@test-r5.example",
            "phone": "+49 1234567",
        }
        r = requests.post(f"{API}/leads", data=data, files=files, timeout=15)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["country"] == "DE"
        assert body["email"] == "bob@test-r5.example"
        assert body["file_meta"] is not None
        fm = body["file_meta"]
        assert fm["filename"] == "spec_TEST_R5.pdf"
        assert fm["size"] == len(pdf_bytes)
        assert fm["content_type"] == "application/pdf"
        assert "id" in fm
        # Internal _ext field should NOT leak
        assert "_ext" not in fm
        cleanup["leads"].append(body["id"])

    def test_create_lead_invalid_industry_422(self):
        r = requests.post(f"{API}/leads", data={
            "name": "x", "company": "y", "industry": "auto", "country": "US",
            "project_description": "12345",
        }, timeout=10)
        assert r.status_code == 422

    def test_create_lead_short_description_422(self):
        r = requests.post(f"{API}/leads", data={
            "name": "x", "company": "y", "industry": "tire_mfg", "country": "US",
            "project_description": "hi",
        }, timeout=10)
        assert r.status_code == 422

    def test_create_lead_unsupported_file_415(self):
        files = {"file": ("bad.exe", io.BytesIO(b"MZ\x90\x00"), "application/octet-stream")}
        r = requests.post(f"{API}/leads", data={
            "name": "x", "company": "y", "industry": "tire_mfg", "country": "CN",
            "project_description": "valid description",
        }, files=files, timeout=10)
        assert r.status_code == 415


# ---------------- Tests: leads admin GET / file ----------------
class TestLeadsAdminAccess:
    def test_get_leads_unauthenticated_401(self):
        r = requests.get(f"{API}/leads", timeout=10)
        assert r.status_code == 401

    def test_get_leads_as_admin_200(self, admin_headers, cleanup):
        r = requests.get(f"{API}/leads", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        leads = r.json()
        assert isinstance(leads, list)
        # Must contain leads we created
        ids = {l["id"] for l in leads}
        for lid in cleanup["leads"]:
            assert lid in ids
        # No file_meta._ext leak
        for l in leads:
            if l.get("file_meta"):
                assert "_ext" not in l["file_meta"]

    def test_get_lead_detail_marks_viewed(self, admin_headers, cleanup):
        lead_id = cleanup["leads"][0]
        r = requests.get(f"{API}/leads/{lead_id}", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] in ("viewed", "closed")

    def test_get_lead_file_streams_pdf(self, admin_headers, cleanup):
        # Find lead with file
        r = requests.get(f"{API}/leads", headers=admin_headers, timeout=10)
        leads = r.json()
        with_file = [l for l in leads if l.get("file_meta") and l["id"] in cleanup["leads"]]
        assert with_file, "expected at least one lead with file"
        lead = with_file[0]
        rf = requests.get(f"{API}/leads/{lead['id']}/file", headers=admin_headers, timeout=15)
        assert rf.status_code == 200
        assert "pdf" in rf.headers.get("content-type", "").lower()
        assert rf.content.startswith(b"%PDF")

    def test_patch_lead_status_closed(self, admin_headers, cleanup):
        lead_id = cleanup["leads"][0]
        r = requests.patch(f"{API}/leads/{lead_id}", headers=admin_headers, data={"status": "closed"}, timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] == "closed"

    def test_patch_lead_invalid_status_422(self, admin_headers, cleanup):
        lead_id = cleanup["leads"][0]
        r = requests.patch(f"{API}/leads/{lead_id}", headers=admin_headers, data={"status": "junk"}, timeout=10)
        assert r.status_code == 422


# ---------------- Tests: users with department + permissions ----------------
class TestUsersDeptPerms:
    def test_create_user_with_dept_and_perms(self, admin_headers, cleanup):
        username = f"TEST_R5_u_{uuid.uuid4().hex[:6]}"
        payload = {
            "username": username,
            "password": "P@ssword123",
            "full_name": "Test R5 Sales User",
            "role": "user",
            "department": "sales",
            "permissions": ["view_leads", "edit_projects"],
        }
        r = requests.post(f"{API}/users", headers=admin_headers, json=payload, timeout=10)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["department"] == "sales"
        assert set(body["permissions"]) == {"view_leads", "edit_projects"}
        cleanup["users"].append(body["id"])
        cleanup["test_user_username"] = username
        cleanup["test_user_password"] = "P@ssword123"
        cleanup["test_user_id"] = body["id"]

    def test_create_user_filters_invalid_perms(self, admin_headers, cleanup):
        username = f"TEST_R5_u2_{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{API}/users", headers=admin_headers, json={
            "username": username, "password": "P@ssword123",
            "role": "user", "department": "engineering",
            "permissions": ["view_leads", "hack_db", "delete_universe"],
        }, timeout=10)
        assert r.status_code == 201
        body = r.json()
        assert body["permissions"] == ["view_leads"]
        cleanup["users"].append(body["id"])

    def test_create_user_invalid_dept_422(self, admin_headers):
        r = requests.post(f"{API}/users", headers=admin_headers, json={
            "username": f"TEST_R5_bad_{uuid.uuid4().hex[:5]}",
            "password": "P@ssword123",
            "role": "user", "department": "legal",  # invalid
        }, timeout=10)
        assert r.status_code == 422

    def test_patch_user_update_dept_perms(self, admin_headers, cleanup):
        uid = cleanup["test_user_id"]
        r = requests.patch(f"{API}/users/{uid}", headers=admin_headers, json={
            "department": "design",
            "permissions": ["manage_files", "view_leads", "garbage_perm"],
        }, timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert body["department"] == "design"
        assert set(body["permissions"]) == {"manage_files", "view_leads"}


# ---------------- Tests: permission gating ----------------
class TestPermissionGating:
    def test_user_with_view_leads_can_get_leads(self, cleanup):
        un = cleanup.get("test_user_username")
        pw = cleanup.get("test_user_password")
        assert un, "test user not created earlier"
        # Re-update to ensure view_leads is set (last patch removed it? we set view_leads in patch)
        r = requests.post(f"{API}/auth/login", json={"username": un, "password": pw}, timeout=10)
        assert r.status_code == 200
        token = r.json()["access_token"]
        rl = requests.get(f"{API}/leads", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert rl.status_code == 200, rl.text

    def test_user_without_view_leads_gets_403(self, admin_headers, cleanup):
        # Create another user without view_leads permission
        username = f"TEST_R5_noperm_{uuid.uuid4().hex[:5]}"
        r = requests.post(f"{API}/users", headers=admin_headers, json={
            "username": username, "password": "P@ssword123",
            "role": "user", "department": "it",
            "permissions": ["edit_projects"],
        }, timeout=10)
        assert r.status_code == 201
        cleanup["users"].append(r.json()["id"])

        rl = requests.post(f"{API}/auth/login", json={"username": username, "password": "P@ssword123"}, timeout=10)
        token = rl.json()["access_token"]
        rg = requests.get(f"{API}/leads", headers={"Authorization": f"Bearer {token}"}, timeout=10)
        assert rg.status_code == 403
