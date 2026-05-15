#!/usr/bin/env bash
# Actualización de la app (ejecutar desde el servidor como root o el usuario combines)
# Uso: bash scripts/update.sh
set -euo pipefail

APP_DIR="/opt/combines"
APP_USER="combines"

echo "=== [1/5] Pull del repositorio ==="
cd "${APP_DIR}"
sudo -u "${APP_USER}" git pull --ff-only

echo "=== [2/5] Dependencias ==="
sudo -u "${APP_USER}" pnpm install --frozen-lockfile

echo "=== [3/5] Migraciones de base de datos ==="
# Solo aplica las migraciones nuevas. Los datos existentes no se tocan.
sudo -u "${APP_USER}" pnpm db:migrate

echo "=== [4/5] Build ==="
sudo -u "${APP_USER}" pnpm build

echo "=== [5/5] Reinicio ==="
sudo -u "${APP_USER}" pm2 restart combines

echo ""
echo "✅ Actualización completa."
sudo -u "${APP_USER}" pm2 status combines
