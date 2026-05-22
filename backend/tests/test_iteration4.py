"""Backend tests for Topchampion Iteration 4: /api/cases, showcase toggle, file category/display_name/thumb, PATCH /api/auth/me."""
import os
import io
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://green-automation-pro.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Topchampion"

state = {}


# ---------------- Fixtures ----------------
@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login: {r.text}"
    state["admin_id"] = r.json()["user"]["id"]
    state["admin_token"] = r.json()["access_token"]
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="module")
def seeded(admin_headers):
    """Create 'user' role + 'customer' role users + a test project."""
    u = f"TEST_user_{uuid.uuid4().hex[:6]}"
    c = f"TEST_cust_{uuid.uuid4().hex[:6]}"
    pw = "Passw0rd!"
    r = requests.post(f"{API}/users", headers=admin_headers, json={"username": u, "password": pw, "role": "user", "full_name": "TEST U"})
    assert r.status_code == 201, r.text
    state["user_id"] = r.json()["id"]
    r = requests.post(f"{API}/users", headers=admin_headers, json={"username": c, "password": pw, "role": "customer", "full_name": "TEST C"})
    assert r.status_code == 201, r.text
    state["cust_id"] = r.json()["id"]

    state["user_token"] = requests.post(f"{API}/auth/login", json={"username": u, "password": pw}).json()["access_token"]
    state["cust_token"] = requests.post(f"{API}/auth/login", json={"username": c, "password": pw}).json()["access_token"]

    pr = requests.post(f"{API}/projects", headers=admin_headers, json={
        "name": f"TEST_SC_{uuid.uuid4().hex[:6]}",
        "industry": "bess", "plc_brand": "siemens", "status": "delivered",
    })
    assert pr.status_code == 201, pr.text
    state["pid"] = pr.json()["id"]
    state["user_username"] = u
    state["cust_username"] = c
    state["user_password"] = pw
    yield
    # cleanup
    requests.delete(f"{API}/projects/{state['pid']}", headers=admin_headers)
    for uid in (state.get("user_id"), state.get("cust_id")):
        if uid:
            requests.delete(f"{API}/users/{uid}", headers=admin_headers)


# ---------------- /api/projects/{id}/showcase ----------------
class TestShowcase:
    def test_admin_toggle_showcase_on(self, admin_headers, seeded):
        r = requests.patch(f"{API}/projects/{state['pid']}/showcase", headers=admin_headers, json={
            "is_showcase": True,
            "showcase_industry": "BESS",
            "showcase_quote": "Reliable PLC system",
            "showcase_author": "Tester",
            "showcase_metric": "99.9% uptime",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["is_showcase"] is True
        assert d["showcase_industry"] == "BESS"
        assert d["showcase_metric"] == "99.9% uptime"

    def test_user_role_can_toggle_showcase(self, seeded):
        h = {"Authorization": f"Bearer {state['user_token']}"}
        r = requests.patch(f"{API}/projects/{state['pid']}/showcase", headers=h, json={
            "is_showcase": True,
            "showcase_industry": "BESS - by user",
            "showcase_quote": "Updated by user role",
            "showcase_author": "User Role",
            "showcase_metric": "200kW",
        })
        assert r.status_code == 200, r.text
        assert r.json()["showcase_industry"] == "BESS - by user"

    def test_customer_role_forbidden(self, seeded):
        h = {"Authorization": f"Bearer {state['cust_token']}"}
        r = requests.patch(f"{API}/projects/{state['pid']}/showcase", headers=h, json={"is_showcase": False})
        assert r.status_code == 403


# ---------------- /api/cases (public) ----------------
class TestPublicCases:
    def test_cases_public_no_auth(self, seeded):
        # Ensure project is in showcase=True (set by TestShowcase first; reinforce here)
        r = requests.get(f"{API}/cases")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        ids = [it["id"] for it in items]
        assert state["pid"] in ids, "Showcase project should appear in /api/cases"
        # Check returned fields - no sensitive
        for it in items:
            assert "password_hash" not in it
            assert "files" not in it
            assert "created_by" not in it
            assert "customer_user_id" not in it
            assert "name" in it
            # showcase_* fields permitted
        sample = next(x for x in items if x["id"] == state["pid"])
        assert sample.get("showcase_quote") is not None

    def test_cases_excludes_non_showcase(self, admin_headers, seeded):
        # Create another non-showcase project and ensure it's NOT in cases
        r = requests.post(f"{API}/projects", headers=admin_headers, json={
            "name": f"TEST_nonshow_{uuid.uuid4().hex[:6]}", "industry": "other", "plc_brand": "other"
        })
        pid2 = r.json()["id"]
        try:
            r2 = requests.get(f"{API}/cases")
            ids = [it["id"] for it in r2.json()]
            assert pid2 not in ids
        finally:
            requests.delete(f"{API}/projects/{pid2}", headers=admin_headers)


# ---------------- Files: category + display_name + thumb ----------------
def _tiny_png():
    # 1x1 red PNG - valid PIL-decodable image
    import base64
    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    )


class TestFiles:
    def test_upload_drawing_with_thumb(self, admin_headers, seeded):
        png = _tiny_png()
        files = {"file": ("draw.png", io.BytesIO(png), "image/png")}
        data = {"category": "drawing"}
        r = requests.post(f"{API}/projects/{state['pid']}/files", headers=admin_headers, files=files, data=data)
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["category"] == "drawing"
        assert d["display_name"] is None
        # thumb_b64 should be data uri for image
        assert d["thumb_b64"] and d["thumb_b64"].startswith("data:image/png;base64,"), f"thumb_b64 missing/invalid: {d.get('thumb_b64')!r}"
        state["draw_file_id"] = d["id"]

    def test_upload_code_no_thumb(self, admin_headers, seeded):
        files = {"file": ("hello.py", io.BytesIO(b"print('hi')\n"), "text/x-python")}
        data = {"category": "code"}
        r = requests.post(f"{API}/projects/{state['pid']}/files", headers=admin_headers, files=files, data=data)
        assert r.status_code == 201, r.text
        d = r.json()
        assert d["category"] == "code"
        assert d["thumb_b64"] is None
        state["code_file_id"] = d["id"]

    def test_default_category_is_drawing(self, admin_headers, seeded):
        files = {"file": ("def.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf")}
        r = requests.post(f"{API}/projects/{state['pid']}/files", headers=admin_headers, files=files)
        assert r.status_code == 201
        assert r.json()["category"] == "drawing"

    def test_patch_file_display_name(self, admin_headers, seeded):
        r = requests.patch(
            f"{API}/projects/{state['pid']}/files/{state['draw_file_id']}",
            headers=admin_headers,
            json={"display_name": "My Drawing"}
        )
        assert r.status_code == 200, r.text
        assert r.json()["display_name"] == "My Drawing"
        # persistence check
        g = requests.get(f"{API}/projects/{state['pid']}", headers=admin_headers)
        f = next(x for x in g.json()["files"] if x["id"] == state["draw_file_id"])
        assert f["display_name"] == "My Drawing"

    def test_patch_file_category(self, admin_headers, seeded):
        r = requests.patch(
            f"{API}/projects/{state['pid']}/files/{state['code_file_id']}",
            headers=admin_headers,
            json={"category": "drawing"}
        )
        assert r.status_code == 200
        assert r.json()["category"] == "drawing"


# ---------------- /api/auth/me PATCH ----------------
class TestSelfProfile:
    def test_update_full_name(self, seeded):
        # use 'user' role - any signed-in user should work
        h = {"Authorization": f"Bearer {state['user_token']}"}
        r = requests.patch(f"{API}/auth/me", headers=h, json={"full_name": "User Renamed"})
        assert r.status_code == 200, r.text
        assert r.json()["full_name"] == "User Renamed"

    def test_change_password_missing_current(self, seeded):
        h = {"Authorization": f"Bearer {state['user_token']}"}
        r = requests.patch(f"{API}/auth/me", headers=h, json={"new_password": "NewPass123"})
        assert r.status_code == 400

    def test_change_password_wrong_current(self, seeded):
        h = {"Authorization": f"Bearer {state['user_token']}"}
        r = requests.patch(f"{API}/auth/me", headers=h, json={
            "current_password": "WRONG", "new_password": "NewPass123"
        })
        assert r.status_code == 401

    def test_change_password_success(self, seeded):
        h = {"Authorization": f"Bearer {state['user_token']}"}
        new_pw = "BrandNew99!"
        r = requests.patch(f"{API}/auth/me", headers=h, json={
            "current_password": state["user_password"], "new_password": new_pw
        })
        assert r.status_code == 200, r.text
        # try login with new password
        lg = requests.post(f"{API}/auth/login", json={"username": state["user_username"], "password": new_pw})
        assert lg.status_code == 200
        state["user_password"] = new_pw
        state["user_token"] = lg.json()["access_token"]

    def test_change_username_conflict(self, admin_headers, seeded):
        h = {"Authorization": f"Bearer {state['user_token']}"}
        # try to take admin's username
        r = requests.patch(f"{API}/auth/me", headers=h, json={"new_username": "admin"})
        assert r.status_code == 409


# ---------------- Regression: leads + login still work ----------------
class TestRegression:
    def test_public_lead(self):
        r = requests.post(f"{API}/leads", json={
            "name": "TEST Lead i4", "company": "TestCo", "email": "i4@example.com",
            "phone": "1234", "industry": "bess", "plc_brand": "siemens",
            "project_description": "Iteration 4 regression test lead body."
        })
        assert r.status_code == 201

    def test_login_still_works(self):
        r = requests.post(f"{API}/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
