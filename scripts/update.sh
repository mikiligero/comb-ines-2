#!/usr/bin/env bash
# Actualización de la app (ejecutar desde el servidor como root o el usuario combines)
# Uso: bash scripts/update.sh
set -euo pipefail

APP_DIR="/opt/combines"
APP_USER="combines"

echo "=== [1/6] Pull del repositorio ==="
cd "${APP_DIR}"
sudo -u "${APP_USER}" git pull --ff-only
# Re-exec con la versión nueva del script (bash lee el archivo en memoria antes del pull)
if [ "${1:-}" != "--post-pull" ]; then
  exec bash "${APP_DIR}/scripts/update.sh" --post-pull
fi

echo "=== [2/6] Dependencias ==="
sudo -u "${APP_USER}" pnpm install --frozen-lockfile

echo "=== [3/6] Migraciones de base de datos ==="
sudo -u "${APP_USER}" pnpm db:migrate

echo "=== [4/6] Datos de usuario ==="
sudo -u "${APP_USER}" npx tsx scripts/add-cardio-coast.ts

echo "=== [5/6] Tests ==="
sudo -u "${APP_USER}" pnpm test

echo "=== [6/6] Build ==="
sudo -u "${APP_USER}" pnpm build

echo "=== [7/7] Reinicio ==="
sudo -u "${APP_USER}" pm2 restart combines

echo ""
echo "✅ Actualización completa."
sudo -u "${APP_USER}" pm2 status combines
