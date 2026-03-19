#!/bin/bash
# Étape 4 : Importer le CSV filtré dans PostgreSQL
# Usage : ./04-import.sh <DATABASE_URL>
# Exemple : ./04-import.sh "postgresql://user:pass@host:5432/dbname?sslmode=require"

set -euo pipefail

WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
CSV_FILE="$WORK_DIR/data/etablissements_filtres.csv"
SQL_FILE="$WORK_DIR/03-create-table.sql"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <DATABASE_URL>"
  echo ""
  echo "Exemples :"
  echo "  # Neon"
  echo "  $0 \"postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require\""
  echo ""
  echo "  # Supabase"
  echo "  $0 \"postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres\""
  echo ""
  echo "  # Local"
  echo "  $0 \"postgresql://postgres:postgres@localhost:5432/postgres\""
  exit 1
fi

DATABASE_URL="$1"

if [ ! -f "$CSV_FILE" ]; then
  echo "ERREUR : CSV filtré non trouvé : $CSV_FILE"
  echo "Lance d'abord : python3 02-filter-csv.py"
  exit 1
fi

echo "=== Import SIRENE dans PostgreSQL ==="
echo ""

# Étape 1 : Créer la table
echo "1/3 — Création de la table..."
psql "$DATABASE_URL" -f "$SQL_FILE"
echo "✓ Table créée"
echo ""

# Étape 2 : Import CSV avec \copy
echo "2/3 — Import du CSV (~2-4M lignes, patience...)..."
LINES=$(wc -l < "$CSV_FILE")
echo "  Fichier : $CSV_FILE"
echo "  Lignes  : $((LINES - 1)) (hors header)"
echo ""

psql "$DATABASE_URL" -c "\copy sirene_etablissements(siret, siren, raison_sociale, enseigne, adresse, code_postal, ville, departement, code_commune, code_naf, date_creation, tranche_effectifs) FROM '$CSV_FILE' WITH (FORMAT csv, HEADER true, NULL '')"

echo "✓ Import terminé"
echo ""

# Étape 3 : Vérification
echo "3/3 — Vérification..."
psql "$DATABASE_URL" -c "
  SELECT
    COUNT(*) as total,
    COUNT(DISTINCT departement) as departements,
    COUNT(DISTINCT code_naf) as codes_naf
  FROM sirene_etablissements;
"

echo ""
echo "Top 10 départements :"
psql "$DATABASE_URL" -c "
  SELECT departement, COUNT(*) as nb
  FROM sirene_etablissements
  GROUP BY departement
  ORDER BY nb DESC
  LIMIT 10;
"

echo ""
echo "Top 10 codes NAF :"
psql "$DATABASE_URL" -c "
  SELECT code_naf, COUNT(*) as nb
  FROM sirene_etablissements
  GROUP BY code_naf
  ORDER BY nb DESC
  LIMIT 10;
"

echo ""
echo "✓ Import complet !"
