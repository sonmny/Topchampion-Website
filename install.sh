#!/bin/bash
# ============================================================
# 苏州赛冠官网 — 一键安装脚本(防御性版本,LNMP 共存安全)
#
# 适用:Ubuntu 20.04+ / Debian 11+ / Alibaba Cloud Linux
# 已有 LNMP / 邮件服务的服务器:✅ 安全,不会动现有服务
#
# 执行:sudo bash install.sh
#
# 安装位置:/opt/topchampion (可通过环境变量 INSTALL_DIR 修改)
# ============================================================

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

[ "$EUID" -eq 0 ] || err "请用 root / sudo 运行"

INSTALL_DIR=${INSTALL_DIR:-/opt/topchampion}
[ -d "$INSTALL_DIR/backend" ] || err "未找到 $INSTALL_DIR/backend,请先解压本包到 $INSTALL_DIR"

# ============================================================
# 🛡️  防护检查 — 确保不影响现有服务
# ============================================================
info "============================================================"
info " 苏州赛冠官网 — 安装前环境检查"
info "============================================================"

# 检测现有服务
HAS_NGINX=$(systemctl is-active nginx 2>/dev/null || echo "no")
HAS_MYSQL=$(systemctl is-active mysql 2>/dev/null || systemctl is-active mariadb 2>/dev/null || echo "no")
HAS_PHP=$(command -v php >/dev/null 2>&1 && echo "yes" || echo "no")
HAS_POSTFIX=$(systemctl is-active postfix 2>/dev/null || echo "no")
HAS_DOVECOT=$(systemctl is-active dovecot 2>/dev/null || echo "no")
HAS_EXIM=$(systemctl is-active exim4 2>/dev/null || echo "no")
HAS_MONGO=$(command -v mongod >/dev/null 2>&1 && echo "yes" || echo "no")

[ "$HAS_NGINX" = "active" ]   && info "现有服务:Nginx (运行中,将共存,不重启)"
[ "$HAS_MYSQL" = "active" ]   && info "现有服务:MySQL/MariaDB (运行中,不会动它)"
[ "$HAS_PHP" = "yes" ]        && info "现有服务:PHP (已装,不会动它)"
[ "$HAS_POSTFIX" = "active" ] && info "现有服务:Postfix 邮件 (运行中,不会动它)"
[ "$HAS_DOVECOT" = "active" ] && info "现有服务:Dovecot IMAP (运行中,不会动它)"
[ "$HAS_EXIM" = "active" ]    && info "现有服务:Exim 邮件 (运行中,不会动它)"

# 检测关键端口冲突
PORT_8001_USED=$(ss -tln 2>/dev/null | grep -c ':8001 ' || echo 0)
PORT_27017_USED=$(ss -tln 2>/dev/null | grep -c ':27017 ' || echo 0)

if [ "$PORT_8001_USED" != "0" ]; then
  err "端口 8001 已被占用!请先释放,或修改 deploy/supervisor.conf 改用其他端口"
fi

if [ "$PORT_27017_USED" != "0" ] && [ "$HAS_MONGO" != "yes" ]; then
  warn "端口 27017 已被占用且没有 mongod,可能是其他服务"
  read -p "继续吗?(y/N): " ans
  [ "$ans" = "y" ] || err "已取消"
fi

# 磁盘空间检查
FREE_MB=$(df -m / | awk 'NR==2 {print $4}')
[ "$FREE_MB" -ge 2000 ] || err "/ 分区可用空间不足 2GB,请先清理"
info "磁盘可用空间:${FREE_MB} MB ✓"

# 内存检查
TOTAL_MB=$(free -m | awk 'NR==2 {print $2}')
[ "$TOTAL_MB" -ge 1500 ] || warn "服务器内存 ${TOTAL_MB} MB,推荐 ≥ 2GB"

echo ""
info "环境检查通过,开始安装(预计 5-10 分钟)..."
echo ""

# ============================================================
# 1. Python 3.11(不动系统 Python)
# ============================================================
if ! command -v python3.11 >/dev/null 2>&1; then
  log "[1/7] 安装 Python 3.11..."
  apt update -qq
  # 只装需要的包,不做 apt upgrade(避免动其他服务)
  apt install -y --no-install-recommends \
    python3.11 python3.11-venv python3.11-dev build-essential
else
  log "[1/7] Python 3.11 已存在,跳过"
fi

# ============================================================
# 2. MongoDB 7(全新装,或复用已有)
# ============================================================
if [ "$HAS_MONGO" != "yes" ]; then
  log "[2/7] 安装 MongoDB 7..."
  # 检测系统
  if grep -q -i "ubuntu" /etc/os-release; then
    CODENAME=$(lsb_release -cs)
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add - >/dev/null 2>&1
    echo "deb [arch=amd64,arm64] https://repo.mongodb.org/apt/ubuntu $CODENAME/mongodb-org/7.0 multiverse" \
      > /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update -qq
    apt install -y mongodb-org
  elif grep -q -i "debian" /etc/os-release; then
    CODENAME=$(lsb_release -cs)
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add - >/dev/null 2>&1
    echo "deb http://repo.mongodb.org/apt/debian $CODENAME/mongodb-org/7.0 main" \
      > /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update -qq && apt install -y mongodb-org
  else
    err "不支持的系统,请手动安装 MongoDB 7 后重跑本脚本"
  fi
  systemctl enable --now mongod
  sleep 3
else
  log "[2/7] MongoDB 已存在(版本 $(mongod --version | head -1)),将复用"
  systemctl is-active mongod >/dev/null 2>&1 || systemctl start mongod
fi

# 验证 MongoDB 健康
sleep 2
if command -v mongosh >/dev/null 2>&1; then
  mongosh --quiet --eval "db.runCommand({ping:1})" >/dev/null && log "       MongoDB 健康" || err "MongoDB 启动失败"
elif command -v mongo >/dev/null 2>&1; then
  mongo --quiet --eval "db.runCommand({ping:1})" >/dev/null && log "       MongoDB 健康" || err "MongoDB 启动失败"
fi

# ============================================================
# 3. Supervisor + Certbot
# ============================================================
log "[3/7] 安装 supervisor + certbot..."
apt install -y --no-install-recommends \
  supervisor certbot python3-certbot-nginx curl wget >/dev/null 2>&1

# ============================================================
# 4. Python 虚拟环境 + 依赖
# ============================================================
log "[4/7] 创建 Python 虚拟环境..."
cd "$INSTALL_DIR/backend"
if [ ! -d ".venv" ]; then
  python3.11 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip -q
log "       安装后端依赖(约 1-2 分钟)..."
pip install -r requirements.txt -q

# ============================================================
# 5. .env 配置(自动生成强密码)
# ============================================================
if [ ! -f "$INSTALL_DIR/backend/.env" ]; then
  log "[5/7] 生成初始配置..."
  cp .env.example .env
  JWT_SECRET=$(openssl rand -hex 32)
  ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d '+/=' | cut -c1-16)
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
  sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$ADMIN_PASSWORD|" .env
  chmod 600 .env

  # 把密码保存到安全位置
  echo "$ADMIN_PASSWORD" > /root/topchampion-admin-password.txt
  chmod 600 /root/topchampion-admin-password.txt
  log "       JWT_SECRET 已生成"
  log "       ADMIN_USERNAME: admin"
  log "       ADMIN_PASSWORD: $ADMIN_PASSWORD"
  warn "       密码已保存到 /root/topchampion-admin-password.txt(请妥善记录后删除)"
else
  log "[5/7] .env 已存在,跳过(如需重置请删除 .env 后重跑)"
fi

# ============================================================
# 6. 权限 + supervisor 配置
# ============================================================
log "[6/7] 配置文件权限 + 进程守护..."
mkdir -p "$INSTALL_DIR/backend/uploads"
chown -R www-data:www-data "$INSTALL_DIR/backend/uploads"

# 确保 www-data 能读到 .venv
chmod -R o+rX "$INSTALL_DIR/backend/.venv" 2>/dev/null || true

# 复制 supervisor 配置(独立文件名,不冲突)
cp "$INSTALL_DIR/deploy/supervisor.conf" /etc/supervisor/conf.d/topchampion.conf
supervisorctl reread >/dev/null
supervisorctl update >/dev/null
sleep 3

STATUS=$(supervisorctl status topchampion-backend | awk '{print $2}')
if [ "$STATUS" != "RUNNING" ]; then
  warn "后端未启动,日志如下:"
  supervisorctl tail topchampion-backend stderr
  err "请根据上面日志排查"
fi

# ============================================================
# 7. 健康检查
# ============================================================
log "[7/7] 后端健康检查..."
sleep 2
HEALTH=$(curl -sf http://127.0.0.1:8001/api/health 2>/dev/null || echo "FAIL")
echo "$HEALTH" | grep -q "healthy" || { warn "后端健康检查失败:$HEALTH"; supervisorctl tail topchampion-backend stderr; err "请检查日志"; }
log "       后端正常:$HEALTH"

# ============================================================
# 完成 — 给出下一步操作指引
# ============================================================
echo ""
echo "============================================================"
log "🎉 后端 + 数据库部署完成!"
echo "============================================================"
echo ""
warn "接下来 IT 需要手动完成 Nginx + SSL 两步:"
echo ""
echo "  📋 步骤 A: 配置 Nginx vhost"
echo "  ──────────────────────────────────────────────"

# 检测 Nginx 配置目录风格
if [ -d "/etc/nginx/sites-available" ]; then
  echo "  sudo cp $INSTALL_DIR/deploy/nginx.conf /etc/nginx/sites-available/topchampion.conf"
  echo "  sudo ln -sf /etc/nginx/sites-available/topchampion.conf /etc/nginx/sites-enabled/"
else
  echo "  sudo cp $INSTALL_DIR/deploy/nginx.conf /etc/nginx/conf.d/topchampion.conf"
fi

echo "  sudo nginx -t                    # 必须看到 OK"
echo "  sudo systemctl reload nginx      # 平滑重载,现有站点不中断"
echo ""
echo "  📋 步骤 B: 申请免费 SSL 证书"
echo "  ──────────────────────────────────────────────"
echo "  sudo certbot --nginx -d www.topchampion.net -d topchampion.net"
echo ""
echo "============================================================"
echo "完成后访问: https://www.topchampion.net"
echo "后台地址 : https://www.topchampion.net/admin/login"
echo "管理员账号: admin"
echo "管理员密码: cat /root/topchampion-admin-password.txt"
echo "============================================================"
echo ""
echo "📞 出问题时:"
echo "  - 看后端日志: sudo tail -f /var/log/topchampion-backend.err.log"
echo "  - 重启后端  : sudo supervisorctl restart topchampion-backend"
echo "  - 卸载本应用: sudo bash $INSTALL_DIR/deploy/uninstall.sh"
echo ""
