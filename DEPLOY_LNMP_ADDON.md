# 在已有 LNMP 环境上加装赛冠官网

> 适用场景:您的阿里云/腾讯云服务器**已经跑着 LNMP**(Nginx + MySQL + PHP)在为其他网站服务,现在要**加装**赛冠官网(Python + MongoDB),并且**不影响现有站点**。
>
> **核心思路**:复用现有 Nginx,只新增一个 vhost 配置;MySQL 完全不动;新增 Python + MongoDB 两个独立组件。

---

## 0️⃣ 部署前自检

```bash
# 1. 确认现有环境
nginx -v                    # 应该有,比如 nginx/1.18.0
mysql --version             # 有,不影响
php -v                      # 有,不影响
which python3               # 通常系统自带 3.10 或 3.11

# 2. 确认端口占用 — 这几个必须空闲
sudo ss -tlnp | grep -E ':(8001|27017)'   # 应该没输出

# 3. 现有 Nginx 配置目录
ls /etc/nginx/sites-available/    # Debian/Ubuntu 风格
# 或
ls /etc/nginx/conf.d/             # CentOS/宝塔风格
```

如果端口冲突:
- `8001` 被占用:后面装 uvicorn 时换成 `8002`(配置文件里改一行)
- `27017` 被占用:有人已经装过 Mongo,可以直接复用,跳过第 2 步装 Mongo

---

## 1️⃣ 装 Python 3.11(不影响系统 Python)

Ubuntu 22.04:
```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev build-essential
```

CentOS 7 / Alibaba Cloud Linux:
```bash
sudo yum install -y gcc make zlib-devel openssl-devel libffi-devel bzip2-devel xz-devel
cd /tmp
wget https://www.python.org/ftp/python/3.11.9/Python-3.11.9.tgz
tar xzf Python-3.11.9.tgz && cd Python-3.11.9
./configure --enable-optimizations --prefix=/usr/local/python311
make -j$(nproc) && sudo make altinstall
sudo ln -s /usr/local/python311/bin/python3.11 /usr/local/bin/python3.11
```

验证:`python3.11 --version` → 应输出 `Python 3.11.x`

---

## 2️⃣ 装 MongoDB 7(独立目录,不动 MySQL)

Ubuntu 22.04:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [arch=amd64,arm64] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

CentOS 7:
```bash
sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo <<EOF
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/7/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
sudo yum install -y mongodb-org
sudo systemctl enable --now mongod
```

验证:
```bash
sudo systemctl status mongod        # 应显示 active (running)
mongosh --eval "db.runCommand({ping:1})"   # 应返回 {ok:1}
```

**安全提醒**:Mongo 默认只监听 `127.0.0.1:27017`,不开放公网。**保持现状即可**,不要改 `bindIp` 为 `0.0.0.0`。

---

## 3️⃣ 装 Node.js 20(只为构建前端用,构建完可以不留)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn
node -v && yarn -v
```

---

## 4️⃣ 拉代码 + 后端部署

```bash
# 选个独立目录,避开现有站点
sudo mkdir -p /opt/topchampion
sudo chown $USER:$USER /opt/topchampion
cd /opt/topchampion
git clone https://github.com/<your-org>/<your-repo>.git .

# Python 虚拟环境(完全独立,不污染系统)
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

**配置 `.env`**:
```bash
nano /opt/topchampion/backend/.env
```
```ini
MONGO_URL=mongodb://localhost:27017
DB_NAME=topchampion_prod
JWT_SECRET=<执行 openssl rand -hex 32 把结果粘这里>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<强密码,至少 12 位>
UPLOAD_DIR=/opt/topchampion/backend/uploads
MAX_UPLOAD_MB=25
RESEND_API_KEY=
SALES_NOTIFY_EMAIL=lc-l@topcp.net
SENDER_EMAIL=Topchampion <noreply@topchampion.net>
CORS_ORIGINS=https://www.topchampion.net,https://topchampion.net
```

---

## 5️⃣ 用 Supervisor 守护 Python 后端

如果系统没 supervisor:
```bash
sudo apt install -y supervisor    # Ubuntu
# 或
sudo yum install -y supervisor && sudo systemctl enable --now supervisord   # CentOS
```

**新建配置**(独立文件,不影响现有项目):
```bash
sudo nano /etc/supervisor/conf.d/topchampion-backend.conf
```
```ini
[program:topchampion-backend]
command=/opt/topchampion/backend/.venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001 --workers 2
directory=/opt/topchampion/backend
user=www-data
autostart=true
autorestart=true
stdout_logfile=/var/log/topchampion-backend.out.log
stderr_logfile=/var/log/topchampion-backend.err.log
environment=PYTHONUNBUFFERED=1
```

```bash
sudo chown -R www-data:www-data /opt/topchampion/backend/uploads 2>/dev/null || true
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status topchampion-backend   # 应显示 RUNNING
```

测试后端:
```bash
curl -s http://127.0.0.1:8001/api/health
# 应返回 {"status":"healthy", "time":"..."}
```

---

## 6️⃣ 构建前端

```bash
cd /opt/topchampion/frontend

# 创建生产 .env
cat > .env <<'EOF'
REACT_APP_BACKEND_URL=https://www.topchampion.net
REACT_APP_SITE_URL=https://www.topchampion.net
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
EOF

yarn install --frozen-lockfile
yarn build
# 产物在 /opt/topchampion/frontend/build
```

---

## 7️⃣ 给现有 Nginx 加一个新 vhost(关键 — 不动其他站点)

### 7.1 新建配置文件

如果是 **Debian/Ubuntu 风格**:
```bash
sudo nano /etc/nginx/sites-available/topchampion.conf
```

如果是 **宝塔面板 / CentOS 风格**:
```bash
sudo nano /etc/nginx/conf.d/topchampion.conf
```

**填入以下内容**:
```nginx
# === 80 端口:HTTP 自动跳转 HTTPS ===
server {
    listen 80;
    server_name www.topchampion.net topchampion.net;
    return 301 https://www.topchampion.net$request_uri;
}

# === 443 端口:HTTPS 主站点 ===
server {
    listen 443 ssl http2;
    server_name www.topchampion.net;

    # SSL — 第 8 步 certbot 会自动填充这两行
    ssl_certificate /etc/letsencrypt/live/www.topchampion.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.topchampion.net/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # 安全头
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 文件上传(必须 ≥ 后端 MAX_UPLOAD_MB)
    client_max_body_size 30M;

    root /opt/topchampion/frontend/build;
    index index.html;

    # 静态资源长期缓存
    location ~* \.(js|css|png|jpg|jpeg|webp|svg|woff2|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location = /robots.txt   { try_files /robots.txt =404; }
    location = /sitemap.xml  { try_files /sitemap.xml =404; }

    # API 反代到 FastAPI(注意:127.0.0.1 内网,不对外暴露 8001)
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_request_buffering off;
    }

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 7.2 启用 + 测试 + 重载

Debian/Ubuntu:
```bash
sudo ln -s /etc/nginx/sites-available/topchampion.conf /etc/nginx/sites-enabled/
```

(宝塔/CentOS 在 `conf.d/` 直接就会被加载,不用建软链)

```bash
sudo nginx -t          # 必须看到 syntax is ok + test is successful
sudo systemctl reload nginx   # 平滑重载,现有站点不中断
```

⚠️ **重要 — 平滑重载是关键**:
- ✅ 用 `nginx -s reload` 或 `systemctl reload nginx`(零停机,旧连接继续完成)
- ❌ **不要**用 `systemctl restart nginx`(会让所有站点瞬间中断 2-3 秒)

---

## 8️⃣ 申请免费 SSL 证书

```bash
sudo apt install -y certbot python3-certbot-nginx    # Ubuntu
# 或 yum install -y certbot python3-certbot-nginx     # CentOS

# 自动配置(certbot 会自动改 Nginx 配置开启 HTTPS)
sudo certbot --nginx -d www.topchampion.net -d topchampion.net

# 测试自动续期(已经配好定时任务,无需额外操作)
sudo certbot renew --dry-run
```

---

## 9️⃣ DNS 解析(在阿里云/腾讯云控制台)

| 主机记录 | 记录类型 | 解析值 |
|---|---|---|
| `www` | A | 服务器公网 IP |
| `@` (留空或主域名) | A | 服务器公网 IP |

注意:**国内服务器必须先完成 ICP 备案**才能让 80/443 端口公网访问。

---

## 🔟 部署后自检

```bash
# 1. 后端
curl -s https://www.topchampion.net/api/health

# 2. 前端首页
curl -sI https://www.topchampion.net | head -3

# 3. SEO 文件
curl -s https://www.topchampion.net/robots.txt
curl -s https://www.topchampion.net/sitemap.xml | head

# 4. 公开 CMS API
curl -s https://www.topchampion.net/api/site/certifications | head

# 5. 现有站点是否还活着(替换成您的旧域名)
curl -sI https://your-old-site.com | head -3
```

---

## 🛡️ 与现有 LNMP 共存的关键点

| 资源 | 是否冲突 | 说明 |
|---|---|---|
| **Nginx 80/443** | ✅ 不冲突 | Nginx 通过 `server_name` 区分不同域名,可以同时为多站服务 |
| **PHP-FPM 9000** | ✅ 不冲突 | 赛冠不用 PHP,完全不碰 |
| **MySQL 3306** | ✅ 不冲突 | 赛冠用 MongoDB,完全独立 |
| **MongoDB 27017** | ✅ 独占,只内网监听 | 新加的,不影响别人 |
| **uvicorn 8001** | ✅ 独占,只内网监听 | 新加的,不影响别人 |
| **磁盘** | ⚠️ 注意 | 赛冠默认在 `/opt/topchampion`,不要装在已有 `/var/www/` 下避免误操作 |
| **CPU/内存** | ⚠️ 注意 | uvicorn 2 个 worker + MongoDB 大约多吃 600MB-1G 内存,服务器内存少于 2G 建议升级 |

---

## ⚙️ 日常运维

```bash
# 查后端日志
sudo tail -f /var/log/topchampion-backend.err.log

# 重启后端(改 .env 后)
sudo supervisorctl restart topchampion-backend

# 代码更新流程
cd /opt/topchampion
git pull
cd backend && source .venv/bin/activate && pip install -r requirements.txt
sudo supervisorctl restart topchampion-backend
cd ../frontend && yarn install && yarn build
# Nginx 不需要 reload(静态文件直接生效)

# 数据库备份(每天凌晨 3 点)
sudo crontab -e
# 加入:
0 3 * * * mongodump --db topchampion_prod --out /opt/backups/topchampion/$(date +\%Y\%m\%d) && find /opt/backups/topchampion -mtime +30 -exec rm -rf {} +
```

---

## ❓ 万一出问题

| 现象 | 怎么查 |
|---|---|
| 新站点 502 Bad Gateway | `sudo supervisorctl status` 看 uvicorn 是不是 RUNNING;`curl 127.0.0.1:8001/api/health` 看后端 |
| 新站点 404 一切路径 | Nginx 配置里 `root` 路径错了,或 yarn build 没生成 build 目录 |
| 老站点突然挂了 | 检查 `sudo nginx -t` 是否有错;查看 `/var/log/nginx/error.log` |
| API CORS 报错 | `backend/.env` 的 `CORS_ORIGINS` 必须含真实访问域名 |
| 客户登录跳到 /admin 而不是 /portal | 浏览器缓存,Ctrl+Shift+R 硬刷一次 |
| Mongo 启动失败 | `sudo journalctl -u mongod -n 50` 查日志,通常是磁盘满或权限问题 |

---

**部署完成后,把 `curl -s https://www.topchampion.net/api/health` 的输出截图发我,我帮您确认一切正常 ✅**
