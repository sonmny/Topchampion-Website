# 苏州赛冠官网 · IT 极简部署指南

> **本包**: 前端已**编译完成**(静态 HTML/JS),后端是 FastAPI Python 应用。
> **IT 只需 3 步**,**全程约 30 分钟**。

---

## 📦 本压缩包内容

```
topchampion/
├── frontend/          ← 前端已编译好的静态文件(直接用 Nginx 托管即可,无需编译)
├── backend/           ← Python 后端代码
│   ├── server.py      ← 主程序
│   ├── requirements.txt
│   ├── .env.example   ← 配置模板,复制为 .env 后填写
│   └── uploads/       ← 用户上传文件存放处(自动生成)
└── deploy/
    ├── nginx.conf                    ← Nginx vhost 配置模板
    ├── supervisor.conf               ← 后端进程守护配置
    └── install.sh                    ← 一键安装脚本(可选)
```

---

## ✅ 部署前检查清单

服务器准备(已有 LNMP 环境就跳过):
- [ ] Ubuntu 20.04+ / CentOS 7+ / Alibaba Cloud Linux
- [ ] **已有 Nginx**(继续用,不动现有站点)
- [ ] **未安装 Python 3.11**(需新装)
- [ ] **未安装 MongoDB**(需新装,但**不需要建库**——它会自动创建)
- [ ] 域名 `www.topchampion.net` 的 DNS A 记录已指向本服务器
- [ ] 域名已通过 ICP 备案

---

## 🚀 部署 3 步走

### 步骤 ① — 上传 + 装环境(IT 操作)

```bash
# 1. 解压本包到服务器(假设上传到 /opt/)
sudo mkdir -p /opt/topchampion
sudo tar -xzf topchampion-deploy.tar.gz -C /opt/  # 或用 SFTP 上传后再 mv

# 2. 装 Python 3.11(Ubuntu 22.04 已自带,可跳过)
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev build-essential

# 3. 装 MongoDB 7(无需建库 — 应用启动时自动创建)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [arch=amd64] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
mongosh --eval "db.runCommand({ping:1})"   # 应返回 { ok: 1 }

# 4. 装 supervisor(进程守护)
sudo apt install -y supervisor certbot python3-certbot-nginx
```

---

### 步骤 ② — 启动后端(2 分钟)

```bash
cd /opt/topchampion/backend

# 1. 创建 Python 虚拟环境
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 2. 创建 .env 配置文件
cp .env.example .env
nano .env
# ↑ 必须修改 3 个值:
#   - JWT_SECRET:执行 `openssl rand -hex 32` 把输出粘进去
#   - ADMIN_PASSWORD:改为强密码(至少 12 位)
#   - CORS_ORIGINS:确保是您的真实域名
# 保存退出(Ctrl+O → Enter → Ctrl+X)

# 3. 配置 supervisor 自动守护
sudo cp /opt/topchampion/deploy/supervisor.conf /etc/supervisor/conf.d/topchampion.conf
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status topchampion-backend
# ↑ 应显示 RUNNING

# 4. 验证后端
curl -s http://127.0.0.1:8001/api/health
# ↑ 应返回 {"status":"healthy", "time":"..."}
```

---

### 步骤 ③ — 配 Nginx + SSL(5 分钟)

```bash
# 1. 复制 nginx 配置(根据您的 Nginx 目录风格选一个)
# Debian/Ubuntu 风格:
sudo cp /opt/topchampion/deploy/nginx.conf /etc/nginx/sites-available/topchampion.conf
sudo ln -s /etc/nginx/sites-available/topchampion.conf /etc/nginx/sites-enabled/
# 或宝塔/CentOS 风格:
# sudo cp /opt/topchampion/deploy/nginx.conf /etc/nginx/conf.d/topchampion.conf

# 2. 测试配置 — 必须先看到 OK 才能继续
sudo nginx -t

# 3. 平滑重载(零停机,现有站点不中断)
sudo systemctl reload nginx

# 4. 申请免费 SSL(自动配置 HTTPS)
sudo certbot --nginx -d www.topchampion.net -d topchampion.net
# ↑ 按提示输入邮箱、同意条款,会自动改 nginx 配置并启用 HTTPS

# 5. 完成!打开浏览器访问:
# https://www.topchampion.net
```

---

## ✅ 部署后自检

```bash
# 1. 后端健康
curl -s https://www.topchampion.net/api/health

# 2. 首页正常
curl -sI https://www.topchampion.net | head -3   # 应 200 OK

# 3. SEO 文件可访问
curl -s https://www.topchampion.net/robots.txt
curl -s https://www.topchampion.net/sitemap.xml | head

# 4. 后台登录
# 浏览器打开 https://www.topchampion.net/admin/login
# 用 admin / 您设置的 ADMIN_PASSWORD 登录
```

---

## 🔧 日常运维 (3 个命令搞定)

```bash
# 查日志(后端报错时)
sudo tail -f /var/log/topchampion-backend.err.log

# 改了 .env 配置后重启后端
sudo supervisorctl restart topchampion-backend

# 数据库备份(可选,加进 crontab 每天凌晨 3 点自动备份)
mongodump --db topchampion_prod --out /opt/backups/$(date +%Y%m%d)
```

---

## ❓ 常见疑问

| 问题 | 答案 |
|---|---|
| **不用 MySQL?** | 不用,我们用 MongoDB(NoSQL,无需建库建表) |
| **不用 PHP?** | 不用,后端是 Python(FastAPI) |
| **不用 Node.js?** | 服务器不用!前端已经在我们这编译好了,Nginx 直接托管静态文件 |
| **要不要建数据库?** | 不要,MongoDB 自动建。第一次启动应用时自动创建 `topchampion_prod` 库 + 自动创建管理员账号 |
| **现有 LNMP 站点会受影响吗?** | 不会。我们只用了 8001(后端)和 27017(Mongo)两个端口,都只监听 127.0.0.1 内网。Nginx 用平滑重载,现有站点不中断 |
| **改文案/换图怎么办?** | 大部分内容(认证证书、客户名单、案例、统计数字、工程图轮播、联系方式)登录 `https://www.topchampion.net/admin/cms` 直接改,**不用重新部署** |
| **以后要新增功能怎么办?** | 联系开发(回 Emergent 平台),改完后会给您新的 build 包,IT 只需要替换 `frontend/` 文件夹 + 重启后端即可 |

---

## ⚠️ 出问题时

| 现象 | 原因 | 解决 |
|---|---|---|
| 502 Bad Gateway | 后端没启动 | `sudo supervisorctl status` 看是否 RUNNING;`sudo tail -f /var/log/topchampion-backend.err.log` 看日志 |
| 404 任意路径 | Nginx root 路径错了 | 检查 nginx.conf 里 `root /opt/topchampion/frontend;` 是否正确 |
| API CORS 错误 | .env 的 CORS_ORIGINS 没填对 | 改完执行 `sudo supervisorctl restart topchampion-backend` |
| 老站点突然挂了 | Nginx 配置语法错 | `sudo nginx -t` 看哪一行错;**绝不要 `systemctl restart nginx`**,用 `reload` |
| Mongo 启动失败 | 通常是磁盘满 | `df -h` 看磁盘;`sudo journalctl -u mongod -n 50` 看错误 |
| HTTPS 证书过期 | certbot 自动续期失败 | `sudo certbot renew --dry-run` 测试 |

---

## 📞 联系开发

部署完成后或遇到问题,请把以下信息发给开发团队:
```bash
# 1. 后端日志最后 50 行
sudo tail -n 50 /var/log/topchampion-backend.err.log

# 2. 健康检查结果
curl -s https://www.topchampion.net/api/health

# 3. Nginx 错误日志
sudo tail -n 30 /var/log/nginx/error.log
```

**本包构建时间**: 2026-05-28
**前端版本**: production build (gzip 后约 258KB)
**后端版本**: FastAPI + Python 3.11
