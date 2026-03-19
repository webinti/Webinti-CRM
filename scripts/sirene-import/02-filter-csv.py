#!/usr/bin/env python3
"""
Étape 2 : Filtrer le CSV SIRENE
- Établissements actifs uniquement (etatAdministratifEtablissement == 'A')
- Codes NAF pertinents pour la prospection web
- Export CSV léger avec colonnes utiles
"""

import csv
import sys
import os
from pathlib import Path

WORK_DIR = Path(__file__).parent / "data"
INPUT_FILE = WORK_DIR / "StockEtablissement_utf8.csv"
OUTPUT_FILE = WORK_DIR / "etablissements_filtres.csv"

# Codes NAF ciblés (2 premiers caractères = division)
# Format dans le CSV : "62.01Z" (avec point et lettre)
CODES_NAF_PREFIXES = {
    # Commerces
    "47",   # Commerce de détail
    # Restauration / Hébergement
    "55",   # Hébergement
    "56",   # Restauration
    # Artisans / BTP
    "41",   # Construction de bâtiments
    "42",   # Génie civil
    "43",   # Travaux de construction spécialisés
    "95",   # Réparation ordinateurs et biens personnels
    # Services aux entreprises
    "62",   # Programmation, conseil informatique
    "63",   # Services d'information
    "69",   # Activités juridiques et comptables
    "70",   # Conseil de gestion
    "71",   # Architecture, ingénierie, contrôle
    "72",   # R&D scientifique
    "73",   # Publicité et études de marché
    "74",   # Autres activités spécialisées
    "78",   # Activités liées à l'emploi
    "82",   # Activités de soutien aux entreprises
    # Immobilier
    "68",   # Activités immobilières
    # Santé / Bien-être
    "86",   # Activités pour la santé humaine
    "96",   # Services personnels (coiffure, beauté, etc.)
}

# Colonnes source → colonnes destination
COLUMNS_MAP = {
    "siret": "siret",
    "siren": "siren",
    "denominationUniteLegale": "raison_sociale",
    "denominationUsuelleEtablissement": "enseigne",
    "numeroVoieEtablissement": "numero_voie",
    "typeVoieEtablissement": "type_voie",
    "libelleVoieEtablissement": "libelle_voie",
    "complementAdresseEtablissement": "complement_adresse",
    "codePostalEtablissement": "code_postal",
    "libelleCommuneEtablissement": "ville",
    "codeCommuneEtablissement": "code_commune",
    "activitePrincipaleEtablissement": "code_naf",
    "dateCreationEtablissement": "date_creation",
    "trancheEffectifsEtablissement": "tranche_effectifs",
    "etatAdministratifEtablissement": "etat",
}

OUTPUT_COLUMNS = [
    "siret", "siren", "raison_sociale", "enseigne",
    "adresse", "code_postal", "ville", "departement", "code_commune",
    "code_naf", "date_creation", "tranche_effectifs",
]


def build_adresse(row):
    parts = []
    num = row.get("numeroVoieEtablissement", "").strip()
    type_voie = row.get("typeVoieEtablissement", "").strip()
    libelle = row.get("libelleVoieEtablissement", "").strip()
    complement = row.get("complementAdresseEtablissement", "").strip()

    if num:
        parts.append(num)
    if type_voie:
        parts.append(type_voie)
    if libelle:
        parts.append(libelle)

    adresse = " ".join(parts)
    if complement:
        adresse = f"{complement}, {adresse}" if adresse else complement
    return adresse


def get_departement(code_postal):
    if not code_postal or len(code_postal) < 2:
        return ""
    # DOM-TOM : 3 premiers chiffres
    if code_postal.startswith(("97", "98")):
        return code_postal[:3]
    # Corse
    if code_postal.startswith("20"):
        cp_int = int(code_postal) if code_postal.isdigit() else 0
        if 20000 <= cp_int <= 20190:
            return "2A"
        elif 20200 <= cp_int <= 20999:
            return "2B"
    return code_postal[:2]


def matches_naf(code_naf):
    if not code_naf:
        return False
    # Le code NAF dans le CSV est format "62.01Z" — on prend les 2 premiers chars
    prefix = code_naf[:2]
    return prefix in CODES_NAF_PREFIXES


def main():
    if not INPUT_FILE.exists():
        print(f"ERREUR : fichier non trouvé : {INPUT_FILE}")
        print("Lance d'abord 01-download.sh")
        sys.exit(1)

    print(f"Lecture de {INPUT_FILE}...")
    print(f"Filtrage : établissements actifs + {len(CODES_NAF_PREFIXES)} divisions NAF")
    print(f"Sortie : {OUTPUT_FILE}")
    print()

    total = 0
    kept = 0

    with open(INPUT_FILE, "r", encoding="utf-8") as fin, \
         open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as fout:

        reader = csv.DictReader(fin)
        writer = csv.DictWriter(fout, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()

        for row in reader:
            total += 1

            if total % 5_000_000 == 0:
                print(f"  ... {total:,} lignes lues, {kept:,} gardées")

            # Filtre 1 : actif uniquement
            if row.get("etatAdministratifEtablissement") != "A":
                continue

            # Filtre 2 : code NAF pertinent
            code_naf = row.get("activitePrincipaleEtablissement", "")
            if not matches_naf(code_naf):
                continue

            # Filtre 3 : doit avoir un code postal (pas d'établissement étranger)
            code_postal = row.get("codePostalEtablissement", "").strip()
            if not code_postal:
                continue

            kept += 1

            writer.writerow({
                "siret": row.get("siret", ""),
                "siren": row.get("siren", ""),
                "raison_sociale": row.get("denominationUniteLegale", ""),
                "enseigne": row.get("denominationUsuelleEtablissement", ""),
                "adresse": build_adresse(row),
                "code_postal": code_postal,
                "ville": row.get("libelleCommuneEtablissement", ""),
                "departement": get_departement(code_postal),
                "code_commune": row.get("codeCommuneEtablissement", ""),
                "code_naf": code_naf,
                "date_creation": row.get("dateCreationEtablissement", ""),
                "tranche_effectifs": row.get("trancheEffectifsEtablissement", ""),
            })

    print()
    print(f"✓ Terminé")
    print(f"  Total lu : {total:,}")
    print(f"  Gardés   : {kept:,}")
    print(f"  Fichier  : {OUTPUT_FILE}")
    print(f"  Taille   : {os.path.getsize(OUTPUT_FILE) / 1_000_000:.1f} MB")


if __name__ == "__main__":
    main()
