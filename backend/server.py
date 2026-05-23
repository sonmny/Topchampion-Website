from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import mimetypes
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
import base64
import io
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr

try:
    from PIL import Image
    PIL_AVAILABLE = True
except Exception:
    PIL_AVAILABLE = False

from notifications import send_new_lead_email
from cms import register_cms_routes, seed_cms_defaults


# ---------------- Config ----------------
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRES_HOURS = 12
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
UPLOAD_DIR = Path(os.environ.get('UPLOAD_DIR', str(ROOT_DIR / 'uploads')))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = int(os.environ.get('MAX_UPLOAD_MB', '25')) * 1024 * 1024

Role = Literal["admin", "user", "customer"]
Department = Literal["sales", "design", "engineering", "finance", "it"]
PERMISSION_SET = {"view_leads", "edit_projects", "delete_projects", "manage_files"}

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Topchampion API")
api_router = APIRouter(prefix="/api")

logger = logging.getLogger("topchampion")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


# ---------------- Auth helpers ----------------
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, username: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRES_HOURS),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _extract_token(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return request.cookies.get("access_token")


async def get_current_user(request: Request) -> dict:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def has_perm(user: dict, perm: str) -> bool:
    if user.get("role") == "admin":
        return True
    return perm in (user.get("permissions") or [])


def require_perm(*perms: str):
    """Allow if admin OR user has at least one of the listed perms."""
    async def _dep(current=Depends(get_current_user)):
        if any(has_perm(current, p) for p in perms):
            return current
        raise HTTPException(status_code=403, detail="Forbidden")
    return _dep


def require_role(*allowed: str):
    async def _dep(current=Depends(get_current_user)):
        if current["role"] not in allowed:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current
    return _dep


require_admin = require_role("admin")


# ---------------- Models ----------------
class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    full_name: Optional[str] = None
    role: Role
    department: Optional[Department] = None
    permissions: List[str] = []
    created_at: datetime


class LoginIn(BaseModel):
    username: str = Field(..., min_length=2, max_length=64)
    password: str = Field(..., min_length=1, max_length=128)


class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserCreate(BaseModel):
    username: str = Field(..., min_length=2, max_length=64)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: Optional[str] = Field(None, max_length=120)
    role: Role
    department: Optional[Department] = None
    permissions: Optional[List[str]] = None


class UserUpdate(BaseModel):
    password: Optional[str] = Field(None, min_length=6, max_length=128)
    full_name: Optional[str] = Field(None, max_length=120)
    role: Optional[Role] = None
    department: Optional[Department] = None
    permissions: Optional[List[str]] = None


class ProjectFile(BaseModel):
    id: str
    filename: str
    display_name: Optional[str] = None
    category: Literal["code", "drawing"] = "drawing"
    size: int
    content_type: str
    uploaded_at: datetime
    thumb_b64: Optional[str] = None  # base64 PNG data-uri for image previews


class ProjectIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    client_name: Optional[str] = Field(None, max_length=200)
    customer_user_id: Optional[str] = None  # owning customer (visible to that user)
    industry: Optional[Literal["tire_mfg", "semiconductor", "power_generation", "auto_ev", "data_center", "bess", "other"]] = None
    plc_brand: Optional[Literal["rockwell", "siemens", "schneider", "other"]] = None
    status: Optional[Literal["draft", "in_design", "in_production", "commissioning", "delivered", "archived"]] = "draft"
    description: Optional[str] = Field(None, max_length=4000)
    parameters: Optional[dict] = None  # arbitrary key/value technical parameters (legacy, no longer editable from UI)
    drawing_urls: Optional[List[str]] = None  # external drawing links (legacy, no longer editable from UI)
    # Public showcase / case-study fields (editable by admin + user)
    is_showcase: Optional[bool] = False
    showcase_industry: Optional[str] = Field(None, max_length=120)
    showcase_quote: Optional[str] = Field(None, max_length=600)
    showcase_author: Optional[str] = Field(None, max_length=120)
    showcase_metric: Optional[str] = Field(None, max_length=60)


class ShowcaseUpdate(BaseModel):
    is_showcase: bool
    showcase_industry: Optional[str] = Field(None, max_length=120)
    showcase_quote: Optional[str] = Field(None, max_length=600)
    showcase_author: Optional[str] = Field(None, max_length=120)
    showcase_metric: Optional[str] = Field(None, max_length=60)


class FileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=200)
    category: Optional[Literal["code", "drawing"]] = None


class SelfProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=120)
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=6, max_length=128)
    new_username: Optional[str] = Field(None, min_length=2, max_length=64)


class ProjectOut(ProjectIn):
    id: str
    files: List[ProjectFile] = []
    created_at: datetime
    updated_at: datetime
    created_by: str


# ---------------- Helpers ----------------
def _serialize(doc: dict) -> dict:
    doc.pop("_id", None)
    for k in ("created_at", "updated_at", "uploaded_at"):
        if k in doc and isinstance(doc[k], str):
            try:
                doc[k] = datetime.fromisoformat(doc[k])
            except ValueError:
                pass
    if "files" in doc and isinstance(doc["files"], list):
        for f in doc["files"]:
            if isinstance(f.get("uploaded_at"), str):
                try:
                    f["uploaded_at"] = datetime.fromisoformat(f["uploaded_at"])
                except ValueError:
                    pass
    return doc


async def _scoped_project_filter(current: dict) -> dict:
    if current["role"] == "customer":
        return {"customer_user_id": current["id"]}
    return {}


# ---------------- Startup ----------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("username", unique=True)
    await db.projects.create_index("created_at")
    # Seed CMS defaults (idempotent)
    await seed_cms_defaults(db)
    # Seed admin
    existing = await db.users.find_one({"username": ADMIN_USERNAME})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "username": ADMIN_USERNAME,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "full_name": "System Administrator",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin user '%s'", ADMIN_USERNAME)
    else:
        # Ensure password matches current .env value (idempotent)
        if not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
            await db.users.update_one(
                {"username": ADMIN_USERNAME},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD), "role": "admin"}}
            )
            logger.info("Updated admin password hash from .env")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ---------------- Public endpoints ----------------
@api_router.get("/")
async def root():
    return {"service": "topchampion-automation", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy", "time": datetime.now(timezone.utc).isoformat()}


# ----- Existing leads (public form) -----
class LeadFile(BaseModel):
    id: str
    filename: str
    size: int
    content_type: str
    uploaded_at: datetime


class Lead(BaseModel):
    id: str
    name: str
    company: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    industry: Literal["tire_mfg", "semiconductor", "power_generation", "auto_ev", "data_center", "bess", "other"]
    country: Optional[str] = None
    project_description: str
    file_meta: Optional[LeadFile] = None
    status: Literal["new", "viewed", "closed"] = "new"
    created_at: datetime


ALLOWED_LEAD_FILE_EXT = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".dwg", ".doc", ".docx", ".xls", ".xlsx", ".zip"}


@api_router.post("/leads", response_model=Lead, status_code=201)
async def create_lead(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    company: str = Form(...),
    industry: str = Form(...),
    project_description: str = Form(...),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    if industry not in ("tire_mfg", "semiconductor", "power_generation", "auto_ev", "data_center", "bess", "other"):
        raise HTTPException(status_code=422, detail="Invalid industry")
    if len(project_description.strip()) < 5:
        raise HTTPException(status_code=422, detail="project_description too short")
    lead_id = str(uuid.uuid4())
    file_meta = None
    if file is not None and file.filename:
        suffix = Path(file.filename).suffix.lower()
        if suffix not in ALLOWED_LEAD_FILE_EXT:
            raise HTTPException(status_code=415, detail=f"Unsupported file type {suffix}")
        data = await file.read()
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail=f"File too large (max {MAX_UPLOAD_BYTES // (1024*1024)} MB)")
        fid = str(uuid.uuid4())
        disk_path = UPLOAD_DIR / f"lead_{fid}{suffix}"
        with open(disk_path, "wb") as fh:
            fh.write(data)
        file_meta = {
            "id": fid,
            "filename": file.filename,
            "size": len(data),
            "content_type": file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream",
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "_ext": suffix,
        }
    doc = {
        "id": lead_id,
        "name": name.strip(),
        "company": company.strip(),
        "email": email.strip() if email else None,
        "phone": phone.strip() if phone else None,
        "industry": industry,
        "country": country.strip() if country else None,
        "project_description": project_description.strip(),
        "file_meta": file_meta,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.leads.insert_one(dict(doc))
    out = dict(doc)
    if out.get("file_meta"):
        out["file_meta"] = {k: v for k, v in out["file_meta"].items() if not k.startswith("_")}
    # Fire-and-forget sales-notification email (non-blocking, never raises)
    background_tasks.add_task(send_new_lead_email, out)
    return _serialize(out)


@api_router.get("/leads", response_model=List[Lead])
async def list_leads(_: dict = Depends(require_perm("view_leads"))):
    docs = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    cleaned = []
    for d in docs:
        if d.get("file_meta"):
            d["file_meta"] = {k: v for k, v in d["file_meta"].items() if not k.startswith("_")}
        cleaned.append(_serialize(d))
    return cleaned


@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, current=Depends(require_perm("view_leads"))):
    doc = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    # Mark viewed
    if doc.get("status") == "new":
        await db.leads.update_one({"id": lead_id}, {"$set": {"status": "viewed"}})
        doc["status"] = "viewed"
    if doc.get("file_meta"):
        doc["file_meta"] = {k: v for k, v in doc["file_meta"].items() if not k.startswith("_")}
    return _serialize(doc)


@api_router.patch("/leads/{lead_id}", response_model=Lead)
async def update_lead_status(lead_id: str, status: str = Form(...), _: dict = Depends(require_perm("view_leads"))):
    if status not in ("new", "viewed", "closed"):
        raise HTTPException(status_code=422, detail="Invalid status")
    res = await db.leads.update_one({"id": lead_id}, {"$set": {"status": status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    doc = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if doc.get("file_meta"):
        doc["file_meta"] = {k: v for k, v in doc["file_meta"].items() if not k.startswith("_")}
    return _serialize(doc)


@api_router.get("/leads/{lead_id}/file")
async def download_lead_file(lead_id: str, _: dict = Depends(require_perm("view_leads"))):
    doc = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not doc or not doc.get("file_meta"):
        raise HTTPException(status_code=404, detail="File not found")
    fm = doc["file_meta"]
    ext = fm.get("_ext") or Path(fm["filename"]).suffix.lower() or ".bin"
    disk_path = UPLOAD_DIR / f"lead_{fm['id']}{ext}"
    if not disk_path.exists():
        raise HTTPException(status_code=410, detail="File missing on disk")
    return FileResponse(disk_path, media_type=fm.get("content_type", "application/octet-stream"), filename=fm["filename"])


# ---------------- Auth ----------------
auth_router = APIRouter(prefix="/auth")


@auth_router.post("/login", response_model=LoginOut)
async def login(payload: LoginIn):
    user = await db.users.find_one({"username": payload.username.strip()})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(user["id"], user["username"], user["role"])
    return LoginOut(
        access_token=token,
        user=UserOut(
            id=user["id"],
            username=user["username"],
            full_name=user.get("full_name"),
            role=user["role"],
            created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"],
        ),
    )


@auth_router.get("/me", response_model=UserOut)
async def me(current=Depends(get_current_user)):
    return _serialize(dict(current))


@auth_router.post("/logout")
async def logout():
    return {"ok": True}


api_router.include_router(auth_router)


# ---------------- Users (admin only) ----------------
users_router = APIRouter(prefix="/users")


@users_router.get("", response_model=List[UserOut])
async def list_users(_: dict = Depends(require_admin)):
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return [_serialize(d) for d in docs]


@users_router.post("", response_model=UserOut, status_code=201)
async def create_user(payload: UserCreate, _: dict = Depends(require_admin)):
    if await db.users.find_one({"username": payload.username.strip()}):
        raise HTTPException(status_code=409, detail="Username already exists")
    perms = [p for p in (payload.permissions or []) if p in PERMISSION_SET]
    doc = {
        "id": str(uuid.uuid4()),
        "username": payload.username.strip(),
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "role": payload.role,
        "department": payload.department,
        "permissions": perms,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(dict(doc))
    out = {k: v for k, v in doc.items() if k != "password_hash"}
    return _serialize(out)


@users_router.patch("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, payload: UserUpdate, current: dict = Depends(require_admin)):
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    upd = {}
    if payload.password:
        upd["password_hash"] = hash_password(payload.password)
    if payload.full_name is not None:
        upd["full_name"] = payload.full_name
    if payload.role:
        if existing["id"] == current["id"] and payload.role != "admin":
            admin_count = await db.users.count_documents({"role": "admin"})
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot demote the last admin")
        upd["role"] = payload.role
    if payload.department is not None:
        upd["department"] = payload.department
    if payload.permissions is not None:
        upd["permissions"] = [p for p in payload.permissions if p in PERMISSION_SET]
    if upd:
        await db.users.update_one({"id": user_id}, {"$set": upd})
    fresh = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return _serialize(fresh)


@users_router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str, current: dict = Depends(require_admin)):
    if user_id == current["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    res = await db.users.delete_one({"id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")


api_router.include_router(users_router)


# ---------------- Projects ----------------
projects_router = APIRouter(prefix="/projects")


@projects_router.get("", response_model=List[ProjectOut])
async def list_projects(current=Depends(get_current_user)):
    filt = await _scoped_project_filter(current)
    docs = await db.projects.find(filt, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [_serialize(d) for d in docs]


@projects_router.post("", response_model=ProjectOut, status_code=201)
async def create_project(payload: ProjectIn, current=Depends(require_admin)):
    now = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc.update({
        "id": str(uuid.uuid4()),
        "files": [],
        "created_at": now,
        "updated_at": now,
        "created_by": current["id"],
    })
    await db.projects.insert_one(dict(doc))
    return _serialize(doc)


@projects_router.get("/{pid}", response_model=ProjectOut)
async def get_project(pid: str, current=Depends(get_current_user)):
    filt = {"id": pid}
    filt.update(await _scoped_project_filter(current))
    doc = await db.projects.find_one(filt, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return _serialize(doc)


@projects_router.patch("/{pid}", response_model=ProjectOut)
async def update_project(pid: str, payload: ProjectIn, _: dict = Depends(require_admin)):
    upd = {k: v for k, v in payload.model_dump().items() if v is not None}
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.projects.update_one({"id": pid}, {"$set": upd})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    doc = await db.projects.find_one({"id": pid}, {"_id": 0})
    return _serialize(doc)


@projects_router.delete("/{pid}", status_code=204)
async def delete_project(pid: str, _: dict = Depends(require_admin)):
    doc = await db.projects.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    # Best-effort cleanup of uploaded files on disk
    for f in doc.get("files", []):
        for ext in (".bin", ".pdf", ".png", ".jpg", ".jpeg", ".dwg", ".webp"):
            p = UPLOAD_DIR / f"{f['id']}{ext}"
            if p.exists():
                try:
                    p.unlink()
                except Exception:
                    pass
    await db.projects.delete_one({"id": pid})


def _make_thumb_b64(data: bytes, content_type: str, suffix: str) -> Optional[str]:
    """Generate a small base64 PNG data-uri thumbnail for image files only."""
    if not PIL_AVAILABLE:
        return None
    is_image = (content_type or "").startswith("image/") or suffix in (".png", ".jpg", ".jpeg", ".webp")
    if not is_image:
        return None
    try:
        im = Image.open(io.BytesIO(data))
        im.thumbnail((280, 280))
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGB")
        buf = io.BytesIO()
        im.save(buf, format="PNG", optimize=True)
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
    except Exception:
        return None


@projects_router.post("/{pid}/files", response_model=ProjectFile, status_code=201)
async def upload_project_file(
    pid: str,
    file: UploadFile = File(...),
    category: str = Form("drawing"),
    display_name: Optional[str] = Form(None),
    _: dict = Depends(require_admin),
):
    project = await db.projects.find_one({"id": pid}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if category not in ("code", "drawing"):
        category = "drawing"
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large (max {MAX_UPLOAD_BYTES // (1024*1024)} MB)")
    file_id = str(uuid.uuid4())
    suffix = Path(file.filename or "").suffix.lower() or ".bin"
    if suffix not in (".pdf", ".png", ".jpg", ".jpeg", ".webp", ".dwg", ".bin", ".txt", ".json", ".xml", ".yaml", ".yml", ".py", ".js", ".csv"):
        suffix = ".bin"
    disk_path = UPLOAD_DIR / f"{file_id}{suffix}"
    with open(disk_path, "wb") as fh:
        fh.write(data)
    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
    thumb = _make_thumb_b64(data, content_type, suffix)
    meta = {
        "id": file_id,
        "filename": file.filename or f"upload{suffix}",
        "display_name": (display_name or "").strip() or None,
        "category": category,
        "size": len(data),
        "content_type": content_type,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "thumb_b64": thumb,
        "_ext": suffix,
    }
    await db.projects.update_one({"id": pid}, {"$push": {"files": meta}, "$set": {"updated_at": meta["uploaded_at"]}})
    out = {k: v for k, v in meta.items() if not k.startswith("_")}
    return _serialize(out)


@projects_router.patch("/{pid}/files/{file_id}", response_model=ProjectFile)
async def update_project_file(pid: str, file_id: str, payload: FileUpdate, _: dict = Depends(require_admin)):
    project = await db.projects.find_one({"id": pid}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    files = project.get("files", [])
    idx = next((i for i, f in enumerate(files) if f["id"] == file_id), -1)
    if idx < 0:
        raise HTTPException(status_code=404, detail="File not found")
    set_doc = {}
    if payload.display_name is not None:
        set_doc[f"files.{idx}.display_name"] = payload.display_name.strip() or None
    if payload.category is not None:
        set_doc[f"files.{idx}.category"] = payload.category
    if set_doc:
        set_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.projects.update_one({"id": pid}, {"$set": set_doc})
    fresh = await db.projects.find_one({"id": pid}, {"_id": 0})
    f = next((x for x in fresh.get("files", []) if x["id"] == file_id), None)
    out = {k: v for k, v in f.items() if not k.startswith("_")}
    return _serialize(out)


@projects_router.get("/{pid}/files/{file_id}")
async def download_project_file(pid: str, file_id: str, current=Depends(get_current_user)):
    filt = {"id": pid}
    filt.update(await _scoped_project_filter(current))
    project = await db.projects.find_one(filt, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    meta = next((f for f in project.get("files", []) if f["id"] == file_id), None)
    if not meta:
        raise HTTPException(status_code=404, detail="File not found")
    ext = meta.get("_ext") or Path(meta["filename"]).suffix.lower() or ".bin"
    disk_path = UPLOAD_DIR / f"{file_id}{ext}"
    if not disk_path.exists():
        raise HTTPException(status_code=410, detail="File missing on disk")
    return FileResponse(
        disk_path,
        media_type=meta.get("content_type", "application/octet-stream"),
        filename=meta["filename"],
    )


@projects_router.delete("/{pid}/files/{file_id}", status_code=204)
async def delete_project_file(pid: str, file_id: str, _: dict = Depends(require_admin)):
    project = await db.projects.find_one({"id": pid}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    meta = next((f for f in project.get("files", []) if f["id"] == file_id), None)
    if not meta:
        raise HTTPException(status_code=404, detail="File not found")
    ext = meta.get("_ext") or Path(meta["filename"]).suffix.lower() or ".bin"
    p = UPLOAD_DIR / f"{file_id}{ext}"
    if p.exists():
        try:
            p.unlink()
        except Exception:
            pass
    await db.projects.update_one({"id": pid}, {"$pull": {"files": {"id": file_id}}})


# Admin OR user can toggle showcase
@projects_router.patch("/{pid}/showcase", response_model=ProjectOut)
async def update_showcase(pid: str, payload: ShowcaseUpdate, current=Depends(require_role("admin", "user"))):
    project = await db.projects.find_one({"id": pid}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    upd = payload.model_dump()
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.projects.update_one({"id": pid}, {"$set": upd})
    doc = await db.projects.find_one({"id": pid}, {"_id": 0})
    return _serialize(doc)


api_router.include_router(projects_router)


# ---------------- Public case studies ----------------
class PublicCase(BaseModel):
    id: str
    showcase_industry: Optional[str] = None
    showcase_quote: Optional[str] = None
    showcase_author: Optional[str] = None
    showcase_metric: Optional[str] = None
    name: str


@api_router.get("/cases", response_model=List[PublicCase])
async def list_public_cases():
    docs = await db.projects.find(
        {"is_showcase": True},
        {"_id": 0, "id": 1, "name": 1, "showcase_industry": 1, "showcase_quote": 1, "showcase_author": 1, "showcase_metric": 1}
    ).sort("updated_at", -1).to_list(60)
    return docs


# ---------------- Self-profile (any signed-in user) ----------------
@api_router.patch("/auth/me", response_model=UserOut)
async def update_me(payload: SelfProfileUpdate, current=Depends(get_current_user)):
    upd = {}
    if payload.full_name is not None:
        upd["full_name"] = payload.full_name
    # Username change
    if payload.new_username and payload.new_username.strip() != current["username"]:
        new_u = payload.new_username.strip()
        if await db.users.find_one({"username": new_u, "id": {"$ne": current["id"]}}):
            raise HTTPException(status_code=409, detail="Username already taken")
        upd["username"] = new_u
    # Password change requires current_password verification
    if payload.new_password:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="current_password required to change password")
        existing = await db.users.find_one({"id": current["id"]})
        if not existing or not verify_password(payload.current_password, existing.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        upd["password_hash"] = hash_password(payload.new_password)
    if upd:
        await db.users.update_one({"id": current["id"]}, {"$set": upd})
    fresh = await db.users.find_one({"id": current["id"]}, {"_id": 0, "password_hash": 0})
    return _serialize(fresh)


# ---------------- CMS routes ----------------
register_cms_routes(api_router, db, UPLOAD_DIR, require_admin)


# ---------------- Mount + CORS ----------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,  # Bearer header, no cookies needed
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
