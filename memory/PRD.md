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

## Backlog (Future)
- **P1**: Email notification to sales on new lead (Resend/SendGrid)
- **P2**: Replace text partner badges with actual ABB/Rittal/Rockwell logos when supplied
- **P2**: True PATCH semantics on `/api/projects/{id}` (all-Optional `ProjectUpdate` model)
- **P2**: Migrate FastAPI `on_event` startup/shutdown to lifespan context
- **P2**: Customer-portal landing dashboard (currently customer lands on the same admin dashboard)
- **P3**: Add CMS-driven case studies / news block
- **P3**: Add EN/CN URL routing (`/en`, `/zh`) for SEO
- **P3**: Pagination cursor on `/api/leads` and `/api/projects`
