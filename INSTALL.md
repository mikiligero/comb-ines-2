# Instalación de Comb-ines en Proxmox LXC

## Requisitos previos

- Proxmox VE 7 o superior
- Acceso a la interfaz web de Proxmox
- Conexión a internet desde el LXC

---

## 1. Crear el contenedor LXC en Proxmox

### 1.1 Descargar la plantilla

En la interfaz web de Proxmox, ve a:

**Datacenter → tu nodo → local (storage) → CT Templates → Templates**

Descarga: **ubuntu-22.04-standard** (o debian-12-standard)

---

### 1.2 Crear el contenedor

Haz clic en **Create CT** (arriba a la derecha) y rellena así:

**Pestaña General**
| Campo | Valor |
|---|---|
| CT ID | (el que asigne Proxmox, p.ej. 100) |
| Hostname | `combines` |
| Password | (pon una contraseña para root) |
| SSH public key | (opcional, recomendado) |

**Pestaña Template**
| Campo | Valor |
|---|---|
| Template | `ubuntu-22.04-standard` |

**Pestaña Disks**
| Campo | Valor |
|---|---|
| Storage | local-lvm (o el que uses) |
| Disk size | `8 GB` mínimo, `16 GB` recomendado |

**Pestaña CPU**
| Campo | Valor |
|---|---|
| Cores | `2` |

**Pestaña Memory**
| Campo | Valor |
|---|---|
| Memory | `1024` MB |
| Swap | `512` MB |

**Pestaña Network**
| Campo | Valor |
|---|---|
| Bridge | `vmbr0` |
| IPv4 | DHCP (o estática si tienes IP fija en tu red) |

**Pestaña DNS**

Dejar por defecto (hereda del nodo Proxmox).

**Pestaña Confirm**

Desmarca **Start after created** si quieres revisar antes. Haz clic en **Finish**.

---

### 1.3 Ajuste imprescindible antes de arrancar

Selecciona el contenedor → **Options** → **Features** → Edit:

| Opción | Valor |
|---|---|
| Nesting | ✅ Activado |

> Nesting es necesario para que Node.js y PM2 funcionen correctamente en un LXC no privilegiado.

Ahora arranca el contenedor: **Start**.

---

## 2. Acceder al contenedor

Desde la interfaz Proxmox, haz clic en **Console**, o conéctate por SSH:

```bash
ssh root@<IP-del-LXC>
```

> La IP aparece en la pestaña **Summary** del contenedor una vez arrancado.

---

## 3. Instalación automática

### 3.1 Clonar el repositorio y ejecutar el script

```bash
apt-get update && apt-get install -y git
git clone https://github.com/mikiligero/comb-ines-2.git /tmp/combines-install
bash /tmp/combines-install/scripts/install.sh
```

El script hace todo automáticamente:

1. Instala Node.js 20, pnpm, PM2, PostgreSQL y nginx
2. Crea la base de datos con una contraseña aleatoria segura
3. Clona el repo en `/opt/combines`
4. Genera el archivo `.env.local` con las credenciales
5. Aplica las migraciones de base de datos
6. Compila la app
7. La arranca con PM2 y la configura para reiniciarse sola
8. Configura nginx como proxy en el puerto 80

> ⚠️ **Anota la contraseña de BD que muestra el script.** La necesitarás si alguna vez accedes a la BD directamente.

---

### 3.2 Verificar que funciona

```bash
pm2 status
```

Deberías ver `combines` con estado `online`.

Abre en el navegador: `http://<IP-del-LXC>`

---

## 4. Crear tu cuenta

Abre la app en el navegador y regístrate. Al crear la cuenta se cargan automáticamente:

- 10 ejercicios de salto
- 2 cuerdas (1/4 LB verde, 1/2 LB blanca)
- 2 rutinas de ejemplo listas para usar

---

## 5. SSL con dominio propio (opcional)

Si tienes un dominio apuntando a la IP del LXC:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d tudominio.com
```

Certbot configura nginx y renueva el certificado automáticamente.

---

## 6. Actualizar la app

Cada vez que haya una nueva versión:

```bash
bash /opt/combines/scripts/update.sh
```

El script hace todo, incluyendo cambios de estructura de base de datos:
1. Descarga los cambios de GitHub
2. Instala dependencias nuevas si las hay
3. **Aplica migraciones de base de datos** — si la versión nueva incluye cambios de estructura (nuevas columnas, tablas, etc.), se aplican automáticamente y de forma segura sin tocar los datos existentes
4. Recompila
5. Reinicia la app

> No necesitas hacer nada especial cuando hay cambios de base de datos. El mismo comando de siempre lo gestiona todo.

---

## 7. Comandos útiles

```bash
# Ver estado de la app
pm2 status

# Ver logs en tiempo real
pm2 logs combines

# Reiniciar manualmente
pm2 restart combines

# Ver logs de nginx
tail -f /var/log/nginx/error.log

# Acceder a la base de datos
sudo -u postgres psql -d combines

# Hacer backup de la BD
sudo -u postgres pg_dump combines > backup_$(date +%Y%m%d).sql

# Restaurar backup
sudo -u postgres psql combines < backup_20260101.sql
```

---

## 8. Backup automático (recomendado)

Crea un cron para hacer backup diario de la BD:

```bash
crontab -e
```

Añade:

```
0 3 * * * sudo -u postgres pg_dump combines > /opt/combines/backups/backup_$(date +\%Y\%m\%d).sql 2>/dev/null
```

```bash
mkdir -p /opt/combines/backups
```

> Proxmox también permite hacer snapshots del LXC completo desde la interfaz web (**Backup** en el menú del contenedor).
