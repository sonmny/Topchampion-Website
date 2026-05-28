# 苏州赛冠官网 · 生产部署清单

> **目标域名**: `https://www.topchampion.net`
> **部署平台**: 阿里云 / 腾讯云
> **架构**: React (Nginx 静态) + FastAPI (uvicorn / gunicorn) + MongoDB

---

## 1️⃣ 服务器准备(阿里云 / 腾讯云)

### 推荐配置
- **ECS**: 2 核 4G(最小)或 4 核 8G(推荐),Ubuntu 22.04 LTS
- **公网带宽**: 5 Mbps 起
- **域名备案**: 国内服务器**必须**有 ICP 备案(否则 80/443 端口会被封)
- **SSL 证书**: 阿里云免费 SSL(20 张/年)或腾讯云 TrustAsia 免费证书

### 必装软件
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx python3.11 python3.11-venv python3-pip \
  curl git build-essential certbot python3-certbot-nginx

# Node.js 20.x (用于 yarn build)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn

# MongoDB 7.x — 推荐用 MongoDB Atlas 免费版(国内访问慢可选阿里云 ApsaraDB for MongoDB)
# 自建:
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [arch=amd64,arm64] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

# Supervisor 进程守护
sudo apt install -y supervisor
```

---

## 2️⃣ 拉取代码

```bash
cd /opt
sudo git clone https://github.com/<your-org>/<your-repo>.git topchampion
sudo chown -R $USER:$USER /opt/topchampion
cd /opt/topchampion
```

---

## 3️⃣ 后端部署

### 3.1 安装依赖
```bash
cd /opt/topchampion/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3.2 创建生产 .env
```bash
nano /opt/topchampion/backend/.env
```

填入以下内容(根据实际情况修改):
```ini
# === 数据库 ===
MONGO_URL=mongodb://localhost:27017
DB_NAME=topchampion_prod

# === 认证 ===
JWT_SECRET=<请用 openssl rand -hex 32 生成 64 位随机字符串>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<请改为强密码,至少 12 位含大小写+数字+符号>

# === 上传目录 ===
UPLOAD_DIR=/opt/topchampion/backend/uploads
MAX_UPLOAD_MB=25

# === 邮件(暂不启用,留空即可,后续添加 Resend Key 后立即生效) ===
RESEND_API_KEY=
SALES_NOTIFY_EMAIL=lc-l@topcp.net
SENDER_EMAIL=Topchampion <noreply@topchampion.net>

# === CORS(限制只允许正式域名) ===
CORS_ORIGINS=https://www.topchampion.net,https://topchampion.net
```

⚠️ **重要**:
- `JWT_SECRET` 用命令生成:`openssl rand -hex 32`
- `ADMIN_PASSWORD` **不要**用 `Topchampion` 这个开发默认密码

### 3.3 配置 Supervisor 守护
```bash
sudo nano /etc/supervisor/conf.d/topchampion-backend.conf
```
```ini
[program:topchampion-backend]
command=/opt/topchampion/backend/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
directory=/opt/topchampion/backend
user=www-data
autostart=true
autorestart=true
stdout_logfile=/var/log/topchampion/backend.out.log
stderr_logfile=/var/log/topchampion/backend.err.log
environment=PYTHONUNBUFFERED=1
```

```bash
sudo mkdir -p /var/log/topchampion
sudo supervisorctl reread && sudo supervisorctl update
sudo supervisorctl status topchampion-backend  # 应显示 RUNNING
```

---

## 4️⃣ 前端部署

### 4.1 创建前端 .env
```bash
nano /opt/topchampion/frontend/.env
```
```ini
REACT_APP_BACKEND_URL=https://www.topchampion.net
REACT_APP_SITE_URL=https://www.topchampion.net
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

### 4.2 构建前端
```bash
cd /opt/topchampion/frontend
yarn install --frozen-lockfile
yarn build
# 生成的静态文件在 /opt/topchampion/frontend/build
```

### 4.3 Nginx 反向代理 + 静态托管

```bash
sudo nano /etc/nginx/sites-available/topchampion.conf
```

```nginx
server {
    listen 80;
    server_name www.topchampion.net topchampion.net;
    # 强制 HTTPS(certbot 会自动改这块)
    return 301 https://www.topchampion.net$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.topchampion.net;

    # SSL — certbot 配置后会自动填这块
    ssl_certificate /etc/letsencrypt/live/www.topchampion.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.topchampion.net/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # 安全头(SEO 加分项)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 文件上传大小限制(必须 ≥ MAX_UPLOAD_MB)
    client_max_body_size 30M;

    # 静态文件托管 — React build 产物
    root /opt/topchampion/frontend/build;
    index index.html;

    # 静态资源长期缓存
    location ~* \.(js|css|png|jpg|jpeg|webp|svg|woff2|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # SEO 关键文件不缓存
    location = /robots.txt   { try_files /robots.txt =404; }
    location = /sitemap.xml  { try_files /sitemap.xml =404; }

    # 后端 API 反向代理 — 路径前缀 /api → uvicorn 8001
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_request_buffering off;  # 让文件上传流式
    }

    # SPA 路由 fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/topchampion.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4.4 申请 SSL 证书

```bash
sudo certbot --nginx -d www.topchampion.net -d topchampion.net
# 自动续期已经配好,无需额外动作
sudo certbot renew --dry-run  # 测试续期
```

---

## 5️⃣ 部署前**必须**修改的文件

| 文件 | 改什么 | 当前值 → 应改为 |
|---|---|---|
| `frontend/src/components/Footer.jsx` | ICP 备案号 | `苏ICP备2026000000号` → 真实备案号 |
| `frontend/public/sitemap.xml` | ✅ 已为 www.topchampion.net | 无需改 |
| `frontend/public/robots.txt` | ✅ 已为 www.topchampion.net | 无需改 |
| `backend/.env` | JWT_SECRET / ADMIN_PASSWORD | 默认值 → 强密码 |
| `frontend/.env`(生产) | REACT_APP_SITE_URL | 见上 |

---

## 6️⃣ 部署后必做(SEO 收录)

### 6.1 Google Search Console
1. https://search.google.com/search-console → 添加资源 → 选"域名"
2. 在 DNS 添加 TXT 记录验证
3. 提交 sitemap: `https://www.topchampion.net/sitemap.xml`

### 6.2 百度站长平台(中国市场必须)
1. https://ziyuan.baidu.com → 用户中心 → 站点管理 → 添加 `https://www.topchampion.net`
2. 验证方式选"HTML 标签",把验证码加到 `frontend/public/index.html` 的 `<head>` 后重新 yarn build
3. 链接提交 → sitemap → 填 `https://www.topchampion.net/sitemap.xml`

### 6.3 必应站长(可选)
- https://www.bing.com/webmasters → 直接从 Google Search Console 一键导入

### 6.4 Google Analytics (可选)
1. https://analytics.google.com 创建 GA4 资源 → 拿 `G-XXXXXXXXXX`
2. 把 gtag 脚本加到 `frontend/public/index.html` 的 `</head>` 前
3. 重新 yarn build 部署

---

## 7️⃣ 启用邮件通知(后续添加 Resend Key 时)

1. https://resend.com 注册 → API Keys → Create
2. 添加自有域名 → 按提示添加 DNS 记录(SPF + DKIM)→ 验证
3. 修改 `/opt/topchampion/backend/.env`:
   ```ini
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   ```
4. 重启:`sudo supervisorctl restart topchampion-backend`
5. **立即生效**,无需代码改动 — 销售线索邮件 + 客户阶段邮件自动启用

---

## 8️⃣ 日常运维

### 查看日志
```bash
# 后端
sudo tail -f /var/log/topchampion/backend.err.log
sudo tail -f /var/log/topchampion/backend.out.log

# Nginx 访问 / 错误
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 数据库备份(每天 1 次,凌晨 3 点)
```bash
sudo crontab -e
# 加入:
0 3 * * * mongodump --db topchampion_prod --out /opt/backups/$(date +\%Y\%m\%d) && find /opt/backups -mtime +30 -exec rm -rf {} +
```

### 代码更新流程
```bash
cd /opt/topchampion
git pull
# 后端依赖变化:
cd backend && source .venv/bin/activate && pip install -r requirements.txt
sudo supervisorctl restart topchampion-backend
# 前端代码变化:
cd ../frontend && yarn install && yarn build
sudo systemctl reload nginx  # 可选,通常不需要
```

---

## 9️⃣ 后续如何调试?

**核心原则**: 代码源在 Emergent 工作区,服务器上的代码是部署产物,**不要直接改服务器代码**。

- **改文案/改图/小 bug**: 回 Emergent 这里 → 改 → 测试 → Save to Github → 服务器 `git pull` → 部署命令(见 8.3)
- **CMS 内容**(认证证书、案例、客户、统计数字、工程图轮播、联系信息): 登录 `https://www.topchampion.net/admin/cms` 直接改,**无需重新部署**
- **加新功能**: 回 Emergent → 描述需求 → 我帮您改
- **生产环境出 bug**: 拉日志(8.1)→ 把错误信息+复现步骤发给我
- **添加 API Key**: 直接改服务器 `.env` → 重启 supervisor,**无需代码改动**

---

## 🔍 部署后自检清单

部署完成后,逐项检查(都应该返回 ✅):

```bash
# 1. 域名解析
curl -I https://www.topchampion.net | head -5
# 应返回 200 OK + HSTS header

# 2. 后端健康
curl -s https://www.topchampion.net/api/health
# 应返回 {"status":"healthy", "time":"..."}

# 3. SEO 文件
curl -s https://www.topchampion.net/robots.txt
curl -s https://www.topchampion.net/sitemap.xml | head -5

# 4. 公开 CMS API
curl -s https://www.topchampion.net/api/site/certifications | python3 -m json.tool | head -20

# 5. SSL 证书有效期
echo | openssl s_client -connect www.topchampion.net:443 2>/dev/null | openssl x509 -noout -dates

# 6. 管理后台登录
# 浏览器打开 https://www.topchampion.net/admin/login
# 用 ADMIN_USERNAME / ADMIN_PASSWORD 登录
```

---

## ⚠️ 常见问题

| 现象 | 原因 | 解决 |
|---|---|---|
| 后端 502 Bad Gateway | uvicorn 没启动 | `sudo supervisorctl status` 查状态,看日志 |
| 文件上传 413 | nginx body 大小限制 | 把 `client_max_body_size` 改大 |
| API CORS 错误 | CORS_ORIGINS 没配对 | 后端 .env CORS_ORIGINS 必须含正式域名 |
| 客户登录跳到 /admin 而不是 /portal | 浏览器缓存 | Ctrl+Shift+R 硬刷新一次即可 |
| SEO 站点未被 Google 收录 | 没在 GSC 提交 sitemap | 见 6.1 |
| 备案 ICP 后页面打不开 | ICP 备案号没加在工信部白名单 | 把备案号写进 Footer + 等工信部审核 24-48h |

---

**部署完成后请把生产域名访问截图发我,我帮您确认线上一切正常 ✅**
