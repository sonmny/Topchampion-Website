#!/bin/bash
# ============================================================
# 苏州赛冠官网 — 一键安装脚本
# 适用:Ubuntu 22.04 / Debian 12 全新服务器
# 执行:sudo bash install.sh
# ============================================================

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

[ "$EUID" -eq 0 ] || err "请用 root / sudo 运行"

INSTALL_DIR=${INSTALL_DIR:-/opt/topchampion}
[ -d "$INSTALL_DIR/backend" ] || err "未找到 $INSTALL_DIR/backend,请先解压本包到 $INSTALL_DIR"

log "开始安装赛冠官网到 $INSTALL_DIR"

# === 1. 系统依赖 ===
log "更新 apt 源..."
apt update -qq

log "安装 Python 3.11 / supervisor / certbot..."
apt install -y python3.11 python3.11-venv python3.11-dev build-essential \
  supervisor certbot python3-certbot-nginx curl wget gnupg

# === 2. MongoDB 7 ===
if ! command -v mongod >/dev/null 2>&1; then
  log "安装 MongoDB 7..."
  wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add - >/dev/null 2>&1
  CODENAME=$(lsb_release -cs)
  echo "deb [arch=amd64,arm64] https://repo.mongodb.org/apt/ubuntu $CODENAME/mongodb-org/7.0 multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt update -qq && apt install -y mongodb-org
  systemctl enable --now mongod
  sleep 3
  mongosh --quiet --eval "db.runCommand({ping:1})" >/dev/null && log "MongoDB 正常" || err "MongoDB 启动失败"
else
  warn "MongoDB 已存在,跳过安装"
fi

# === 3. Python 虚拟环境 + 依赖 ===
log "创建 Python 虚拟环境..."
cd "$INSTALL_DIR/backend"
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip -q
log "安装后端依赖(约 1-2 分钟)..."
pip install -r requirements.txt -q

# === 4. .env 配置 ===
if [ ! -f "$INSTALL_DIR/backend/.env" ]; then
  log "创建初始 .env 配置..."
  cp .env.example .env
  JWT_SECRET=$(openssl rand -hex 32)
  ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d '+/=' | cut -c1-16)
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
  sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$ADMIN_PASSWORD|" .env
  chmod 600 .env
  log "已自动生成 JWT_SECRET 和管理员密码"
  log "管理员账号: admin"
  log "管理员密码: $ADMIN_PASSWORD"
  log "⚠️  请立刻把上面这行密码记录到您的密码管理器!"
  echo "$ADMIN_PASSWORD" > /root/topchampion-admin-password.txt
  chmod 600 /root/topchampion-admin-password.txt
  warn "密码已临时保存到 /root/topchampion-admin-password.txt(记录后请删除)"
else
  warn ".env 已存在,跳过初始化"
fi

# === 5. 文件权限 ===
log "设置文件权限..."
mkdir -p "$INSTALL_DIR/backend/uploads"
chown -R www-data:www-data "$INSTALL_DIR/backend/uploads"
chown -R www-data:www-data "$INSTALL_DIR/frontend"

# === 6. Supervisor ===
log "配置 supervisor..."
cp "$INSTALL_DIR/deploy/supervisor.conf" /etc/supervisor/conf.d/topchampion.conf
supervisorctl reread
supervisorctl update
sleep 2
STATUS=$(supervisorctl status topchampion-backend | awk '{print $2}')
[ "$STATUS" = "RUNNING" ] && log "后端正常运行" || { supervisorctl tail topchampion-backend stderr; err "后端启动失败,请看上面日志"; }

# === 7. 健康检查 ===
sleep 2
HEALTH=$(curl -sf http://127.0.0.1:8001/api/health || echo "FAIL")
echo "$HEALTH" | grep -q "healthy" && log "后端健康检查通过: $HEALTH" || err "后端健康检查失败"

echo ""
echo "============================================================"
log "🎉 后端部署完成!"
echo "============================================================"
echo ""
warn "接下来 IT 需要手动完成 2 步:"
echo ""
echo "  1) 配置 Nginx vhost:"
echo "     sudo cp $INSTALL_DIR/deploy/nginx.conf /etc/nginx/sites-available/topchampion.conf"
echo "     sudo ln -s /etc/nginx/sites-available/topchampion.conf /etc/nginx/sites-enabled/"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  2) 申请 SSL 证书:"
echo "     sudo certbot --nginx -d www.topchampion.net -d topchampion.net"
echo ""
echo "完成后访问: https://www.topchampion.net"
echo "后台地址 : https://www.topchampion.net/admin/login"
echo "管理员账号: admin"
echo "管理员密码: 见 /root/topchampion-admin-password.txt"
echo ""
