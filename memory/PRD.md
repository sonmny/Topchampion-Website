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

## Phase 9 (2026-02) — Six-Item Major Update
- **#1 数字见证 (Stats)**:
  - 文案修订:"全球生产据点/办事处"(删除中/越/柬)、"年出货量 (吨)"
  - 后端新增 `site_stats` 集合 + CRUD,前端 CMS 第 5 个 tab 可编辑 + Stats.jsx 优先消费 CMS
- **#2 解决方案重命名 + 真实配图**:
  - "轮胎与橡胶生产线"→**自动化设备**,"燃气/柴油机组控制"→**自控系统硬件集成**,"洁净厂房与数据中心配电"→**软件开发**
  - 首页 Solutions.jsx 与详情页 SolutionsPages.jsx 图片完全统一(IMG/IMAGES 共享 4 张:真实生产线、Rittal 开关柜、PLC+HMI、SCADA 代码)
  - 详情页 slug 保持(`/solutions/tire-production` 等),便于 SEO + 已有链接
- **#3 工程卓越**:`FAT · SAT · 24/7 Support` → `MON · FRI · 24/7 Support`
- **#4 国家排序**:`/app/frontend/src/i18n/countries.js` 新增 `PRIORITY_CODES = ["CN","US","HK","TW"]` + `sortedCountries(lang)` 函数,中文按拼音笔画、英文按字母排序
- **#5 首页认证与合规区**:新组件 `CertsHome.jsx`,展示 4 张证书卡(图片或文字降级),链接到 `/certifications`
- **#6 项目管理重大改造**:
  - 删除 ProjectForm 的 PLC Brand 字段
  - ProjectFile 增加 `uploaded_by` / `uploaded_by_name`,文件卡显示上传者
  - ProjectFile category 扩展含 "photo",前端独立"工程照片"区块,允许 `manage_files` 权限用户上传(不再仅限 admin)
  - 状态机:`draft → in_design → in_production → commissioning → delivered → archived`
  - 后端 3 个新工作流端点 `request-advance`/`approve-advance`/`reject-advance`,管理员审核
  - 项目模型加 `pending_status` + `status_history`,初始事件在 create 时种子
  - 前端:`ProjectStatusCard` 6 步进度条 + 申请按钮 + 待审核徽章 + 批准/驳回按钮;`ProjectTimeline` 活动时间线
  - 新权限 `view_progress` 加入 PERMISSION_SET,UsersList 与 i18n 同步
- **验证**:所有 6 项 Playwright 截图 + curl 端到端测试通过(状态机:request→approve 完整流程 OK)
- **iteration_6 深度测试 (2026-02)**:21/21 backend pytest 通过 · ~95% frontend 通过(Stats/CertsHome/Engineering 文本/国家排序/CMS 6 tabs/无 PLC 字段全部 PASS)
- **用户决策 (2026-02)**:首页"解决方案"保留 4 张卡片(含"高/低压控制柜",非重命名要求范围内);Resend API Key 暂不配置,保持安全跳过模式

## Phase 10 (2026-02) — Seven-Item Polish Pass
用户反馈 6 项核心问题 + 1 项权限测试:
- **#1 Stats 计数动画修复**:之前因 `match` 数组每次 render 都是新引用而被列入 useEffect deps 导致动画死循环重置 → 数字卡在 0。重写 AnimatedValue 使用 IntersectionObserver + 仅 `[inView, target, hasCommas, isWhole]` 作为 deps,动画现可从 0 平滑滚动到 CMS 目标值(~1.6s,cubic ease-out)。
- **#2 认证证书 CMS 多图上传**:后端 CMS PATCH 多 cert 上传逻辑本来就正确(curl 验证)。问题在前端展示:
  - `CertsHome.jsx`:移除 `.slice(0, 4)` → 显示所有 enabled 证书,严格按 `order` 排序。无图证书与有图证书使用相同 `aspect-[4/3]` 视觉区,无图时显示 CERT 徽标 + 编号 + 描述。
  - `CertificationsPage`(/certifications):重写为统一画廊,所有 6 张 CMS 证书共享 `aspect-[1/1.25]` 视觉区 + `min-h-[110px]` 标题区,有图/无图卡 高度完全一致(实测均为 568.328px,无 18px 差异)。
- **#3 可点击面包屑**:`PageShell.jsx` PageHero 新增 `BREADCRUMB_HREFS` 标签 → 路径映射(EN+CN 双语),除最后一项(当前页)外都渲染为 `<Link>`,可点击逐层返回(`data-testid=breadcrumb-link-{i}`)。
- **#4 工程能力页轮播**:
  - 后端新增 CMS 类型 `engineering-images`(/api/site/engineering-images CRUD,与 certifications 相同的 multipart 上传模式)
  - 新组件 `EngineeringCarousel.jsx`(无 CMS 数据时不渲染) + CSS `@keyframes marquee-scroll` 自动水平滚动(hover 暂停,两侧渐变遮罩,数组复制实现无缝循环)
  - `/engineering` 页面在 EngineeringTimeline 之后挂载 `<EngineeringCarousel />`
  - `SiteContent.jsx` 新增第 6 个 tab "工程能力图"(EngineeringImagesTab + EngineeringImageEditor)
- **#5 后台仪表盘增强**:
  - 新后端 `GET /api/dashboard/stats`,按角色/权限返回 `leads_today / leads_unread / leads_total / projects_total / projects_pending_review / users_total / can_see_leads`
  - 重写 `AdminDashboard.jsx`:分两个区块——"客户咨询收件箱"(3 卡:今日/未读/总数,unread > 0 时金色 + animate-pulse)和"项目与团队"(总数/待审批/用户数)
- **#6 项目审计追踪 UI 增强**:
  - `FileCard` 文件卡新增第三行(`data-testid=uploader-{file_id}`):显示 `uploaded_by_name · uploaded_date`
  - photo 类别在 FileCard 顶部 chip 正确显示
  - 状态变更时间线(ProjectTimeline)早已显示 `by_user_name` + 时间,本期未改
- **#7 权限矩阵验证**:
  - dashboard 端点严格双重检查:admin 一律可见所有指标,非 admin 仅在 `view_leads` 权限下看到 lead 区,users_total 仅 admin 可见
  - 工程能力图 CMS 端点全部 require_admin
  - 文件上传仍由 admin OR `manage_files` 权限控制(代码未变)
  - 状态推进权限链:request(admin/edit_projects/view_progress/分配的 customer) → approve/reject(仅 admin)
- **验证**:`testing_agent_v3_fork iteration_7` 后端 15/15 通过,前端功能 100%。设计差异 18px 已修复(所有 cert card 高度统一 568.328px)。
- **新增文件**:
  - `/app/frontend/src/components/EngineeringCarousel.jsx`
  - `/app/backend/tests/test_iteration7.py`(15 cases)

## Phase 11 (2026-02) — Multi-Role Project Management Workflow
用户提出**完整的 7 项目管理升级**:从 6 阶段单一状态机重构为多角色工作流系统,每个阶段由不同部门(业务/设计/采购/制造/品检)录入对应资料,系统自动通知客户。
### 用户决策 (2026-02)
- (1) 自动发送邮件通知客户(Resend pipeline 在缺 KEY 时安全降级)
- (2) 每个阶段必须录入对应资料才能推进
- (3) 任何带 `edit_projects` 权限的人都可录入任何阶段
- (4) 业务+采购都可标注甲供料
- (5) 客户登录后看独立的客户门户 `/portal`
### 后端
- **新状态机**: `entry → design → procurement → manufacturing → testing → shipping → archived`(7 阶段) — 旧值通过 `STAGE_LEGACY_MAP` 自动迁移
- **on_startup 迁移**: 旧项目 `in_production` 自动改为 `manufacturing` 等;`customer_materials: null` 自动改为 `[]`
- **新字段** on Project: `work_order_no`(工令号), `customer_email`, `customer_materials: [{name, note, supplied, supplied_at}]`
- **新文件分类**(9 种): legacy code/drawing/photo + approval_drawing(承认图) / design_input(设计输入) / design_output(设计输出) / as_built_drawing(竣工图) / product_photo(产品照片) / inspection_report(检验报告)
- **阶段门控** `STAGE_REQUIREMENTS` + `validate_stage_requirements()`:
  - design→procurement: 必须有 approval_drawing
  - procurement→manufacturing: customer_materials 全部 supplied=True
  - testing→shipping: 必须有 product_photo + inspection_report
  - shipping→archived: 必须有 as_built_drawing
  - 不满足时 `approve-advance` 返回 409
- **新端点**:
  - `POST /api/projects/{pid}/customer-account` — 自动开通客户账号 + 生成随机密码 + 发送欢迎邮件;无 Resend Key 时降级返回明文密码
  - `POST/PATCH/DELETE /api/projects/{pid}/materials/{mat_id}` — 甲供料 CRUD
  - `GET /api/notifications` + `POST /api/notifications/{id}/read` + `POST /api/notifications/read-all` — 站内通知
- **审计追踪**: `status_history` + `notifications` collection 自动记录所有阶段流转的操作人 + 时间 + 备注
- **邮件模板** (`notifications.py`):
  - `send_customer_welcome_email`(双语 HTML,含登录凭据)
  - `send_stage_complete_email`(双语 HTML,标明阶段 + 项目 + 工令号 + 操作员备注)
  - 缺 RESEND_API_KEY 时静默 skip,不影响应用稳定性
### 前端
- **`/portal` 客户门户** (`CustomerPortal.jsx`): 项目列表 + 7 阶段 stepper + 甲供料卡 + 文件按类分组下载 + 通知列表(可标记已读) + 双语切换 + 登出
- **ProtectedRoute**: 客户角色锁定在 `/portal` 和 `/admin/profile`,试图访问 `/admin/*` 自动跳回
- **AdminLogin**: 按角色路由(customer → /portal; 其他 → /admin)
- **AdminLayout**: 顶部右上角 `NotificationBell`(30s 轮询 + 未读红点 + 下拉列表 + 全部已读)
- **ProjectDetail.jsx**:
  - 新 `CustomerAccessCard`:显示客户邮箱 + 一键"开通客户账号"按钮(返回 toast 显示凭据)
  - 新 `CustomerMaterialsCard`:甲供料增删 + 勾选到货
  - 新 `PhaseFileSection` × 6:每个新文件类别独立卡,带上传按钮 + 当前阶段提示 + 上传人信息
  - 保留旧的 photo/drawing/code 区域(向后兼容)
  - 新 `STATUS_FLOW` 7 阶段 stepper(LEGACY_TO_NEW 映射防御性兼容)
- **ProjectForm.jsx**: 新增 `work_order_no` + `customer_email` 字段 + 7 阶段状态下拉
- **i18n/admin.js**: status 字典扩展支持新旧 11 个值
### 测试 (2026-02)
- **iteration_8**: 4/7 通过 → 发现 2 个阻塞 bug
  - Bug #1: `POST /files` 把所有非 legacy category 静默改为 "drawing"
  - Bug #2: `POST /materials` 在 `customer_materials: null` 时 500
- **修复**:
  - 扩展 `ALLOWED_FILE_CATEGORIES` 元组至 9 种 + 文件扩展名白名单加 `.docx/.xlsx/.zip`
  - `create_project` 默认 `customer_materials=[]` + on_startup 回填旧记录
- **iteration_9 重测**: 10/10 通过(7 case + 3 case 全 7 阶段 round-trip + 全部 5 个 gate)。前端客户门户端到端验证(provision → login redirect → stepper → notifications → files → logout)。
- **新增文件**:
  - `/app/backend/tests/test_iteration8.py` (7 cases)
  - `/app/backend/tests/test_iteration9_roundtrip.py` (3 cases)
  - `/app/frontend/src/admin/pages/CustomerPortal.jsx`

## Phase 13 (2026-02) — IT 极简部署包(方案 B 实施)
用户 IT 担心 React 编译 + MongoDB 建库复杂。回应:
- **澄清**:MongoDB 不需要建库(NoSQL,首次写入自动创建);React 编译在 Emergent 这边完成即可
- **新交付物**:`/app/topchampion-deploy.tar.gz` (3.0 MB) 完整部署包,IT **零编译**部署
  - `frontend/` — yarn build 产物(258KB gzip JS + 14KB CSS),IT 直接上传给 Nginx 托管
  - `backend/` — FastAPI 后端 + requirements.txt + .env.example
  - `deploy/install.sh` — 一键安装脚本(自动装 Python 3.11 + MongoDB + 设置 supervisor + 自动生成 JWT_SECRET + 自动生成强密码)
  - `deploy/nginx.conf` — Nginx vhost 模板(HSTS + SSL + API 反代 + SPA fallback)
  - `deploy/supervisor.conf` — uvicorn 进程守护配置
  - `README.md` — 极简 3 步 IT 操作清单(传文件 → 装环境 → 配 Nginx)
- **副本**: `/app/DEPLOY_IT_GUIDE.md`、`/app/install.sh`、`/app/nginx.conf`、`/app/supervisor.conf`(方便单独下载)
- **关键设计**:
  - install.sh **自动生成 ADMIN_PASSWORD** 并保存到 `/root/topchampion-admin-password.txt`(避免 IT 用默认密码)
  - install.sh 完成后明确告诉 IT 还需手动做的 2 步(Nginx + SSL)
  - Nginx vhost 用 `127.0.0.1:8001` 反代,uvicorn 不对外暴露
  - MongoDB 只监听 localhost,与现有 MySQL/PHP 完全隔离

## Phase 12 (2026-02) — SEO 完善 + Footer 二维码 + 部署清单
用户请求:部署前最后审查 + 把 Footer 4 个社交媒体链接换成公司微信二维码 + 出部署文档。
- **目标生产域名**: `https://www.topchampion.net` (用户提供,强制 HTTPS)
- **SEO 修复**:
  - `public/index.html` 删除重复的 `<title>Emergent | Fullstack App</title>` (覆盖了真正的 SEO 标题)
  - `seoConfig.SITE.url` 改为读取 `REACT_APP_SITE_URL`(部署时只改 .env 一处)
  - `sitemap.xml` 13 个 URL 全部更新为 `https://www.topchampion.net`
  - `robots.txt` 增加 Disallow `/portal` + `/api/`,sitemap 指向 prod 域名
- **Footer Connect 区**:
  - 移除 Linkedin / Twitter / Youtube / Github 4 个空链接图标
  - 新增 `data-testid="wechat-qr"` 二维码卡:`/wechat-qr.jpg` + 金色描边 + hover 内发光(`box-shadow: inset 0 0 0 1px rgba(201,160,99,0.5), 0 0 24px rgba(201,160,99,0.18)`) + `contrast(1.05) saturate(1.05)` 调色
  - 双语标签: "扫码联系" / "Scan to Connect" + 副标 "扫码添加 · 商务咨询" / "Scan · Business Enquiry"
- **新文档**: `/app/DEPLOY.md` — 阿里云/腾讯云完整部署清单:
  - 服务器配置 + 软件依赖 (Ubuntu 22.04 + Python 3.11 + Node 20 + MongoDB 7 + Nginx + Supervisor + Certbot)
  - 后端/前端 .env 模板(含 JWT_SECRET 生成命令)
  - Nginx 反代配置(HSTS + 静态缓存 + /api 流式上传 + SPA fallback)
  - SSL 申请 (Let's Encrypt)
  - 部署后 SEO 收录步骤 (Google Search Console + 百度站长 + 必应)
  - 后续启用 Resend Key 的零代码改动流程
  - 日常运维 (日志/备份/更新流程)
  - 自检清单 + 常见问题排查表

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
