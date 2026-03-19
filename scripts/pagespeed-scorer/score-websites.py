#!/usr/bin/env python3
"""
PageSpeed Insights Scorer
- Lit les URLs depuis une table Supabase/Postgres
- Appelle l'API PageSpeed avec rate limiting (500ms entre chaque)
- Stocke les scores dans une table dédiée
- Gère les reprises (skip les URLs déjà scorées)

Usage:
  python3 score-websites.py --db "postgresql://..." --api-key "AIza..."
  python3 score-websites.py --db "postgresql://..." --api-key "AIza..." --batch 100 --delay 0.8
  python3 score-websites.py --db "postgresql://..." --api-key "AIza..." --rescore  # force re-score
"""

import argparse
import json
import time
import sys
import urllib.request
import urllib.parse
import urllib.error
import ssl
from datetime import datetime

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERREUR : psycopg2 requis")
    print("  pip install psycopg2-binary")
    sys.exit(1)


# ─── Configuration ──────────────────────────────────────────────────────────────

PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
CATEGORIES = ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"]
STRATEGY = "MOBILE"

# Table source : leads avec site_web
SOURCE_QUERY = """
    SELECT id, site_web
    FROM leads
    WHERE site_web IS NOT NULL
      AND site_web != ''
      AND statut != 'disqualifie'
    ORDER BY created_at DESC
"""

# Table source alternative : si tu n'as pas de table leads,
# tu peux aussi scorer directement depuis sirene + un join
SOURCE_QUERY_SIRENE = """
    SELECT s.siret as id, s.site_web
    FROM sirene_etablissements s
    WHERE s.site_web IS NOT NULL
      AND s.site_web != ''
    ORDER BY s.siret
"""

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS website_scores (
    id              TEXT PRIMARY KEY,
    url             TEXT NOT NULL,
    score_performance   INTEGER,
    score_accessibility INTEGER,
    score_best_practices INTEGER,
    score_seo           INTEGER,
    score_global        INTEGER,
    is_https        BOOLEAN,
    is_mobile_friendly BOOLEAN,
    issues          JSONB DEFAULT '[]',
    raw_scores      JSONB,
    scored_at       TIMESTAMP DEFAULT NOW(),
    error           TEXT
);

CREATE INDEX IF NOT EXISTS idx_ws_score_global ON website_scores (score_global);
CREATE INDEX IF NOT EXISTS idx_ws_scored_at ON website_scores (scored_at);
"""


# ─── Fonctions ──────────────────────────────────────────────────────────────────

def create_table(conn):
    with conn.cursor() as cur:
        cur.execute(CREATE_TABLE_SQL)
    conn.commit()
    print("✓ Table website_scores prête")


def get_urls_to_score(conn, batch_size, rescore=False):
    if rescore:
        query = f"{SOURCE_QUERY} LIMIT {batch_size}"
    else:
        query = f"""
            SELECT l.id, l.site_web
            FROM leads l
            LEFT JOIN website_scores ws ON ws.id = l.id::text
            WHERE l.site_web IS NOT NULL
              AND l.site_web != ''
              AND l.statut != 'disqualifie'
              AND ws.id IS NULL
            ORDER BY l.created_at DESC
            LIMIT {batch_size}
        """
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(query)
        return cur.fetchall()


def normalize_url(url):
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def call_pagespeed(url, api_key):
    params = {
        "url": url,
        "strategy": STRATEGY,
        "key": api_key,
    }
    for cat in CATEGORIES:
        params[f"category"] = cat

    # Build URL with all categories
    query = urllib.parse.urlencode({"url": url, "strategy": STRATEGY, "key": api_key})
    for cat in CATEGORIES:
        query += f"&category={cat}"

    full_url = f"{PAGESPEED_API_URL}?{query}"

    ctx = ssl.create_default_context()
    req = urllib.request.Request(full_url)
    req.add_header("User-Agent", "WebintiCRM-Scorer/1.0")

    try:
        with urllib.request.urlopen(req, timeout=60, context=ctx) as response:
            data = json.loads(response.read().decode())
            return parse_pagespeed_response(data)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else ""
        if e.code == 429:
            return {"error": "RATE_LIMITED", "raw": error_body}
        return {"error": f"HTTP {e.code}: {error_body[:200]}"}
    except Exception as e:
        return {"error": str(e)[:200]}


def parse_pagespeed_response(data):
    result = data.get("lighthouseResult", {})
    categories = result.get("categories", {})
    audits = result.get("audits", {})

    scores = {}
    for key in ["performance", "accessibility", "best-practices", "seo"]:
        cat = categories.get(key, {})
        scores[key] = round(cat.get("score", 0) * 100) if cat.get("score") is not None else None

    # Issues détectées
    issues = []
    if scores.get("performance") is not None and scores["performance"] < 50:
        issues.append("Site très lent sur mobile")
    if scores.get("accessibility") is not None and scores["accessibility"] < 70:
        issues.append("Problèmes d'accessibilité")
    if scores.get("seo") is not None and scores["seo"] < 70:
        issues.append("Mal référencé sur Google")

    is_https = audits.get("is-on-https", {}).get("score") == 1
    is_mobile = audits.get("viewport", {}).get("score") == 1

    if not is_https:
        issues.append("Pas de HTTPS")
    if not is_mobile:
        issues.append("Pas optimisé mobile")

    # Score global pondéré
    valid_scores = {k: v for k, v in scores.items() if v is not None}
    weights = {"performance": 0.4, "accessibility": 0.2, "best-practices": 0.2, "seo": 0.2}
    if valid_scores:
        global_score = round(sum(valid_scores.get(k, 0) * weights.get(k, 0) for k in weights))
    else:
        global_score = None

    return {
        "score_performance": scores.get("performance"),
        "score_accessibility": scores.get("accessibility"),
        "score_best_practices": scores.get("best-practices"),
        "score_seo": scores.get("seo"),
        "score_global": global_score,
        "is_https": is_https,
        "is_mobile_friendly": is_mobile,
        "issues": issues,
        "raw_scores": scores,
        "error": None,
    }


def save_score(conn, lead_id, url, score_data):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO website_scores (id, url, score_performance, score_accessibility,
                score_best_practices, score_seo, score_global, is_https, is_mobile_friendly,
                issues, raw_scores, scored_at, error)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s)
            ON CONFLICT (id) DO UPDATE SET
                url = EXCLUDED.url,
                score_performance = EXCLUDED.score_performance,
                score_accessibility = EXCLUDED.score_accessibility,
                score_best_practices = EXCLUDED.score_best_practices,
                score_seo = EXCLUDED.score_seo,
                score_global = EXCLUDED.score_global,
                is_https = EXCLUDED.is_https,
                is_mobile_friendly = EXCLUDED.is_mobile_friendly,
                issues = EXCLUDED.issues,
                raw_scores = EXCLUDED.raw_scores,
                scored_at = NOW(),
                error = EXCLUDED.error
        """, (
            str(lead_id),
            url,
            score_data.get("score_performance"),
            score_data.get("score_accessibility"),
            score_data.get("score_best_practices"),
            score_data.get("score_seo"),
            score_data.get("score_global"),
            score_data.get("is_https"),
            score_data.get("is_mobile_friendly"),
            json.dumps(score_data.get("issues", [])),
            json.dumps(score_data.get("raw_scores", {})),
            score_data.get("error"),
        ))
    conn.commit()


# ─── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="PageSpeed Insights Scorer")
    parser.add_argument("--db", required=True, help="PostgreSQL connection string")
    parser.add_argument("--api-key", required=True, help="Google PageSpeed API key")
    parser.add_argument("--batch", type=int, default=200, help="Nombre d'URLs par batch (défaut: 200)")
    parser.add_argument("--delay", type=float, default=0.5, help="Délai entre requêtes en secondes (défaut: 0.5)")
    parser.add_argument("--rescore", action="store_true", help="Re-scorer les URLs déjà scorées")
    args = parser.parse_args()

    print(f"=== PageSpeed Scorer ===")
    print(f"Batch : {args.batch} URLs")
    print(f"Délai : {args.delay}s entre requêtes")
    print()

    conn = psycopg2.connect(args.db)
    create_table(conn)

    urls = get_urls_to_score(conn, args.batch, args.rescore)
    print(f"URLs à scorer : {len(urls)}")
    print()

    if not urls:
        print("Rien à scorer !")
        conn.close()
        return

    scored = 0
    errors = 0
    rate_limited = 0
    start_time = time.time()

    for i, row in enumerate(urls):
        lead_id = row["id"]
        raw_url = row["site_web"]
        url = normalize_url(raw_url)

        print(f"[{i+1}/{len(urls)}] {url}...", end=" ", flush=True)

        result = call_pagespeed(url, args.api_key)

        if result.get("error") == "RATE_LIMITED":
            rate_limited += 1
            print("⚠ RATE LIMITED — pause 30s")
            time.sleep(30)
            # Retry
            result = call_pagespeed(url, args.api_key)

        if result.get("error") and result["error"] != "RATE_LIMITED":
            errors += 1
            print(f"✗ {result['error'][:60]}")
        else:
            scored += 1
            g = result.get("score_global")
            print(f"✓ Global:{g} Perf:{result.get('score_performance')} SEO:{result.get('score_seo')}")

        save_score(conn, lead_id, url, result)

        # Rate limiting
        if i < len(urls) - 1:
            time.sleep(args.delay)

    elapsed = time.time() - start_time
    print()
    print(f"=== Terminé en {elapsed:.0f}s ===")
    print(f"  Scorés  : {scored}")
    print(f"  Erreurs : {errors}")
    print(f"  Rate-limited : {rate_limited}")

    # Résumé des scores
    with conn.cursor() as cur:
        cur.execute("""
            SELECT
                COUNT(*) as total,
                ROUND(AVG(score_global)) as avg_global,
                COUNT(*) FILTER (WHERE score_global < 50) as bad_sites,
                COUNT(*) FILTER (WHERE NOT is_https) as no_https
            FROM website_scores
            WHERE error IS NULL
        """)
        stats = cur.fetchone()
        print()
        print(f"  Total scorés     : {stats[0]}")
        print(f"  Score moyen      : {stats[1]}")
        print(f"  Sites < 50       : {stats[2]} (prospects prioritaires)")
        print(f"  Sans HTTPS       : {stats[3]}")

    conn.close()


if __name__ == "__main__":
    main()
