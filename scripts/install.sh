#!/usr/bin/env bash
# Primera instalación en LXC (Ubuntu 22.04 / Debian 12)
# Ejecutar como root: bash scripts/install.sh
# Es seguro ejecutarlo varias veces — no sobreescribe datos existentes.
set -euo pipefail

APP_DIR="/opt/combines"
APP_USER="combines"
DB_NAME="combines"
DB_USER="combines"
NODE_VERSION="20"

echo "=== [1/8] Paquetes del sistema ==="
apt-get update -q
apt-get install -y -q curl git postgresql nginx openssl

echo "=== [2/8] Node.js ${NODE_VERSION} LTS ==="
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y -q nodejs
else
  echo "  ℹ️  Node.js ya instalado: $(node -v)"
fi
npm install -g pnpm pm2 2>/dev/null || true

echo "=== [3/8] PostgreSQL: base de datos y usuario ==="
# Crear usuario si no existe
sudo -u postgres psql -c "
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE USER ${DB_USER} WITH PASSWORD 'PLACEHOLDER';
    END IF;
  END \$\$;
"

# Crear BD si no existe
sudo -u postgres psql -c "
  SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')
" -t | grep -q "CREATE DATABASE" && \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};" || true

# Permisos en schema public (necesario en PostgreSQL 15+)
sudo -u postgres psql -d "${DB_NAME}" -c "
  GRANT ALL ON SCHEMA public TO ${DB_USER};
  ALTER SCHEMA public OWNER TO ${DB_USER};
"

echo "=== [4/8] Clonar repositorio ==="
if [ -d "${APP_DIR}/.git" ]; then
  echo "  ℹ️  Repo ya existe, actualizando"
  git -C "${APP_DIR}" pull --ff-only
else
  rm -rf "${APP_DIR}"
  git clone https://github.com/mikiligero/comb-ines-2.git "${APP_DIR}"
fi

echo "=== [5/8] Usuario del sistema ==="
if ! id "${APP_USER}" &>/dev/null; then
  useradd -r -s /bin/bash -d "${APP_DIR}" "${APP_USER}"
fi
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

echo "=== [6/8] Variables de entorno ==="
if [ ! -f "${APP_DIR}/.env.local" ]; then
  DB_PASS="$(openssl rand -hex 16)"
  AUTH_SECRET="$(openssl rand -hex 32)"

  # Actualizar contraseña del usuario de BD
  sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

  cat > "${APP_DIR}/.env.local" <<ENV
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
AUTH_SECRET=${AUTH_SECRET}
ENV
  chown "${APP_USER}:${APP_USER}" "${APP_DIR}/.env.local"
  echo ""
  echo "  ✅ .env.local creado. Contraseña de BD guardada en /opt/combines/.env.local"
  echo ""
else
  echo "  ℹ️  .env.local ya existe, no se sobreescribe"
fi

echo "=== [7/8] Instalar deps, migrar BD y compilar ==="
cd "${APP_DIR}"
sudo -u "${APP_USER}" pnpm install --frozen-lockfile
sudo -u "${APP_USER}" pnpm db:migrate
sudo -u "${APP_USER}" pnpm build

echo "=== [8/8] PM2: arrancar y guardar ==="
if sudo -u "${APP_USER}" pm2 describe combines &>/dev/null; then
  sudo -u "${APP_USER}" pm2 restart combines
else
  sudo -u "${APP_USER}" pm2 start npm --name combines -- start -- -p 3000
fi
sudo -u "${APP_USER}" pm2 save
pm2 startup systemd -u "${APP_USER}" --hp "${APP_DIR}" | tail -1 | bash || true

echo ""
echo "=== [nginx] Proxy inverso ==="
cat > /etc/nginx/sites-available/combines <<NGINX
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/combines /etc/nginx/sites-enabled/combines
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "✅ Instalación completa. La app corre en http://$(hostname -I | awk '{print $1}')"
echo ""
echo "   Para añadir SSL:"
echo "   apt install certbot python3-certbot-nginx"
echo "   certbot --nginx -d tudominio.com"
