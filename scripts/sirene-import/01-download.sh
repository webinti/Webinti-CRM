#!/bin/bash
# Étape 1 : Télécharger le stock établissements SIRENE
# Source : https://www.data.gouv.fr/fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/
# Le fichier fait ~2GB compressé, ~12GB décompressé

set -euo pipefail

WORK_DIR="$(cd "$(dirname "$0")" && pwd)/data"
mkdir -p "$WORK_DIR"

CSV_URL="https://files.data.gouv.fr/insee-sirene/StockEtablissement_utf8.zip"
ZIP_FILE="$WORK_DIR/StockEtablissement_utf8.zip"
CSV_FILE="$WORK_DIR/StockEtablissement_utf8.csv"

if [ -f "$CSV_FILE" ]; then
  echo "✓ CSV déjà présent : $CSV_FILE"
  echo "  Supprime-le pour re-télécharger."
  exit 0
fi

echo "Téléchargement du stock établissements SIRENE (~2GB)..."
echo "URL : $CSV_URL"
echo ""

wget -c -O "$ZIP_FILE" "$CSV_URL"

echo ""
echo "Décompression..."
unzip -o "$ZIP_FILE" -d "$WORK_DIR"

echo ""
echo "✓ Fichier prêt : $CSV_FILE"
echo "  Taille : $(du -h "$CSV_FILE" | cut -f1)"

# Optionnel : supprimer le zip
# rm "$ZIP_FILE"
