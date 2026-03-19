#!/bin/bash
# Cron job pour scorer les nouveaux leads toutes les nuits
# Ajouter dans crontab : 0 3 * * * /path/to/cron-score.sh
#
# Prérequis : pip install psycopg2-binary

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/score-$(date +%Y%m%d).log"
mkdir -p "$SCRIPT_DIR/logs"

# Variables d'environnement (à configurer)
DB_URL="${DATABASE_URL:-postgresql://user:pass@host:5432/dbname}"
PAGESPEED_KEY="${GOOGLE_PAGESPEED_API_KEY:-AIzaSy...}"

echo "=== $(date) — Début scoring ===" >> "$LOG_FILE"

python3 "$SCRIPT_DIR/score-websites.py" \
  --db "$DB_URL" \
  --api-key "$PAGESPEED_KEY" \
  --batch 200 \
  --delay 0.5 \
  >> "$LOG_FILE" 2>&1

echo "=== $(date) — Fin scoring ===" >> "$LOG_FILE"

# Nettoyage logs > 30 jours
find "$SCRIPT_DIR/logs" -name "score-*.log" -mtime +30 -delete
