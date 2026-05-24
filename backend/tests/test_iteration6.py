"""Iteration 6 backend tests - Phase 9 (6-point feature set).

Covers:
- CMS Stats endpoints (public/admin/POST/PATCH/DELETE)
- All 6 public CMS endpoints sanity
- Project workflow state machine (draft → in_design → ... → archived)
  via POST /api/projects/{id}/request-advance, approve-advance, reject-advance
- status_history append + pending_status clear on reject
- File upload with category="photo"
- POST /api/leads multipart still works
- Admin login still works
"""
import os
import io
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
API = f"{BASE_URL}/api"

ADMIN_USER = "admin"
ADMIN_PASS = "Topchampion"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def H(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def cleanup(H):
    created = {"stats": [], "projects": [], "users": []}
    yield created
    for sid in created["stats"]:
        try:
            requests.delete(f"{API}/site/stats/{sid}", headers=H, timeout=10)
        except Exception:
            pass
    for pid in created["projects"]:
        try:
            requests.delete(f"{API}/projects/{pid}", headers=H, timeout=10)
        except Exception:
            pass
    for uid in created["users"]:
        try:
            requests.delete(f"{API}/users/{uid}", headers=H, timeout=10)
        except Exception:
            pass


# ---------------- Regression: All 6 public CMS endpoints ----------------
class TestPublicCMS:
    @pytest.mark.parametrize("slug", [
        "certifications", "case-studies", "client-groups", "partners", "contact-info", "stats",
    ])
    def test_public_get_returns_200(self, slug):
        r = requests.get(f"{API}/site/{slug}", timeout=10)
        assert r.status_code == 200, f"{slug}: {r.status_code} {r.text}"
        data = r.json()
        if slug == "contact-info":
            assert isinstance(data, dict)
        else:
            assert isinstance(data, list)


# ---------------- Stats CMS CRUD ----------------
class TestStatsCMS:
    def test_admin_list_requires_auth(self):
        r = requests.get(f"{API}/site/stats/admin", timeout=10)
        assert r.status_code == 401

    def test_admin_list_works(self, H):
        r = requests.get(f"{API}/site/stats/admin", headers=H, timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_stat_requires_auth(self):
        r = requests.post(f"{API}/site/stats", json={"value": "99", "label_en": "x", "label_cn": "x"}, timeout=10)
        assert r.status_code == 401

    def test_create_stat(self, H, cleanup):
        payload = {
            "value": "TEST_R6_99",
            "label_en": "Test R6 Stat",
            "label_cn": "测试统计",
            "order": 99,
            "enabled": True,
        }
        r = requests.post(f"{API}/site/stats", json=payload, headers=H, timeout=10)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["value"] == "TEST_R6_99"
        assert body["label_en"] == "Test R6 Stat"
        assert body["label_cn"] == "测试统计"
        assert "id" in body
        cleanup["stats"].append(body["id"])
        # Verify GET persistence
        rl = requests.get(f"{API}/site/stats", timeout=10)
        assert any(s["id"] == body["id"] for s in rl.json())

    def test_patch_stat(self, H, cleanup):
        sid = cleanup["stats"][0]
        r = requests.patch(f"{API}/site/stats/{sid}", json={"label_en": "Updated R6", "order": 100}, headers=H, timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["label_en"] == "Updated R6"
        assert body["order"] == 100
        # Verify persistence
        rg = requests.get(f"{API}/site/stats/admin", headers=H, timeout=10)
        match = [s for s in rg.json() if s["id"] == sid][0]
        assert match["label_en"] == "Updated R6"

    def test_delete_stat(self, H, cleanup):
        # Create one, then delete
        r = requests.post(f"{API}/site/stats", json={"value": "TEST_R6_DEL", "label_en": "Del", "label_cn": "删"}, headers=H, timeout=10)
        sid = r.json()["id"]
        rd = requests.delete(f"{API}/site/stats/{sid}", headers=H, timeout=10)
        assert rd.status_code == 204
        # Verify removed
        rg = requests.get(f"{API}/site/stats/admin", headers=H, timeout=10)
        assert not any(s["id"] == sid for s in rg.json())


# ---------------- Project workflow state machine ----------------
class TestProjectWorkflow:
    def test_create_project_starts_draft(self, H, cleanup):
        payload = {
            "name": "TEST_R6 Workflow Project",
            "client_name": "TEST_R6 Client",
            "status": "draft",
        }
        r = requests.post(f"{API}/projects", json=payload, headers=H, timeout=10)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["status"] == "draft"
        assert body["pending_status"] is None
        assert isinstance(body["status_history"], list)
        assert len(body["status_history"]) == 1
        assert body["status_history"][0]["kind"] == "created"
        assert body["status_history"][0]["to_status"] == "draft"
        cleanup["projects"].append(body["id"])

    def test_full_workflow_progression(self, H, cleanup):
        pid = cleanup["projects"][0]
        # Progress through full chain
        chain = ["in_design", "in_production", "commissioning", "delivered", "archived"]
        prev = "draft"
        for to_status in chain:
            r1 = requests.post(f"{API}/projects/{pid}/request-advance",
                               json={"to_status": to_status, "note": f"req to {to_status}"},
                               headers=H, timeout=10)
            assert r1.status_code == 200, f"request-advance to {to_status} failed: {r1.text}"
            body = r1.json()
            assert body["status"] == prev, f"status changed prematurely on request"
            assert body["pending_status"] == to_status
            # last event should be request_advance
            assert body["status_history"][-1]["kind"] == "request_advance"

            r2 = requests.post(f"{API}/projects/{pid}/approve-advance",
                               json={"note": f"approve {to_status}"}, headers=H, timeout=10)
            assert r2.status_code == 200, f"approve-advance to {to_status} failed: {r2.text}"
            body = r2.json()
            assert body["status"] == to_status, f"status should be {to_status}, got {body['status']}"
            assert body["pending_status"] is None
            assert body["status_history"][-1]["kind"] == "approved"
            prev = to_status

    def test_archived_cannot_advance(self, H, cleanup):
        pid = cleanup["projects"][0]
        r = requests.post(f"{API}/projects/{pid}/request-advance",
                          json={"to_status": "delivered"}, headers=H, timeout=10)
        assert r.status_code == 409, r.text

    def test_reject_clears_pending(self, H, cleanup):
        # Create new project
        r = requests.post(f"{API}/projects",
                          json={"name": "TEST_R6 Reject", "client_name": "X", "status": "in_design"},
                          headers=H, timeout=10)
        pid = r.json()["id"]
        cleanup["projects"].append(pid)
        # Request advance
        r1 = requests.post(f"{API}/projects/{pid}/request-advance",
                           json={"to_status": "in_production"}, headers=H, timeout=10)
        assert r1.status_code == 200
        assert r1.json()["pending_status"] == "in_production"
        # Reject
        r2 = requests.post(f"{API}/projects/{pid}/reject-advance",
                           json={"note": "not ready"}, headers=H, timeout=10)
        assert r2.status_code == 200
        body = r2.json()
        assert body["pending_status"] is None
        assert body["status"] == "in_design"  # unchanged
        assert body["status_history"][-1]["kind"] == "rejected"

    def test_duplicate_request_advance_409(self, H, cleanup):
        r = requests.post(f"{API}/projects",
                          json={"name": "TEST_R6 Dup", "client_name": "X", "status": "draft"},
                          headers=H, timeout=10)
        pid = r.json()["id"]
        cleanup["projects"].append(pid)
        r1 = requests.post(f"{API}/projects/{pid}/request-advance",
                           json={"to_status": "in_design"}, headers=H, timeout=10)
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/projects/{pid}/request-advance",
                           json={"to_status": "in_production"}, headers=H, timeout=10)
        assert r2.status_code == 409

    def test_approve_without_pending_409(self, H, cleanup):
        r = requests.post(f"{API}/projects",
                          json={"name": "TEST_R6 NoPend", "client_name": "X", "status": "draft"},
                          headers=H, timeout=10)
        pid = r.json()["id"]
        cleanup["projects"].append(pid)
        r1 = requests.post(f"{API}/projects/{pid}/approve-advance", json={}, headers=H, timeout=10)
        assert r1.status_code == 409


# ---------------- Photo file upload on project ----------------
class TestProjectPhotoUpload:
    def test_upload_photo_category(self, H, cleanup):
        # Need a project
        r = requests.post(f"{API}/projects",
                          json={"name": "TEST_R6 PhotoProj", "client_name": "X", "status": "draft"},
                          headers=H, timeout=10)
        pid = r.json()["id"]
        cleanup["projects"].append(pid)

        # 1x1 PNG
        png_bytes = bytes.fromhex(
            "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C489"
            "0000000D49444154789C636000000000020001E2210BCF0000000049454E44AE426082"
        )
        files = {"file": ("test_photo.png", io.BytesIO(png_bytes), "image/png")}
        data = {"category": "photo", "description": "TEST_R6 photo"}
        rf = requests.post(f"{API}/projects/{pid}/files", headers=H, data=data, files=files, timeout=15)
        assert rf.status_code in (200, 201), rf.text
        new_file = rf.json()
        assert new_file["category"] == "photo"
        assert new_file["filename"] == "test_photo.png"
        assert new_file.get("uploaded_by_name"), "uploaded_by_name should be set"
        # Verify file persisted in project
        rp = requests.get(f"{API}/projects/{pid}", headers=H, timeout=10)
        files = rp.json().get("files", [])
        assert any(f["id"] == new_file["id"] and f["category"] == "photo" for f in files)


# ---------------- Regression: Leads multipart still works ----------------
class TestLeadsRegression:
    def test_post_lead_multipart_no_file(self):
        r = requests.post(f"{API}/leads", data={
            "name": "TEST_R6_lead",
            "company": "TEST_R6 Co",
            "industry": "tire_mfg",
            "country": "CN",
            "project_description": "regression test description for lead",
        }, timeout=15)
        assert r.status_code == 201, r.text
        assert r.json()["country"] == "CN"


# ---------------- Auth regression ----------------
class TestAuthRegression:
    def test_admin_login(self):
        r = requests.post(f"{API}/auth/login",
                          json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert "access_token" in body
        assert body["user"]["username"] == "admin"
        assert body["user"]["role"] == "admin"
