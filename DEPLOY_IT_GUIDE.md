# 苏州赛冠官网 · IT 极简部署指南

> **本包**: 前端已**编译完成**(静态 HTML/JS),后端是 FastAPI Python 应用。
> **IT 只需 3 步**,**全程约 30 分钟**。
> **✅ 与现有 LNMP (Nginx+MySQL+PHP) 和邮件服务完全兼容,不影响任何现有服务。**

---

## 🛡️ 与现有服务的兼容性保证

| 现有组件 | 占用资源 | 本应用会影响吗? |
|---|---|---|
| **Nginx** | 80 / 443 | ❌ 不影响 — 只**加一个 vhost 文件**,用 `systemctl reload`(平滑重载,零停机) |
| **MySQL / MariaDB** | 3306 | ❌ 完全不碰 — 本应用用 MongoDB,跟 MySQL 没关系 |
| **PHP / PHP-FPM** | 9000 | ❌ 不碰 — 本应用是 Python,绕过 PHP |
| **Postfix 邮件** | 25 / 587 | ❌ 不碰 — 我们不动 SMTP |
| **Dovecot IMAP** | 143 / 993 | ❌ 不碰 — 我们不动 IMAP/POP |
| **现有 SSL 证书** | — | ❌ 不动 — certbot 多域名能力,新证书放独立路径 |
| **已有 supervisor 进程** | — | ❌ 不冲突 — 程序名独立(`topchampion-backend`) |

**新增的组件,全部"只听本机内网"**:
- MongoDB 监听 **127.0.0.1:27017**(默认配置就是只听本机,从不对外)
- Python uvicorn 监听 **127.0.0.1:8001**(只本机,通过 Nginx 反代对外)
- 静态文件在独立目录 `/opt/topchampion/frontend/`(不会跟 `/var/www/` 冲突)

**install.sh 自带 7 层防护**:
- ✅ 自动检测现有 Nginx/MySQL/PHP/Postfix/Dovecot/Exim,提示并保留
- ✅ 自动检测端口 8001/27017 是否冲突,冲突则停止
- ✅ 只 `apt install` 必需包,**不做 `apt upgrade`**(避免动其他服务)
- ✅ MongoDB 已存在则复用,不重装
- ✅ Nginx 用 `systemctl reload`,不用 `restart`(现有站点零中断)
- ✅ supervisor 配置文件独立命名(`topchampion.conf`)
- ✅ 自动生成强随机密码 + JWT_SECRET,不使用默认凭据

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
    ├── install.sh                    ← 一键安装脚本(防御性,推荐)
    ├── uninstall.sh                  ← 一键卸载脚本(不影响其他服务)
    ├── nginx.conf                    ← Nginx vhost 配置模板
    └── supervisor.conf               ← 后端进程守护配置
```

---

## ✅ 部署前检查清单

服务器准备:
- [ ] Ubuntu 20.04+ / Debian 11+ / Alibaba Cloud Linux
- [ ] **已有 Nginx**(继续用,不动现有站点)— 没装也行,install.sh 会提示
- [ ] **未安装 Python 3.11**(install.sh 会自动装)
- [ ] **未安装 MongoDB**(install.sh 会自动装,**不需要建库**)
- [ ] 域名 `www.topchampion.net` 的 DNS A 记录已指向本服务器
- [ ] 域名已通过 ICP 备案
- [ ] 磁盘可用 ≥ 2GB,内存 ≥ 2GB

---

## 🚀 部署 3 步走

### 步骤 ① — 上传 + 解压

```bash
# 通过 SFTP/SCP 上传 topchampion-deploy.tar.gz 到服务器,然后:
sudo mkdir -p /opt
sudo tar -xzf topchampion-deploy.tar.gz -C /opt/
```

### 步骤 ② — 一键安装(install.sh 自动搞定 Python + MongoDB + 后端 + 强密码)

```bash
sudo bash /opt/topchampion/deploy/install.sh
```

脚本会:
1. 检测现有 LNMP / 邮件服务,提示但不动它们
2. 检测端口冲突,有冲突就停下来等您处理
3. 装 Python 3.11(已装则跳过)
4. 装 MongoDB 7(已装则复用)
5. 装 supervisor + certbot
6. 创建 Python 虚拟环境 + 装依赖
7. 自动生成 **JWT_SECRET** 和 **管理员密码** 写进 `.env`
8. 启动后端 + 健康检查
9. 完成后提示剩余 2 步(Nginx + SSL)

**脚本结束后,管理员密码会显示在屏幕 + 保存到 `/root/topchampion-admin-password.txt`**

### 步骤 ③ — 配 Nginx + SSL(install.sh 完成后会打印这些命令)

```bash
# 1. 复制 Nginx 配置
sudo cp /opt/topchampion/deploy/nginx.conf /etc/nginx/sites-available/topchampion.conf
sudo ln -sf /etc/nginx/sites-available/topchampion.conf /etc/nginx/sites-enabled/

# 2. 测试 + 平滑重载(其他站点零中断)
sudo nginx -t
sudo systemctl reload nginx

# 3. 申请免费 SSL(自动配 HTTPS)
sudo certbot --nginx -d www.topchampion.net -d topchampion.net
```

完成!浏览器打开 `https://www.topchampion.net`

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

# 4. 现有站点是否还活着(测试不被影响)
curl -sI https://your-existing-site.com | head -3

# 5. 后台登录
# 浏览器打开 https://www.topchampion.net/admin/login
# 用户名:admin
# 密码:cat /root/topchampion-admin-password.txt
```

---

## 🔧 日常运维

```bash
# 查日志
sudo tail -f /var/log/topchampion-backend.err.log

# 改了 .env 后重启后端
sudo supervisorctl restart topchampion-backend

# 数据库备份(加进 crontab)
mongodump --db topchampion_prod --out /opt/backups/$(date +%Y%m%d)
```

---

## 🗑️ 卸载(完全不影响现有服务)

```bash
sudo bash /opt/topchampion/deploy/uninstall.sh
```

卸载会:
- ✅ 停后端 + 删 supervisor 配置
- ✅ 删 Nginx vhost(只删本应用的,其他站点不动)
- ✅ 询问是否删应用目录 + 数据库

**不会卸载**:MongoDB / Python / Nginx 本身(可能其他应用在用)

---

## ❓ 常见疑问

| 问题 | 答案 |
|---|---|
| **会影响现有 LNMP 网站吗?** | 不会。详见上面"兼容性保证"表格。install.sh 自带 7 层防护 |
| **会影响邮件服务吗?** | 不会。我们不碰 25/587/143/993 等邮件端口 |
| **不用 MySQL?** | 不用,我们用 MongoDB(独立运行,跟 MySQL 完全无关) |
| **不用 PHP?** | 不用,后端是 Python(FastAPI) |
| **不用 Node.js?** | 服务器不用!前端已经在我们这编译好了,Nginx 直接托管静态文件 |
| **要不要建数据库?** | 不要,MongoDB 自动建。第一次启动应用时自动创建 `topchampion_prod` 库 + 管理员账号 |
| **改文案/换图怎么办?** | 大部分内容(认证证书、客户名单、案例、统计数字、工程图轮播、联系方式)登录 `https://www.topchampion.net/admin/cms` 直接改,**不用重新部署** |
| **想完全删除可以吗?** | 跑 `uninstall.sh` 即可,不影响其他服务 |

---

## ⚠️ 出问题时

| 现象 | 原因 | 解决 |
|---|---|---|
| 502 Bad Gateway | 后端没启动 | `sudo supervisorctl status` 看是否 RUNNING |
| 404 任意路径 | Nginx root 路径错了 | 检查 nginx.conf 里 `root /opt/topchampion/frontend;` |
| API CORS 错误 | .env 的 CORS_ORIGINS 没填对 | 改完执行 `sudo supervisorctl restart topchampion-backend` |
| 老站点突然挂了 | Nginx 配置语法错 | `sudo nginx -t` 看哪一行错;**绝不要 `restart nginx`**,用 `reload` |
| Mongo 启动失败 | 通常是磁盘满 | `df -h` + `sudo journalctl -u mongod -n 50` |
| HTTPS 证书过期 | certbot 自动续期失败 | `sudo certbot renew --dry-run` |

---

## 📞 联系开发

部署完成后或遇到问题,请把以下信息发给开发团队:
```bash
sudo tail -n 50 /var/log/topchampion-backend.err.log
curl -s https://www.topchampion.net/api/health
sudo tail -n 30 /var/log/nginx/error.log
```

**本包构建时间**: 2026-05-28
**前端版本**: production build (gzip 后约 258KB)
**后端版本**: FastAPI + Python 3.11

