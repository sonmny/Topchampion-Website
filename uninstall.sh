#!/bin/bash
# ============================================================
# 苏州赛冠官网 — 卸载脚本
#
# 用途:完全移除赛冠官网,**绝不影响**其他服务(LNMP / 邮件)
# 用法:sudo bash uninstall.sh
#
# 卸载内容:
#   ✅ 停止并移除 topchampion-backend 进程
#   ✅ 移除 supervisor 配置(独立文件,不动其他进程)
#   ✅ 移除 Nginx vhost 配置(不动其他 vhost)
#   ✅ 可选:删除应用目录 /opt/topchampion
#   ✅ 可选:删除 MongoDB 数据(数据库 topchampion_prod)
#
# 不卸载的内容:
#   ❌ MongoDB 本身(可能其他应用在用)
#   ❌ Python 3.11(可能其他应用在用)
#   ❌ Nginx(肯定其他网站在用)
#   ❌ supervisor 主程序
#   ❌ MySQL / PHP / 邮件服务等 — 一律不碰
# ============================================================

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

[ "$EUID" -eq 0 ] || err "请用 root / sudo 运行"

INSTALL_DIR=${INSTALL_DIR:-/opt/topchampion}

echo ""
echo "============================================================"
echo " 苏州赛冠官网 — 卸载程序"
echo "============================================================"
echo ""
warn "本脚本会卸载赛冠官网,但**绝不影响**:"
echo "  - 现有 Nginx / MySQL / PHP 网站"
echo "  - 邮件服务(Postfix / Dovecot / Exim)"
echo "  - 其他使用 MongoDB 或 Python 的应用"
echo ""
read -p "确认卸载?(y/N): " ans
[ "$ans" = "y" ] || { log "已取消"; exit 0; }

# ============================================================
# 1. 停止并移除后端进程
# ============================================================
log "[1/5] 停止后端进程..."
if supervisorctl status topchampion-backend >/dev/null 2>&1; then
  supervisorctl stop topchampion-backend || true
  log "       后端已停止"
else
  warn "       后端未运行,跳过"
fi

# ============================================================
# 2. 移除 supervisor 配置
# ============================================================
log "[2/5] 移除 supervisor 配置..."
if [ -f "/etc/supervisor/conf.d/topchampion.conf" ]; then
  rm -f /etc/supervisor/conf.d/topchampion.conf
  supervisorctl reread >/dev/null
  supervisorctl update >/dev/null
  log "       已清理 /etc/supervisor/conf.d/topchampion.conf"
else
  warn "       未找到 supervisor 配置,跳过"
fi

# ============================================================
# 3. 移除 Nginx vhost(仅本应用的,其他站点不动)
# ============================================================
log "[3/5] 移除 Nginx 配置..."
REMOVED=0
if [ -f "/etc/nginx/sites-enabled/topchampion.conf" ]; then
  rm -f /etc/nginx/sites-enabled/topchampion.conf
  REMOVED=1
fi
if [ -f "/etc/nginx/sites-available/topchampion.conf" ]; then
  rm -f /etc/nginx/sites-available/topchampion.conf
  REMOVED=1
fi
if [ -f "/etc/nginx/conf.d/topchampion.conf" ]; then
  rm -f /etc/nginx/conf.d/topchampion.conf
  REMOVED=1
fi

if [ "$REMOVED" = "1" ]; then
  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log "       已移除 Nginx 配置并平滑重载(其他站点不中断)"
  else
    warn "       Nginx 测试失败,未重载,请手动检查 sudo nginx -t"
  fi
else
  warn "       未找到 Nginx 配置,跳过"
fi

# ============================================================
# 4. 询问是否删除应用目录
# ============================================================
echo ""
warn "是否删除应用目录 $INSTALL_DIR?"
echo "       (包含上传的文件、配置、Python 虚拟环境)"
read -p "       删除?(y/N): " del_dir
if [ "$del_dir" = "y" ]; then
  log "[4/5] 删除 $INSTALL_DIR..."
  rm -rf "$INSTALL_DIR"
  log "       已删除"
else
  warn "[4/5] 保留 $INSTALL_DIR(可手动 rm -rf 移除)"
fi

# 顺便清理密码文件
if [ -f "/root/topchampion-admin-password.txt" ]; then
  rm -f /root/topchampion-admin-password.txt
  log "       已清理 /root/topchampion-admin-password.txt"
fi

# ============================================================
# 5. 询问是否删除 MongoDB 数据
# ============================================================
echo ""
warn "是否删除 MongoDB 中的赛冠数据库(topchampion_prod)?"
echo "       (不删除 MongoDB 本身,只删数据库)"
read -p "       删除数据库?(y/N): " del_db
if [ "$del_db" = "y" ]; then
  log "[5/5] 删除数据库 topchampion_prod..."
  if command -v mongosh >/dev/null 2>&1; then
    mongosh --quiet --eval "db.getSiblingDB('topchampion_prod').dropDatabase()" || true
  elif command -v mongo >/dev/null 2>&1; then
    mongo --quiet --eval "db.getSiblingDB('topchampion_prod').dropDatabase()" || true
  fi
  log "       数据库已删除"
else
  warn "[5/5] 保留 MongoDB 数据库(可用 mongosh 手动 dropDatabase)"
fi

# ============================================================
# 完成
# ============================================================
echo ""
echo "============================================================"
log "🎉 卸载完成"
echo "============================================================"
echo ""
echo "未卸载的内容(可能其他应用在用):"
echo "  - MongoDB 服务(数据库 topchampion_prod 已$([ "$del_db" = "y" ] && echo "删除" || echo "保留"))"
echo "  - Python 3.11"
echo "  - supervisor"
echo "  - Nginx"
echo "  - certbot 证书(可用 sudo certbot delete 单独删除)"
echo ""
echo "如需完全清理上述内容,请手动:"
echo "  sudo apt remove --purge mongodb-org python3.11 supervisor    # 谨慎!"
echo "  sudo certbot delete --cert-name www.topchampion.net"
echo ""
