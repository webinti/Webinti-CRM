#!/bin/bash
# Setup Supabase self-hosted sur VPS Ubuntu 24.04
# Usage : bash setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Supabase Self-Hosted — Setup VPS ==="
echo ""

# ─── 1. Prérequis ────────────────────────────
echo "1/6 — Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    echo "  Installation de Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    echo "  ✓ Docker installé — relance ta session SSH puis relance ce script"
    exit 0
fi

if ! command -v docker compose &> /dev/null; then
    echo "  ERREUR : docker compose non disponible"
    echo "  Installe Docker Compose V2 : sudo apt install docker-compose-plugin"
    exit 1
fi

echo "  ✓ Docker $(docker --version | grep -oP '\d+\.\d+\.\d+')"
echo "  ✓ Compose $(docker compose version --short)"
echo ""

# ─── 2. Fichier .env ─────────────────────────
echo "2/6 — Configuration..."

if [ ! -f "$SCRIPT_DIR/.env" ]; then
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
    echo "  ⚠ Fichier .env créé depuis .env.example"
    echo "  → MODIFIE les secrets dans $SCRIPT_DIR/.env AVANT de continuer !"
    echo ""
    echo "  Secrets à changer :"
    echo "    - POSTGRES_PASSWORD"
    echo "    - JWT_SECRET (openssl rand -hex 32)"
    echo "    - DASHBOARD_PASSWORD"
    echo "    - ANON_KEY et SERVICE_ROLE_KEY (génère sur supabase.com/docs/guides/self-hosting#api-keys)"
    echo ""
    echo "  Puis relance : bash setup.sh"
    exit 0
fi

# Vérifier que les secrets ont été changés
source "$SCRIPT_DIR/.env"
if [ "$POSTGRES_PASSWORD" = "change-me-super-secret" ]; then
    echo "  ERREUR : Change POSTGRES_PASSWORD dans .env"
    exit 1
fi
if [ "$DASHBOARD_PASSWORD" = "change-me-dashboard-password" ]; then
    echo "  ERREUR : Change DASHBOARD_PASSWORD dans .env"
    exit 1
fi

echo "  ✓ .env configuré"
echo ""

# ─── 3. Nginx ────────────────────────────────
echo "3/6 — Configuration Nginx..."

if ! command -v nginx &> /dev/null; then
    sudo apt update && sudo apt install -y nginx
fi

sudo cp "$SCRIPT_DIR/nginx-supabase.conf" /etc/nginx/sites-available/supabase.webinti.com
sudo ln -sf /etc/nginx/sites-available/supabase.webinti.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "  ✓ Nginx configuré"
echo ""

# ─── 4. SSL avec Certbot ─────────────────────
echo "4/6 — Certificats SSL..."

if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
fi

echo "  Lance les commandes suivantes pour activer HTTPS :"
echo "    sudo certbot --nginx -d supabase.webinti.com"
echo "    sudo certbot --nginx -d api.supabase.webinti.com"
echo ""

# ─── 5. Lancement ────────────────────────────
echo "5/6 — Démarrage de Supabase..."

cd "$SCRIPT_DIR"
docker compose pull
docker compose up -d

echo ""
echo "  En attente du démarrage..."
sleep 10

# Vérifier que les services tournent
RUNNING=$(docker compose ps --status running --format json | grep -c "running" || echo "0")
TOTAL=$(docker compose ps --format json | wc -l)
echo "  Services : $RUNNING/$TOTAL en cours d'exécution"
echo ""

# ─── 6. Vérification ─────────────────────────
echo "6/6 — Vérification..."

echo "  Studio    : http://localhost:${STUDIO_PORT:-3000}"
echo "  API Kong  : http://localhost:${KONG_HTTP_PORT:-8000}"
echo "  PostgreSQL: localhost:${PG_PORT:-5432}"
echo ""

echo "=== ✓ Supabase self-hosted déployé ==="
echo ""
echo "Accès Studio :"
echo "  URL  : https://supabase.webinti.com (après Certbot)"
echo "  Local: http://localhost:${STUDIO_PORT:-3000}"
echo ""
echo "Connection string PostgreSQL :"
echo "  postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/postgres"
echo ""
echo "Pour importer SIRENE :"
echo "  cd ../scripts/sirene-import"
echo "  bash 01-download.sh"
echo "  python3 02-filter-csv.py"
echo "  bash 04-import.sh \"postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/postgres\""
