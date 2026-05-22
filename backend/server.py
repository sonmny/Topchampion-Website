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
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr


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


class UserUpdate(BaseModel):
    password: Optional[str] = Field(None, min_length=6, max_length=128)
    full_name: Optional[str] = Field(None, max_length=120)
    role: Optional[Role] = None


class ProjectFile(BaseModel):
    id: str
    filename: str
    size: int
    content_type: str
    uploaded_at: datetime


class ProjectIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    client_name: Optional[str] = Field(None, max_length=200)
    customer_user_id: Optional[str] = None  # owning customer (visible to that user)
    industry: Optional[Literal["tire_mfg", "bess", "data_center", "other"]] = None
    plc_brand: Optional[Literal["rockwell", "siemens", "schneider", "other"]] = None
    status: Optional[Literal["draft", "in_design", "in_production", "commissioning", "delivered", "archived"]] = "draft"
    description: Optional[str] = Field(None, max_length=4000)
    parameters: Optional[dict] = None  # arbitrary key/value technical parameters
    drawing_urls: Optional[List[str]] = None  # external drawing links


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
class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    company: str = Field(..., min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=40)
    industry: Literal["tire_mfg", "bess", "data_center", "other"]
    plc_brand: Literal["rockwell", "siemens", "schneider"]
    project_description: str = Field(..., min_length=5, max_length=4000)


class Lead(LeadCreate):
    id: str
    created_at: datetime


@api_router.post("/leads", response_model=Lead, status_code=201)
async def create_lead(payload: LeadCreate):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.leads.insert_one(dict(doc))
    return _serialize(doc)


@api_router.get("/leads", response_model=List[Lead])
async def list_leads(_: dict = Depends(require_admin)):
    docs = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [_serialize(d) for d in docs]


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
    doc = {
        "id": str(uuid.uuid4()),
        "username": payload.username.strip(),
        "password_hash": hash_password(payload.password),
        "full_name": payload.full_name,
        "role": payload.role,
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
        # Prevent admin from demoting themselves if they are the last admin
        if existing["id"] == current["id"] and payload.role != "admin":
            admin_count = await db.users.count_documents({"role": "admin"})
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot demote the last admin")
        upd["role"] = payload.role
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


@projects_router.post("/{pid}/files", response_model=ProjectFile, status_code=201)
async def upload_project_file(pid: str, file: UploadFile = File(...), _: dict = Depends(require_admin)):
    project = await db.projects.find_one({"id": pid}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large (max {MAX_UPLOAD_BYTES // (1024*1024)} MB)")
    file_id = str(uuid.uuid4())
    suffix = Path(file.filename or "").suffix.lower() or ".bin"
    if suffix not in (".pdf", ".png", ".jpg", ".jpeg", ".webp", ".dwg", ".bin"):
        suffix = ".bin"
    disk_path = UPLOAD_DIR / f"{file_id}{suffix}"
    with open(disk_path, "wb") as fh:
        fh.write(data)
    meta = {
        "id": file_id,
        "filename": file.filename or f"upload{suffix}",
        "size": len(data),
        "content_type": file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream",
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "_ext": suffix,
    }
    await db.projects.update_one({"id": pid}, {"$push": {"files": meta}, "$set": {"updated_at": meta["uploaded_at"]}})
    out = {k: v for k, v in meta.items() if not k.startswith("_")}
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


api_router.include_router(projects_router)


# ---------------- Mount + CORS ----------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,  # Bearer header, no cookies needed
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
