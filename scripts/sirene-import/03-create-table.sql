-- Étape 3 : Créer la table sirene_etablissements
-- Compatible PostgreSQL (Neon, Supabase, ou tout Postgres)

-- Supprime la table si elle existe (pour ré-import)
DROP TABLE IF EXISTS sirene_etablissements;

CREATE TABLE sirene_etablissements (
    siret           VARCHAR(14) PRIMARY KEY,
    siren           VARCHAR(9) NOT NULL,
    raison_sociale  TEXT,
    enseigne        TEXT,
    adresse         TEXT,
    code_postal     VARCHAR(5),
    ville           TEXT,
    departement     VARCHAR(3),
    code_commune    VARCHAR(5),
    code_naf        VARCHAR(6),
    date_creation   DATE,
    tranche_effectifs VARCHAR(2)
);

-- Index pour requêtes de prospection rapides
CREATE INDEX idx_sirene_code_postal ON sirene_etablissements (code_postal);
CREATE INDEX idx_sirene_departement ON sirene_etablissements (departement);
CREATE INDEX idx_sirene_code_naf ON sirene_etablissements (code_naf);
CREATE INDEX idx_sirene_siren ON sirene_etablissements (siren);

-- Index composite pour les recherches typiques : "restaurants dans le 75"
CREATE INDEX idx_sirene_dept_naf ON sirene_etablissements (departement, code_naf);
CREATE INDEX idx_sirene_cp_naf ON sirene_etablissements (code_postal, code_naf);

-- Commentaire table
COMMENT ON TABLE sirene_etablissements IS 'Base SIRENE filtrée — établissements actifs, secteurs cibles pour prospection';
