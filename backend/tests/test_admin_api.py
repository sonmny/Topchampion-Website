"""Backend tests for Topchampion admin/JWT API + project + file + role-based access."""
import os
import io
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://green-automation-pro.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Topchampion"

# Shared module-level state
state = {}


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    state["admin_id"] = data["user"]["id"]
    return data["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Auth ----------
class TestAuth:
    def test_login_admin_ok(self):
        r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert "access_token" in d and len(d["access_token"]) > 20
        assert d["user"]["username"] == "admin"
        assert d["user"]["role"] == "admin"

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USERNAME, "password": "wrong-pass"})
        assert r.status_code == 401

    def test_login_unknown_user(self):
        r = requests.post(f"{API}/auth/login", json={"username": "nope_user", "password": "whatever"})
        assert r.status_code == 401

    def test_me_with_token(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["username"] == "admin"
        assert d["role"] == "admin"

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_projects_no_token_unauthorized(self):
        r = requests.get(f"{API}/projects")
        assert r.status_code == 401


# ---------- Users (admin only) + role-based access ----------
class TestUsersAndRoles:
    def test_admin_create_user_role(self, admin_headers):
        uname = f"TEST_user_{uuid.uuid4().hex[:8]}"
        r = requests.post(f"{API}/users", headers=admin_headers, json={
            "username": uname, "password": "Passw0rd!", "full_name": "Test User Role", "role": "user"
        })
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["username"] == uname
        assert d["role"] == "user"
        assert "id" in d
        state["user_username"] = uname
        state["user_id"] = d["id"]
        state["user_password"] = "Passw0rd!"

    def test_admin_create_customer_role(self, admin_headers):
        uname = f"TEST_cust_{uuid.uuid4().hex[:8]}"
        r = requests.post(f"{API}/users", headers=admin_headers, json={
            "username": uname, "password": "Passw0rd!", "full_name": "Test Customer", "role": "customer"
        })
        assert r.status_code == 201
        d = r.json()
        assert d["role"] == "customer"
        state["customer_username"] = uname
        state["customer_id"] = d["id"]
        state["customer_password"] = "Passw0rd!"

    def test_login_user_and_customer(self):
        r1 = requests.post(f"{API}/auth/login", json={"username": state["user_username"], "password": state["user_password"]})
        assert r1.status_code == 200
        state["user_token"] = r1.json()["access_token"]

        r2 = requests.post(f"{API}/auth/login", json={"username": state["customer_username"], "password": state["customer_password"]})
        assert r2.status_code == 200
        state["customer_token"] = r2.json()["access_token"]

    def test_non_admin_cannot_create_user(self):
        h = {"Authorization": f"Bearer {state['user_token']}"}
        r = requests.post(f"{API}/users", headers=h, json={
            "username": "TEST_nope", "password": "x123456", "role": "user"
        })
        assert r.status_code == 403

    def test_admin_cannot_delete_self(self, admin_headers):
        r = requests.delete(f"{API}/users/{state['admin_id']}", headers=admin_headers)
        assert r.status_code == 400


# ---------- Projects CRUD + role visibility + file upload ----------
class TestProjectsAndFiles:
    def test_admin_create_project_no_customer(self, admin_headers):
        r = requests.post(f"{API}/projects", headers=admin_headers, json={
            "name": "TEST_Project_Public",
            "industry": "bess",
            "plc_brand": "siemens",
            "status": "in_design",
            "description": "test project",
            "parameters": {"voltage": "400V", "power_kw": 250},
        })
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["name"] == "TEST_Project_Public"
        assert d["files"] == []
        assert "id" in d and "created_at" in d
        state["pub_project_id"] = d["id"]

    def test_admin_create_project_for_customer(self, admin_headers):
        r = requests.post(f"{API}/projects", headers=admin_headers, json={
            "name": "TEST_Project_ForCustomer",
            "industry": "data_center",
            "plc_brand": "rockwell",
            "status": "draft",
            "customer_user_id": state["customer_id"],
            "parameters": {"foo": "bar"},
        })
        assert r.status_code == 201
        state["cust_project_id"] = r.json()["id"]

    def test_non_admin_cannot_create_project(self):
        h = {"Authorization": f"Bearer {state['user_token']}"}
        r = requests.post(f"{API}/projects", headers=h, json={"name": "TEST_NoAuth"})
        assert r.status_code == 403

    def test_user_role_sees_all_projects(self):
        h = {"Authorization": f"Bearer {state['user_token']}"}
        r = requests.get(f"{API}/projects", headers=h)
        assert r.status_code == 200
        ids = {p["id"] for p in r.json()}
        assert state["pub_project_id"] in ids
        assert state["cust_project_id"] in ids

    def test_customer_role_sees_only_assigned(self):
        h = {"Authorization": f"Bearer {state['customer_token']}"}
        r = requests.get(f"{API}/projects", headers=h)
        assert r.status_code == 200
        ids = {p["id"] for p in r.json()}
        assert state["cust_project_id"] in ids
        assert state["pub_project_id"] not in ids

    def test_customer_cannot_get_unassigned_project(self):
        h = {"Authorization": f"Bearer {state['customer_token']}"}
        r = requests.get(f"{API}/projects/{state['pub_project_id']}", headers=h)
        assert r.status_code == 404

    def test_admin_patch_project(self, admin_headers):
        r = requests.patch(f"{API}/projects/{state['pub_project_id']}", headers=admin_headers, json={
            "name": "TEST_Project_Public_Updated",
            "status": "in_production",
        })
        assert r.status_code == 200, r.text
        assert r.json()["name"] == "TEST_Project_Public_Updated"
        # verify persisted
        r2 = requests.get(f"{API}/projects/{state['pub_project_id']}", headers=admin_headers)
        assert r2.status_code == 200
        assert r2.json()["status"] == "in_production"

    def test_admin_upload_file(self, admin_headers):
        png_bytes = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
            b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
            b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        files = {"file": ("test.png", io.BytesIO(png_bytes), "image/png")}
        r = requests.post(f"{API}/projects/{state['pub_project_id']}/files",
                          headers=admin_headers, files=files)
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["filename"] == "test.png"
        assert d["size"] == len(png_bytes)
        state["file_id"] = d["id"]

        # verify it appears in GET project
        g = requests.get(f"{API}/projects/{state['pub_project_id']}", headers=admin_headers)
        assert g.status_code == 200
        fids = [f["id"] for f in g.json()["files"]]
        assert state["file_id"] in fids

    def test_non_admin_cannot_upload_file(self):
        h = {"Authorization": f"Bearer {state['user_token']}"}
        files = {"file": ("x.png", io.BytesIO(b"\x89PNG\r\n"), "image/png")}
        r = requests.post(f"{API}/projects/{state['pub_project_id']}/files", headers=h, files=files)
        assert r.status_code == 403

    def test_admin_delete_file(self, admin_headers):
        r = requests.delete(f"{API}/projects/{state['pub_project_id']}/files/{state['file_id']}", headers=admin_headers)
        assert r.status_code == 204
        # verify gone
        g = requests.get(f"{API}/projects/{state['pub_project_id']}", headers=admin_headers)
        fids = [f["id"] for f in g.json()["files"]]
        assert state["file_id"] not in fids

    def test_admin_delete_project(self, admin_headers):
        r = requests.delete(f"{API}/projects/{state['pub_project_id']}", headers=admin_headers)
        assert r.status_code == 204
        g = requests.get(f"{API}/projects/{state['pub_project_id']}", headers=admin_headers)
        assert g.status_code == 404


# ---------- Public lead endpoint still works ----------
class TestPublicLeads:
    def test_create_lead_no_auth(self):
        r = requests.post(f"{API}/leads", json={
            "name": "TEST Lead",
            "company": "TestCo",
            "email": "test@example.com",
            "phone": "12345",
            "industry": "bess",
            "plc_brand": "siemens",
            "project_description": "A short project description for testing purposes."
        })
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["name"] == "TEST Lead"
        assert "id" in d


# ---------- Cleanup ----------
def test_zz_cleanup():
    # delete test users with admin token
    r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        return
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    for uid_key in ("user_id", "customer_id"):
        uid = state.get(uid_key)
        if uid:
            requests.delete(f"{API}/users/{uid}", headers=h)
    # remove any lingering project
    pid = state.get("cust_project_id")
    if pid:
        requests.delete(f"{API}/projects/{pid}", headers=h)
