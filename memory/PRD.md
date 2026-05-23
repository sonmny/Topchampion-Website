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

## Phase 8 (2026-02) — 通用 CMS 内容管理模块
- **新增后端**:`/app/backend/cms.py` 完整 CMS 路由,集成到 `register_cms_routes()`
- **公开只读端点**(任何人访问公开页面时调用):
  - `GET /api/site/certifications` · `GET /api/site/case-studies` · `GET /api/site/client-groups` · `GET /api/site/partners` · `GET /api/site/contact-info`
  - `GET /api/site/certifications/{id}/image`(认证证书图片流)
- **管理员端点**(admin 角色):
  - `GET /api/site/{type}/admin`(包含已禁用的项)
  - `POST/PATCH/DELETE /api/site/certifications/{id}`(multipart,支持图片上传 .jpg/.png/.pdf/.webp)
  - `POST/PATCH/DELETE /api/site/case-studies/{id}`(JSON)
  - `POST/PATCH/DELETE /api/site/client-groups/{id}`(JSON,items 为字符串数组)
  - `POST/PATCH/DELETE /api/site/partners/{id}`(JSON)
  - `PUT /api/site/contact-info`(单例 upsert)
- **MongoDB 集合**:`site_certifications`、`site_case_studies`、`site_client_groups`、`site_partners`、`site_settings`(联系信息单例 key=contact_info)
- **首次启动种子**:`seed_cms_defaults()` 幂等地为空集合写入真实数据(6 张证书、3 条案例、6 个客户组、6 个合作伙伴、完整联系信息)
- **新增前端管理页**:`/admin/cms` (admin only):
  - 单页 5 个 tab:认证证书 / 案例研究 / 客户名单 / 合作伙伴 / 联系信息
  - 每个 tab 含 列表 + 新增 + 编辑(模态)+ 启用/禁用 + 删除 + 排序字段
  - 认证证书 tab 支持图片上传 + 预览缩略图
  - 双语字段并排编辑(EN + 中文)
  - 联系信息为单例编辑表单
  - 侧边栏添加 "站点内容" 导航项(FileEdit 图标)
- **新增前端 hook**:`/app/frontend/src/hooks/useSiteContent.js` 公开页轻量级读取 + 优雅回退到 i18n 静态字典
- **前端公开页消费 CMS 数据**:
  - `Clients.jsx` → CMS client-groups
  - `CaseStudies.jsx` → 优先级 1)Live Projects showcase 2)CMS case-studies 3)静态 i18n
  - `TrustBar.jsx` → CMS partners
  - `Footer.jsx` → CMS contact-info(地址、电话、销售邮箱)
  - `Certifications` 页 → CMS certifications(支持上传图片,自动渲染到 gallery)
- **验证**:6 个公开 GET 端点 200、admin POST/PATCH/DELETE 全 OK、Live 修改 contact-info 电话→刷新首页→Footer 立即同步显示新电话→恢复

- **真实图片**：从官方 PPTX 提取并优化(Pillow 压缩 + 转 JPG):
  - 证书:ISO 9001 中英双版(`/assets/certs/iso9001-{cn,en}.jpg`),按当前语言渲染
  - 产品:出货 MCC 柜体、NANYA 车间柜体行、PLC+HMI 控制柜、Schneider 开关柜(`/assets/products/*.jpg`)
- **认证页改造**：新增 `certs-gallery` 区,ISO 9001 缩略图(点击可全屏放大)+ 国家高新企业卡片(真实编号 GR202432006352)
- **About 页 hero**：植入真实"昆山赛冠车间出货 MCC 柜体"照片
- **Solutions 详情页图片**：4 个详情页 hero image 全部替换为真实柜体/控制盘产品图
- **邮件通知管道**：
  - 安装 `resend>=2.0.0`
  - 新模块 `/app/backend/notifications.py`:async `send_new_lead_email()`,无 KEY 时安全 skip
  - 邮件模板:HTML 表格 + 品牌色,含 Lead ID / 行业 / 国家 / 描述 / 附件信息;reply_to 自动指向客户邮箱
  - 接入 `POST /api/leads`(FastAPI BackgroundTasks 非阻塞)
  - 新 env vars:`RESEND_API_KEY`(空,待用户启用)、`SENDER_EMAIL=onboarding@resend.dev`、`SALES_NOTIFY_EMAIL=lc-l@topcp.net`
  - **当前状态**:用户选择 Phase B(暂不注册 Resend),Skip 模式已验证(curl POST /api/leads 201 + 日志 skip 记录)

- 整合官方 PPTX(简介Catalog 2025 V1.0) + PDF(宣传资料) 真实公司资料
- **公司事实修正**：
  - 成立 **2005年5月**(非2007),20 年历史
  - 真实地址 **江苏苏州昆山玉山镇台虹路19号009栋**(非苏州工业园区)
  - 全球 4 据点：昆山总部 + 淮安工厂(2012) + 越南工厂(2019) + 柬埔寨办事处(2019)
  - 真实公司全称：**苏州赛冠工业自动化技术有限公司**(国家高新技术企业 GR202432006352, 2024)
- **解决方案重组**(BESS → 电站与发电机组控制)：
  - URL: `/solutions/bess` 已重命名为 `/solutions/power-generation`(sitemap 已同步)
  - 第 3 个方案现为"燃气/柴油机组控制",主打 V-POWER 新加坡 & 缅甸、ComAp 东南亚、Trilogy Power(美→加)
  - 第 4 个方案重新定位为"洁净厂房与数据中心配电",覆盖 TSMC、SMIC、天马、华星、华为、阿里、富士康
  - Backend `industry` Literal 扩展：tire_mfg / semiconductor / power_generation / auto_ev / data_center / bess(legacy) / other
- **About 页新增 Timeline 组件**：2005 → 2024 共 11 个里程碑(ISO 9001 / ABB / Rockwell / Rittal / 高新等)
- **首页新增 Clients 组件**：6 大行业分组展示真实客户名单(文本形式,无 logo)
- **真实案例研究**：CaseStudies 三条引言改为 V-POWER 新加坡、V-POWER 缅甸、固铂(美国)轮胎产线
- **合作伙伴与认证刷新**：Trust Bar 显示真实合作年份(ABB 2007 · Rockwell 2018 · Rittal 2020 · ComAp · ISO 9001 since 2006 · 国家高新技术企业 2024)
- **Stats 数字真实化**：20 年 · 4 据点 · 27+ 国家 · 1,500+ 柜/年
- **Footer**：真实昆山地址、电话 +86 512 5790 0000、版权"自 2005 年起"、5 项真实认证
- **SEO**：Organization JSON-LD 含 foundingDate=2005-05、真实地址、knowsAbout 扩展(ComAp/V-POWER/Goodyear/TSMC)、所有页 meta keywords/description 全部刷新
- **验证**：Playwright 截图所有页 OK、POST /api/leads industry=power_generation 返回 201、/solutions/bess 正确 404

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
- **P2**: Replace text partner badges with actual ABB/Rittal/Rockwell logos when supplied
- **P2**: True PATCH semantics on `/api/projects/{id}` (all-Optional `ProjectUpdate` model)
- **P2**: Migrate FastAPI `on_event` startup/shutdown to lifespan context
- **P2**: Customer-portal landing dashboard (currently customer lands on the same admin dashboard)
- **P3**: Add CMS-driven case studies / news block
- **P3**: Add EN/CN URL routing (`/en`, `/zh`) for SEO + hreflang tags
- **P3**: Pagination cursor on `/api/leads` and `/api/projects`
