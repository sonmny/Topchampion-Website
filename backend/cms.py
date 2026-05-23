"""Site Content (CMS) router.

Generic content collections editable in the admin console:
  • certifications   — ISO / CCC / CE / High-Tech certs (with optional image)
  • case-studies     — flagship project write-ups
  • client-groups    — customer roster grouped by industry
  • partners         — ABB / Rittal / Rockwell etc. (with role + year)
  • contact-info     — singleton: address, phones, emails

All GET endpoints are public; POST/PATCH/DELETE require admin.
Image upload (certifications) reuses the existing UPLOAD_DIR pattern.
"""
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Literal, Optional
import mimetypes
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field

# Re-use helpers/decorators from the main server module to avoid circular imports.
# (server.py imports this router and mounts it.)

cms_router = APIRouter(prefix="/site", tags=["cms"])

ALLOWED_CERT_EXT = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}


# ---------------- Pydantic Models ----------------
class Certification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    code: str               # short code, e.g. "ISO 9001:2015"
    title_en: str
    title_cn: str
    description_en: str = ""
    description_cn: str = ""
    image_url: Optional[str] = None     # /api/site/certifications/{id}/image
    image_ext: Optional[str] = None     # .png/.jpg/.pdf
    order: int = 0
    enabled: bool = True
    updated_at: datetime


class CaseStudy(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    industry_en: str        # "Power Generation · V-POWER Singapore"
    industry_cn: str
    title_en: str = ""
    title_cn: str = ""
    quote_en: str
    quote_cn: str
    author_en: str = ""
    author_cn: str = ""
    metric_en: str = ""
    metric_cn: str = ""
    order: int = 0
    enabled: bool = True
    updated_at: datetime


class ClientGroup(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    label_en: str
    label_cn: str
    items: List[str] = []   # mixed CN/EN names per row
    order: int = 0
    enabled: bool = True
    updated_at: datetime


class Stat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    value: str              # e.g. "20", "27+", "3,000+"
    label_en: str
    label_cn: str
    order: int = 0
    enabled: bool = True
    updated_at: datetime


class Partner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str               # e.g. "ABB"
    role_en: str            # e.g. "Authorized Manufacturer · 2007"
    role_cn: str
    order: int = 0
    enabled: bool = True
    updated_at: datetime


class ContactInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    address_en: str = ""
    address_cn: str = ""
    phone: str = ""
    email_sales: str = ""
    email_careers: str = ""
    email_privacy: str = ""
    wechat_handle: str = ""
    updated_at: datetime


# ---------------- Helpers ----------------
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _clean(doc: dict) -> dict:
    doc.pop("_id", None)
    if isinstance(doc.get("updated_at"), str):
        try:
            doc["updated_at"] = datetime.fromisoformat(doc["updated_at"])
        except ValueError:
            pass
    return doc


def register_cms_routes(api_router: APIRouter, db, upload_dir: Path, require_admin):
    """Attach the cms_router to the given api_router and wire dependencies."""

    # ============= CERTIFICATIONS =============
    @cms_router.get("/certifications", response_model=List[Certification])
    async def list_certifications():
        cur = db.site_certifications.find({"enabled": True}, {"_id": 0}).sort("order", 1)
        return [_clean(d) async for d in cur]

    @cms_router.get("/certifications/admin", response_model=List[Certification])
    async def list_certifications_admin(_: dict = Depends(require_admin)):
        cur = db.site_certifications.find({}, {"_id": 0}).sort("order", 1)
        return [_clean(d) async for d in cur]

    @cms_router.post("/certifications", response_model=Certification, status_code=201)
    async def create_certification(
        code: str = Form(...),
        title_en: str = Form(...),
        title_cn: str = Form(...),
        description_en: str = Form(""),
        description_cn: str = Form(""),
        order: int = Form(0),
        enabled: bool = Form(True),
        image: Optional[UploadFile] = File(None),
        _: dict = Depends(require_admin),
    ):
        cert_id = str(uuid.uuid4())
        image_ext = None
        if image is not None and image.filename:
            suffix = Path(image.filename).suffix.lower()
            if suffix not in ALLOWED_CERT_EXT:
                raise HTTPException(status_code=415, detail=f"Unsupported file type {suffix}")
            data = await image.read()
            disk_path = upload_dir / f"cert_{cert_id}{suffix}"
            with open(disk_path, "wb") as fh:
                fh.write(data)
            image_ext = suffix
        doc = {
            "id": cert_id,
            "code": code.strip(),
            "title_en": title_en.strip(),
            "title_cn": title_cn.strip(),
            "description_en": description_en.strip(),
            "description_cn": description_cn.strip(),
            "image_url": f"/api/site/certifications/{cert_id}/image" if image_ext else None,
            "image_ext": image_ext,
            "order": order,
            "enabled": enabled,
            "updated_at": _now().isoformat(),
        }
        await db.site_certifications.insert_one(dict(doc))
        return _clean(doc)

    @cms_router.patch("/certifications/{cert_id}", response_model=Certification)
    async def update_certification(
        cert_id: str,
        code: Optional[str] = Form(None),
        title_en: Optional[str] = Form(None),
        title_cn: Optional[str] = Form(None),
        description_en: Optional[str] = Form(None),
        description_cn: Optional[str] = Form(None),
        order: Optional[int] = Form(None),
        enabled: Optional[bool] = Form(None),
        image: Optional[UploadFile] = File(None),
        _: dict = Depends(require_admin),
    ):
        existing = await db.site_certifications.find_one({"id": cert_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Certification not found")
        updates = {}
        for k, v in {
            "code": code, "title_en": title_en, "title_cn": title_cn,
            "description_en": description_en, "description_cn": description_cn,
            "order": order, "enabled": enabled,
        }.items():
            if v is not None:
                updates[k] = v.strip() if isinstance(v, str) else v
        if image is not None and image.filename:
            suffix = Path(image.filename).suffix.lower()
            if suffix not in ALLOWED_CERT_EXT:
                raise HTTPException(status_code=415, detail=f"Unsupported file type {suffix}")
            data = await image.read()
            # delete old file if extension differs
            old_ext = existing.get("image_ext")
            if old_ext and old_ext != suffix:
                old = upload_dir / f"cert_{cert_id}{old_ext}"
                if old.exists():
                    old.unlink()
            disk_path = upload_dir / f"cert_{cert_id}{suffix}"
            with open(disk_path, "wb") as fh:
                fh.write(data)
            updates["image_ext"] = suffix
            updates["image_url"] = f"/api/site/certifications/{cert_id}/image"
        updates["updated_at"] = _now().isoformat()
        await db.site_certifications.update_one({"id": cert_id}, {"$set": updates})
        fresh = await db.site_certifications.find_one({"id": cert_id}, {"_id": 0})
        return _clean(fresh)

    @cms_router.delete("/certifications/{cert_id}", status_code=204)
    async def delete_certification(cert_id: str, _: dict = Depends(require_admin)):
        existing = await db.site_certifications.find_one({"id": cert_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Certification not found")
        if existing.get("image_ext"):
            f = upload_dir / f"cert_{cert_id}{existing['image_ext']}"
            if f.exists():
                f.unlink()
        await db.site_certifications.delete_one({"id": cert_id})

    @cms_router.get("/certifications/{cert_id}/image")
    async def stream_certification_image(cert_id: str):
        cert = await db.site_certifications.find_one({"id": cert_id}, {"_id": 0})
        if not cert or not cert.get("image_ext"):
            raise HTTPException(status_code=404, detail="Image not found")
        path = upload_dir / f"cert_{cert_id}{cert['image_ext']}"
        if not path.exists():
            raise HTTPException(status_code=404, detail="Image missing on disk")
        media = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        return FileResponse(str(path), media_type=media)

    # ============= CASE STUDIES =============
    await_make_crud(cms_router, db, "case-studies", "site_case_studies", CaseStudy, require_admin, [
        "industry_en", "industry_cn", "title_en", "title_cn",
        "quote_en", "quote_cn", "author_en", "author_cn", "metric_en", "metric_cn",
    ])

    # ============= CLIENT GROUPS =============
    @cms_router.get("/client-groups", response_model=List[ClientGroup])
    async def list_client_groups():
        cur = db.site_client_groups.find({"enabled": True}, {"_id": 0}).sort("order", 1)
        return [_clean(d) async for d in cur]

    @cms_router.get("/client-groups/admin", response_model=List[ClientGroup])
    async def list_client_groups_admin(_: dict = Depends(require_admin)):
        cur = db.site_client_groups.find({}, {"_id": 0}).sort("order", 1)
        return [_clean(d) async for d in cur]

    class ClientGroupIn(BaseModel):
        label_en: str
        label_cn: str
        items: List[str] = []
        order: int = 0
        enabled: bool = True

    @cms_router.post("/client-groups", response_model=ClientGroup, status_code=201)
    async def create_client_group(payload: ClientGroupIn, _: dict = Depends(require_admin)):
        cid = str(uuid.uuid4())
        doc = {**payload.model_dump(), "id": cid, "updated_at": _now().isoformat()}
        await db.site_client_groups.insert_one(dict(doc))
        return _clean(doc)

    class ClientGroupPatch(BaseModel):
        label_en: Optional[str] = None
        label_cn: Optional[str] = None
        items: Optional[List[str]] = None
        order: Optional[int] = None
        enabled: Optional[bool] = None

    @cms_router.patch("/client-groups/{cid}", response_model=ClientGroup)
    async def update_client_group(cid: str, payload: ClientGroupPatch, _: dict = Depends(require_admin)):
        existing = await db.site_client_groups.find_one({"id": cid}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Not found")
        updates = {k: v for k, v in payload.model_dump().items() if v is not None}
        updates["updated_at"] = _now().isoformat()
        await db.site_client_groups.update_one({"id": cid}, {"$set": updates})
        fresh = await db.site_client_groups.find_one({"id": cid}, {"_id": 0})
        return _clean(fresh)

    @cms_router.delete("/client-groups/{cid}", status_code=204)
    async def delete_client_group(cid: str, _: dict = Depends(require_admin)):
        await db.site_client_groups.delete_one({"id": cid})

    # ============= PARTNERS =============
    await_make_crud(cms_router, db, "partners", "site_partners", Partner, require_admin, [
        "name", "role_en", "role_cn",
    ])

    # ============= STATS =============
    await_make_crud(cms_router, db, "stats", "site_stats", Stat, require_admin, [
        "value", "label_en", "label_cn",
    ])

    # ============= CONTACT INFO (singleton) =============
    @cms_router.get("/contact-info", response_model=ContactInfo)
    async def get_contact_info():
        doc = await db.site_settings.find_one({"key": "contact_info"}, {"_id": 0})
        if not doc:
            return ContactInfo(updated_at=_now())
        data = doc.get("data") or {}
        return ContactInfo(**data, updated_at=_clean(doc).get("updated_at", _now()))

    class ContactInfoIn(BaseModel):
        address_en: str = ""
        address_cn: str = ""
        phone: str = ""
        email_sales: str = ""
        email_careers: str = ""
        email_privacy: str = ""
        wechat_handle: str = ""

    @cms_router.put("/contact-info", response_model=ContactInfo)
    async def update_contact_info(payload: ContactInfoIn, _: dict = Depends(require_admin)):
        ts = _now().isoformat()
        data = payload.model_dump()
        await db.site_settings.update_one(
            {"key": "contact_info"},
            {"$set": {"data": data, "updated_at": ts}},
            upsert=True,
        )
        return ContactInfo(**data, updated_at=_now())

    # Mount the router under /api
    api_router.include_router(cms_router)


def await_make_crud(router, db, slug, coll_name, model, require_admin, str_fields):
    """Generic CRUD attached to an APIRouter for simple JSON-body models with `order/enabled`."""
    class CreateIn(BaseModel):
        model_config = ConfigDict(extra="ignore")
        order: int = 0
        enabled: bool = True
    # Build full CreateIn with str fields dynamically using model_construct: simpler to just accept dict
    # Use a permissive dict approach to keep this short

    @router.get(f"/{slug}", response_model=List[model])
    async def _list_public():
        cur = db[coll_name].find({"enabled": True}, {"_id": 0}).sort("order", 1)
        return [_clean(d) async for d in cur]

    @router.get(f"/{slug}/admin", response_model=List[model])
    async def _list_admin(_: dict = Depends(require_admin)):
        cur = db[coll_name].find({}, {"_id": 0}).sort("order", 1)
        return [_clean(d) async for d in cur]

    @router.post(f"/{slug}", response_model=model, status_code=201)
    async def _create(payload: dict, _: dict = Depends(require_admin)):
        item_id = str(uuid.uuid4())
        doc = {
            "id": item_id,
            "order": int(payload.get("order", 0)),
            "enabled": bool(payload.get("enabled", True)),
            "updated_at": _now().isoformat(),
        }
        for f in str_fields:
            doc[f] = str(payload.get(f, "")).strip()
        await db[coll_name].insert_one(dict(doc))
        return _clean(doc)

    @router.patch(f"/{slug}/{{item_id}}", response_model=model)
    async def _update(item_id: str, payload: dict, _: dict = Depends(require_admin)):
        existing = await db[coll_name].find_one({"id": item_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Not found")
        updates = {}
        for f in str_fields:
            if f in payload:
                updates[f] = str(payload[f]).strip()
        if "order" in payload:
            updates["order"] = int(payload["order"])
        if "enabled" in payload:
            updates["enabled"] = bool(payload["enabled"])
        updates["updated_at"] = _now().isoformat()
        await db[coll_name].update_one({"id": item_id}, {"$set": updates})
        fresh = await db[coll_name].find_one({"id": item_id}, {"_id": 0})
        return _clean(fresh)

    @router.delete(f"/{slug}/{{item_id}}", status_code=204)
    async def _delete(item_id: str, _: dict = Depends(require_admin)):
        await db[coll_name].delete_one({"id": item_id})


# ---------------- Seed defaults ----------------
async def seed_cms_defaults(db) -> None:
    """Idempotently seed CMS collections so the public site has data on first boot."""
    if await db.site_certifications.count_documents({}) == 0:
        defaults = [
            ("ISO 9001:2015", "Quality Management System", "质量管理体系",
             "Certified by CQC since September 18, 2007. Valid through September 5, 2028. Scope: manufacturing of PLC and complete sets of motor control equipment and low-voltage switchgear assemblies.",
             "由 CQC 认证,自 2007 年 9 月 18 日起 —— 有效期至 2028 年 9 月 5 日。范围:资质范围内低压成套开关设备、PLC 及电机成套控制设备的制造。", 1),
            ("国家高新技术企业", "National High-Tech Enterprise", "国家高新技术企业",
             "Recognized by Jiangsu Provincial Department of Science and Technology — certificate GR202432006352, issued November 19, 2024, valid for three years.",
             "由江苏省科学技术厅、财政厅、税务局共同认定 —— 证书编号 GR202432006352,颁发日期 2024 年 11 月 19 日,有效期三年。", 2),
            ("IEC 61439-1/2", "Type-tested LV Switchgear", "型式试验低压开关柜",
             "Assemblies type-tested to IEC 61439-1 and -2 for power switchgear and controlgear. Compartment forms 2b, 3b, 4a, 4b available.",
             "成套设备按 IEC 61439-1 与 -2 进行型式试验,适用于电力开关柜与控制柜。提供 2b、3b、4a、4b 隔室形式。", 3),
            ("UL 891 / UL 508A", "North American Compliance", "北美合规",
             "UL 891 dead-front switchboards and UL 508A industrial control panels. SCCR-rated for project-specific fault currents.",
             "UL 891 死前面板开关柜与 UL 508A 工业控制面板。按项目特定故障电流提供 SCCR 评级。", 4),
            ("CE Marking", "European Conformity (since 2020)", "欧洲合规(2020 起)",
             "All cabinets shipped to EU markets carry CE marking under LVD 2014/35/EU and EMC 2014/30/EU directives.",
             "出口至欧盟市场的所有柜体均带 CE 标识,符合 LVD 2014/35/EU 与 EMC 2014/30/EU 指令。", 5),
            ("CCC", "China Compulsory Certification", "中国强制性产品认证",
             "CCC product certification held since 2007 for relevant low-voltage switchgear and control cabinet categories.",
             "自 2007 年起持有适用低压开关与控制柜类别的 CCC 产品认证。", 6),
        ]
        await db.site_certifications.insert_many([
            {
                "id": str(uuid.uuid4()),
                "code": code, "title_en": ten, "title_cn": tcn,
                "description_en": den, "description_cn": dcn,
                "image_url": None, "image_ext": None,
                "order": o, "enabled": True,
                "updated_at": _now().isoformat(),
            }
            for code, ten, tcn, den, dcn, o in defaults
        ])

    if await db.site_case_studies.count_documents({}) == 0:
        cs = [
            ("Power Generation · V-POWER Singapore", "电力生产 · V-POWER 新加坡",
             "Topchampion's gen-set control cabinets ran our Singapore gas-fired plant from FAT through commissioning without a single rework cycle.",
             "赛冠的机组控制柜支持了我们新加坡燃气电站从 FAT 到现场调试全过程,零返工。",
             "Plant Engineering Lead", "电站工程负责人",
             "Gas power station · exported SG", "燃气电站 · 出口新加坡", 1),
            ("Power Generation · V-POWER Myanmar", "电力生产 · V-POWER 缅甸",
             "Identical platform replicated in Yangon. ComAp paralleling worked first-attempt against the existing 11 kV switchyard.",
             "在仰光成功复制同一平台。ComAp 并机控制对接现有 11 kV 开关站,一次成功。",
             "EPC Project Director", "EPC 项目总监",
             "Gas power station · exported MM", "燃气电站 · 出口缅甸", 2),
            ("Tire Manufacturing · Goodyear USA", "轮胎制造 · 固铂(美国)",
             "Tread production PLC + MCC + Block delivered from Kunshan to our US plant. Documentation passed our internal type-test in one session.",
             "胎面生产线的 PLC + MCC + Block 从昆山发运至美国工厂。文档一次通过我们的型式试验审核。",
             "Director of Plant Engineering", "工厂工程总监",
             "PLC + MCC + Block · exported US", "PLC + MCC + Block · 出口美国", 3),
        ]
        await db.site_case_studies.insert_many([
            {
                "id": str(uuid.uuid4()),
                "industry_en": ie, "industry_cn": ic,
                "title_en": "", "title_cn": "",
                "quote_en": qe, "quote_cn": qc,
                "author_en": ae, "author_cn": ac,
                "metric_en": me, "metric_cn": mc,
                "order": o, "enabled": True,
                "updated_at": _now().isoformat(),
            }
            for ie, ic, qe, qc, ae, ac, me, mc, o in cs
        ])

    if await db.site_client_groups.count_documents({}) == 0:
        cg = [
            ("Tire & Rubber", "轮胎与橡胶",
             ["Goodyear (USA)", "Pirelli", "Sumitomo Rubber", "Cooper Chengshan", "CST Tire", "Huafeng Rubber"], 1),
            ("Automotive & New Energy", "汽车与新能源",
             ["BMW Shenyang (→ Germany)", "Evergrande Auto", "Ford (Vietnam)", "VinFast (Vietnam)"], 2),
            ("Semiconductor / FPD", "半导体 / 显示面板",
             ["TSMC (Shanghai)", "SMIC (Beijing/Shanghai/Tianjin)", "Wuhan Hongxin", "Tianma (Xiamen/Wuhan)", "CSOT (Shenzhen)", "UMC (Xiamen)", "HKC (Sichuan/Anhui)", "Nanya", "Royole"], 3),
            ("Data Center / Internet", "数据中心 / 互联网",
             ["Huawei", "Alibaba", "Foxconn", "Delta"], 4),
            ("Power Generation", "电力生产 / 发电机组",
             ["V-POWER (Singapore)", "V-POWER (Myanmar)", "ComAp (SE Asia)", "Trilogy Power Solutions (US→CA)"], 5),
            ("Rail / Healthcare / Infrastructure", "轨道交通 / 医疗 / 基础设施",
             ["Chengdu Metro Line 4 P2", "Zhengzhou Urban Rail", "Changhai Hospital", "Tsinghua Hospital Beijing", "Chang Gung Hospital Beijing", "Jishou University", "Putian / Fuzhou Traffic Police"], 6),
        ]
        await db.site_client_groups.insert_many([
            {
                "id": str(uuid.uuid4()),
                "label_en": le, "label_cn": lc,
                "items": items, "order": o, "enabled": True,
                "updated_at": _now().isoformat(),
            }
            for le, lc, items, o in cg
        ])

    if await db.site_partners.count_documents({}) == 0:
        ps = [
            ("ABB", "Authorized Manufacturer · 2007", "授权制造商 · 2007", 1),
            ("RITTAL", "Ri4Power Partner · 2020", "Ri4Power 合作伙伴 · 2020", 2),
            ("ROCKWELL AUTOMATION", "System Integrator · 2018", "系统集成商 · 2018", 3),
            ("ComAp", "Gen-Set Controls Partner", "发电机组控制合作伙伴", 4),
            ("ISO 9001:2015", "Quality Mgmt · since 2006", "质量管理体系 · 2006 起", 5),
            ("国家高新技术企业", "National High-Tech Enterprise · 2024", "国家高新技术企业 · 2024", 6),
        ]
        await db.site_partners.insert_many([
            {
                "id": str(uuid.uuid4()),
                "name": n, "role_en": re_, "role_cn": rc,
                "order": o, "enabled": True,
                "updated_at": _now().isoformat(),
            }
            for n, re_, rc, o in ps
        ])

    if await db.site_stats.count_documents({}) == 0:
        st = [
            ("20", "Years in Business · since 2005", "年深耕 · 2005 年成立", 1),
            ("4", "Global Sites & Offices", "全球生产据点 / 办事处", 2),
            ("27+", "Countries Served", "服务国家", 3),
            ("3,000+", "Tons Shipped Annually", "年出货量 (吨)", 4),
        ]
        await db.site_stats.insert_many([
            {
                "id": str(uuid.uuid4()),
                "value": v, "label_en": le, "label_cn": lc,
                "order": o, "enabled": True,
                "updated_at": _now().isoformat(),
            }
            for v, le, lc, o in st
        ])

    if await db.site_settings.count_documents({"key": "contact_info"}) == 0:
        await db.site_settings.insert_one({
            "key": "contact_info",
            "data": {
                "address_en": "Building 009, No.19 Taihong Rd, Yushan, Kunshan, Jiangsu, China",
                "address_cn": "中国 江苏省 苏州市 昆山市 玉山镇 台虹路19号 009栋",
                "phone": "+86 512 5790 0000",
                "email_sales": "sales@topchampion.cn",
                "email_careers": "careers@topchampion.cn",
                "email_privacy": "privacy@topchampion.cn",
                "wechat_handle": "",
            },
            "updated_at": _now().isoformat(),
        })
