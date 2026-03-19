# Import SIRENE — Base locale de prospection

Remplace l'API `recherche-entreprises.api.gouv.fr` par une base PostgreSQL locale pour la prospection automatisée.

## Pipeline

```
01-download.sh     → Télécharge le stock établissements (~2GB zip, ~12GB CSV)
02-filter-csv.py   → Filtre : actifs + codes NAF cibles → ~2-4M lignes, ~300MB
03-create-table.sql → DDL table + index
04-import.sh       → Import complet (download + filter + SQL + \copy)
05-api-endpoint-example.ts → Endpoint Next.js de remplacement
```

## Exécution

```bash
# 1. Télécharger
chmod +x 01-download.sh
./01-download.sh

# 2. Filtrer (Python 3 requis, aucune dépendance)
python3 02-filter-csv.py

# 3. Importer dans PostgreSQL
chmod +x 04-import.sh
./04-import.sh "postgresql://user:pass@host:5432/dbname?sslmode=require"
```

## Codes NAF inclus

| Division | Secteur |
|----------|---------|
| 41-43 | BTP, construction |
| 47 | Commerce de détail |
| 55-56 | Hôtellerie, restauration |
| 62-63 | IT, services d'information |
| 68 | Immobilier |
| 69-74 | Services aux entreprises (juridique, conseil, archi, pub...) |
| 78 | Emploi |
| 82 | Soutien aux entreprises |
| 86 | Santé |
| 95-96 | Réparation, services personnels |

## Requêtes utiles

```sql
-- Restaurants dans le 75
SELECT * FROM sirene_etablissements
WHERE departement = '75' AND code_naf LIKE '56%'
LIMIT 25;

-- Agences web à Lyon
SELECT * FROM sirene_etablissements
WHERE code_postal LIKE '69%' AND code_naf IN ('62.01Z', '62.09Z')
ORDER BY raison_sociale;

-- Stats par département
SELECT departement, COUNT(*) as nb
FROM sirene_etablissements
GROUP BY departement
ORDER BY nb DESC;
```

## Mise à jour

Le stock établissements est mis à jour mensuellement par l'INSEE.
Pour mettre à jour : relancer le pipeline complet (01 → 04).
Alternative : utiliser le fichier de mise à jour quotidien (StockEtablissement_utf8_geo.csv) pour des deltas.

## Taille estimée

| Étape | Taille |
|-------|--------|
| ZIP téléchargé | ~2 GB |
| CSV brut | ~12 GB |
| CSV filtré | ~300-500 MB |
| Table PostgreSQL | ~500 MB - 1 GB (avec index) |
