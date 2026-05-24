"""Iteration 7 backend tests - Phase 10.

Covers:
- GET /api/dashboard/stats (admin + non-admin)
- GET /api/site/stats sanity (regression)
- GET /api/site/certifications (regression + order check)
- Certification image upload (multipart PATCH) — persist for multiple certs
- engineering-images CRUD (POST/GET/PATCH/DELETE/admin gate)
- Image streaming /api/site/engineering-images/{id}/image
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

# 1x1 PNG
PNG_BYTES = bytes.fromhex(
    "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C489"
    "0000000D49444154789C636000000000020001E2210BCF0000000049454E44AE426082"
)


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login",
                      json={"username": ADMIN_USER, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def H(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def cleanup(H):
    bag = {"eng_images": [], "users": [], "test_token": None}
    yield bag
    for eid in bag["eng_images"]:
        try:
            requests.delete(f"{API}/site/engineering-images/{eid}", headers=H, timeout=10)
        except Exception:
            pass
    for uid in bag["users"]:
        try:
            requests.delete(f"{API}/users/{uid}", headers=H, timeout=10)
        except Exception:
            pass


# ---------- Dashboard stats ----------
class TestDashboardStats:
    def test_unauth(self):
        r = requests.get(f"{API}/dashboard/stats", timeout=10)
        assert r.status_code == 401

    def test_admin_full_payload(self, H):
        r = requests.get(f"{API}/dashboard/stats", headers=H, timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        for k in ("projects_total", "projects_pending_review",
                  "leads_total", "leads_unread", "leads_today",
                  "users_total", "can_see_leads"):
            assert k in body, f"missing key {k}"
        assert body["can_see_leads"] is True
        assert isinstance(body["projects_total"], int)
        assert isinstance(body["users_total"], int)
        assert body["users_total"] >= 1  # admin itself

    def test_non_admin_no_leads(self, H, cleanup):
        # Create a `user` role test user WITHOUT view_leads permission
        uname = f"TEST_R7_user_{uuid.uuid4().hex[:6]}"
        payload = {
            "username": uname,
            "password": "Passw0rd!",
            "full_name": "TEST_R7 user",
            "role": "user",
            "permissions": ["view_progress"],
        }
        r = requests.post(f"{API}/users", json=payload, headers=H, timeout=10)
        assert r.status_code in (200, 201), r.text
        uid = r.json()["id"]
        cleanup["users"].append(uid)

        # Login as that user
        rl = requests.post(f"{API}/auth/login",
                           json={"username": uname, "password": "Passw0rd!"}, timeout=10)
        assert rl.status_code == 200, rl.text
        tok = rl.json()["access_token"]
        H2 = {"Authorization": f"Bearer {tok}"}

        rs = requests.get(f"{API}/dashboard/stats", headers=H2, timeout=10)
        assert rs.status_code == 200, rs.text
        body = rs.json()
        assert body["can_see_leads"] is False
        # leads_* should be zero when not allowed
        assert body["leads_total"] == 0
        assert body["leads_unread"] == 0
        assert body["leads_today"] == 0
        # users_total only for admin
        assert body["users_total"] == 0


# ---------- Site stats (regression for Stats counter feed) ----------
class TestSiteStatsPublic:
    def test_get(self):
        r = requests.get(f"{API}/site/stats", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # Phase 10: spec mentions 20, 4, 27+, 28
        values = [s.get("value") for s in data if s.get("enabled", True)]
        assert len(values) >= 1, "expected at least one enabled stat"


# ---------- Certifications regression + image upload persistence ----------
class TestCertificationsCMS:
    def test_public_list_count_and_order(self):
        r = requests.get(f"{API}/site/certifications", timeout=10)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 1, "Expected at least 1 certification"
        # Verify sorted by order ascending
        orders = [c.get("order", 0) for c in items]
        assert orders == sorted(orders), f"certs not sorted by order: {orders}"

    def test_upload_image_for_two_certs(self, H):
        ra = requests.get(f"{API}/site/certifications/admin", headers=H, timeout=10)
        assert ra.status_code == 200
        certs = ra.json()
        assert len(certs) >= 2, "Need at least 2 certs to test multi-upload"

        first_two = certs[:2]
        for cert in first_two:
            cid = cert["id"]
            files = {"image": (f"cert_{cid}.png", io.BytesIO(PNG_BYTES), "image/png")}
            # PATCH multipart with image only
            rp = requests.patch(f"{API}/site/certifications/{cid}",
                                headers=H, files=files, timeout=15)
            assert rp.status_code == 200, f"PATCH cert {cid} failed: {rp.status_code} {rp.text}"
            body = rp.json()
            assert body.get("image_url"), f"image_url empty after upload for {cid}"
            assert body["image_url"].endswith(f"/certifications/{cid}/image")

            # Fetch the actual binary
            rg = requests.get(f"{BASE_URL}{body['image_url']}", timeout=10)
            assert rg.status_code == 200, f"image stream failed for {cid}: {rg.status_code}"
            assert rg.headers.get("content-type", "").startswith("image/")

        # Ensure both persisted independently (not the same record overwritten)
        rl = requests.get(f"{API}/site/certifications/admin", headers=H, timeout=10)
        ids_with_image = {c["id"] for c in rl.json() if c.get("image_url")}
        for cert in first_two:
            assert cert["id"] in ids_with_image, f"image_url lost on {cert['id']}"


# ---------- Engineering Images CRUD ----------
class TestEngineeringImagesCRUD:
    def test_public_list_unauth(self):
        r = requests.get(f"{API}/site/engineering-images", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_list_requires_auth(self):
        r = requests.get(f"{API}/site/engineering-images/admin", timeout=10)
        assert r.status_code == 401

    def test_admin_list_with_auth(self, H):
        r = requests.get(f"{API}/site/engineering-images/admin", headers=H, timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_requires_auth(self):
        files = {"image": ("e.png", io.BytesIO(PNG_BYTES), "image/png")}
        r = requests.post(f"{API}/site/engineering-images",
                          data={"caption_en": "x", "caption_cn": "x"},
                          files=files, timeout=15)
        assert r.status_code in (401, 403)

    def test_create_engineering_image(self, H, cleanup):
        files = {"image": ("eng_test.png", io.BytesIO(PNG_BYTES), "image/png")}
        data = {"caption_en": "TEST_R7 Engineering EN",
                "caption_cn": "TEST_R7 工程",
                "order": 5, "enabled": "true"}
        r = requests.post(f"{API}/site/engineering-images",
                          headers=H, data=data, files=files, timeout=15)
        assert r.status_code == 201, r.text
        body = r.json()
        assert body["caption_en"] == "TEST_R7 Engineering EN"
        assert body["caption_cn"] == "TEST_R7 工程"
        assert body["order"] == 5
        assert body["enabled"] is True
        assert body["image_url"].endswith(f"/engineering-images/{body['id']}/image")
        cleanup["eng_images"].append(body["id"])

        # Public listing includes the new image
        rl = requests.get(f"{API}/site/engineering-images", timeout=10)
        ids = [x["id"] for x in rl.json()]
        assert body["id"] in ids

        # Image stream works
        rs = requests.get(f"{BASE_URL}{body['image_url']}", timeout=10)
        assert rs.status_code == 200
        assert rs.headers.get("content-type", "").startswith("image/")

    def test_patch_engineering_image(self, H, cleanup):
        eid = cleanup["eng_images"][0]
        r = requests.patch(f"{API}/site/engineering-images/{eid}",
                           headers=H,
                           data={"caption_en": "TEST_R7 Updated", "order": "10"},
                           timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["caption_en"] == "TEST_R7 Updated"
        assert body["order"] == 10

    def test_disable_hides_from_public(self, H, cleanup):
        eid = cleanup["eng_images"][0]
        r = requests.patch(f"{API}/site/engineering-images/{eid}",
                           headers=H, data={"enabled": "false"}, timeout=10)
        assert r.status_code == 200
        # public should not include it
        rl = requests.get(f"{API}/site/engineering-images", timeout=10)
        assert eid not in [x["id"] for x in rl.json()]
        # Re-enable for follow-up tests
        requests.patch(f"{API}/site/engineering-images/{eid}",
                       headers=H, data={"enabled": "true"}, timeout=10)

    def test_order_ascending_public(self, H, cleanup):
        # Create a second image with order=1, expect it to come before order=10
        files = {"image": ("eng_2.png", io.BytesIO(PNG_BYTES), "image/png")}
        r = requests.post(f"{API}/site/engineering-images",
                          headers=H,
                          data={"caption_en": "TEST_R7 First", "caption_cn": "第一",
                                "order": 1, "enabled": "true"},
                          files=files, timeout=15)
        assert r.status_code == 201
        eid2 = r.json()["id"]
        cleanup["eng_images"].append(eid2)
        rl = requests.get(f"{API}/site/engineering-images", timeout=10)
        items = rl.json()
        # Only consider our two TEST_R7 items
        test_items = [i for i in items if i["id"] in cleanup["eng_images"]]
        orders = [i["order"] for i in test_items]
        assert orders == sorted(orders), f"public list not sorted by order: {orders}"

    def test_delete_engineering_image(self, H, cleanup):
        # Create a temp one to delete
        files = {"image": ("eng_del.png", io.BytesIO(PNG_BYTES), "image/png")}
        r = requests.post(f"{API}/site/engineering-images",
                          headers=H,
                          data={"caption_en": "TEST_R7 ToDelete", "caption_cn": "删除"},
                          files=files, timeout=15)
        assert r.status_code == 201
        eid = r.json()["id"]
        rd = requests.delete(f"{API}/site/engineering-images/{eid}",
                             headers=H, timeout=10)
        assert rd.status_code == 204
        # Image stream now 404
        rs = requests.get(f"{API}/site/engineering-images/{eid}/image", timeout=10)
        assert rs.status_code == 404
