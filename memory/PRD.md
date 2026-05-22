# Suzhou Topchampion Automation — Landing Page

## Original Problem Statement
Premium, conversion-oriented B2B industrial landing page for **Suzhou Topchampion Automation Co., Ltd. (苏州赛冠)**.
- Palette: Deep Charcoal `#1A1A1A`, Industrial Blue `#0055A4`, Green Energy `#00E676`
- Style: Modern, high-tech, authoritative, clean
- Sections: Hero · Trust Bar (ABB/Rittal/Rockwell) · 3 Core Solutions · Engineering Excellence (Consultation→Commissioning) · Smart Quote Form · Footer
- Smart Quote Form fields: Name, Company, Industry (Tire Mfg/BESS/Data Center/Other), Preferred PLC Brand (Rockwell/Siemens/Schneider), Project Description

## User Choices
- Leads → MongoDB only (no email integration)
- Bilingual EN + 中文 toggle
- Trust bar: text-based partner badges (logo files to be supplied later)
- Hero: image + subtle motion overlay
- Extras: Stats counter + Testimonials/Case Studies

## Architecture
- **Backend**: FastAPI + Motor (MongoDB). Endpoints under `/api`:
  - `GET /api/health`
  - `POST /api/leads` — Lead model with strict enums (industry, plc_brand)
  - `GET /api/leads` — Admin listing, sorted desc, `_id` excluded
- **Frontend**: React + Tailwind + Shadcn UI + framer-motion + lucide-react
  - `src/i18n/{content.js,LangContext.js}` — EN/CN dictionary + context provider
  - `src/components/{Navbar, Hero, TrustBar, Stats, Solutions, EngineeringTimeline, CaseStudies, SmartQuoteForm, Footer}.jsx`
- **Design system**: Dark theme, Cabinet Grotesk (Fontshare) headings, IBM Plex Sans body, JetBrains Mono mono. Sharp-edged industrial aesthetic.

## What's Been Implemented (2026-12)
- Landing page with all required sections + motion + bilingual toggle
- Stats counter with intersection-observer driven count-up
- Case studies block with quote cards
- Smart Quote Form posting to `/api/leads`, success state, toast notifications
- Footer with company info, certifications, social icons
- 100% backend + frontend E2E test pass (iteration_1)

## Phase 2 (2026-12)
- 13 routed pages: `/`, `/solutions` + 4 detail slugs, `/engineering`, `/cases`, `/contact`, `/about`, `/careers`, `/certifications`, `/privacy`, `*` 404
- Reusable PageShell + PageHero + CTABlock; navbar/footer link routing
- 47/47 routing tests pass (iteration_2)

## Phase 3 (2026-12) — Admin Console
- **Default site language switched to Chinese (中文)**
- JWT auth (username + password, Bearer in localStorage)
- 3 roles: `admin` (full CRUD), `user` (read-only on all projects), `customer` (read-only on assigned projects)
- Seeded admin: `admin` / `Topchampion` (idempotent on every startup)
- Project CRUD with structured fields (name, client, customer assignee, industry, PLC, status, params JSON, drawing URLs)
- File uploads (PDF/PNG/JPG/WEBP/DWG, max 25 MB) to `/app/backend/uploads/`
- Admin pages at `/admin`: Login, Dashboard, Projects list/detail/form, Users (admin-only)
- 24/24 backend + frontend admin tests pass (iteration_3)

## Phase 5 (2026-02) — SEO 包
- 安装 `react-helmet-async`，App 顶层包裹 `HelmetProvider`
- 新增 `/app/frontend/src/seo/SEO.jsx` 复用组件 + `seoConfig.js` 双语 meta 字典（home / solutionsHub / 4 个 solution.* / engineering / cases / contact / about / careers / certifications / privacy / notFound）
- 每个路由独立 title / description / keywords / canonical / hreflang(zh-CN+en+x-default) / Open Graph / Twitter Card
- 首页注入 JSON-LD `Organization` + `WebSite` schema；4 个 solution 详情页各自注入 `Service` schema
- 静态 `/public/sitemap.xml`（13 条 URL）+ `/public/robots.txt`（禁止 `/admin*`，引用 sitemap）
- `index.html`：默认 title/description/OG/favicon 改为 Topchampion，主题色改为品牌绿 `#0F6B3F`
- 验证：所有 9 个公开页面 title/canonical/og:url/JSON-LD 正确；CN↔EN 切换实时同步 `<html lang>` 与 `<title>`

## Phase 4 (2026-02) — 9-Point UX Update
- Navbar: 2-line brand block (CN+EN), Contact link removed, hover/login states refined
- Solutions: horizontal scroll w/ snap, prev/next arrows + edge-fade gradients
- Smart Quote: added Country/Region dropdown (`/app/frontend/src/i18n/countries.js`) and optional file upload (≤25MB, PDF/IMG/DOC/XLS/DWG/ZIP). Backend POST `/api/leads` migrated to multipart/form-data
- Backend Leads: `Lead.country`, `Lead.file_meta`; admin-only GET/PATCH; new GET `/api/leads/{id}/file` for download
- Admin Leads page: country column, paperclip indicator, clickable rows, file download in detail
- Admin Users: Department field (sales/design/engineering/finance/it) + Permissions checkboxes (`view_leads`, `edit_projects`, `delete_projects`, `manage_files`) for role=user; permission-gated GET `/api/leads`
- Footer: certifications updated
- Tests: 17/17 backend (test_iteration5.py) · 12/13 frontend (iteration_5.json), 2 minor UX nits fixed in main agent pass

## Backlog (Future)
- **P1**: Email notification to sales on new lead (Resend/SendGrid)
- **P1**: SEO — per-route `<title>`/meta via react-helmet-async + JSON-LD Organization + sitemap.xml
- **P2**: Replace text partner badges with actual ABB/Rittal/Rockwell logos when supplied
- **P2**: True PATCH semantics on `/api/projects/{id}` (all-Optional `ProjectUpdate` model)
- **P2**: Migrate FastAPI `on_event` startup/shutdown to lifespan context
- **P2**: Customer-portal landing dashboard (currently customer lands on the same admin dashboard)
- **P3**: Add CMS-driven case studies / news block
- **P3**: Add EN/CN URL routing (`/en`, `/zh`) for SEO + hreflang tags
- **P3**: Pagination cursor on `/api/leads` and `/api/projects`
