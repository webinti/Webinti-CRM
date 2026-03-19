#!/usr/bin/env node
/**
 * Script de prospection hybride
 * 1. Récupère les entreprises via API gouv
 * 2. Scrape Pappers pour trouver les sites web
 * 3. Analyse avec Lighthouse
 * 4. Crée les leads dans le CRM
 */

const puppeteer = require('puppeteer');

const API_GOUV_URL = 'https://recherche-entreprises.api.gouv.fr/search';
const CRM_API_URL = 'https://crm.webinti.com/api/leads';
const API_TOKEN = 'n8n-webinti-token-2024-secure';

// Départements à scraper (rotation)
const DEPARTEMENTS = ['75', '69', '33', '13', '31', '44', '34', '06', '59', '38'];

async function fetchEntreprisesGouv(departement, page = 1) {
  const url = `${API_GOUV_URL}?departement=${departement}&page=${page}&per_page=25&etat_administratif=A`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Erreur API gouv: ${error.message}`);
    return [];
  }
}

async function scrapePappers(browser, siren) {
  const page = await browser.newPage();
  
  try {
    // Va sur la fiche Pappers
    await page.goto(`https://www.pappers.fr/entreprise/${siren}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Attend que la page charge
    await page.waitForTimeout(2000);
    
    // Extrait le site web
    const siteWeb = await page.evaluate(() => {
      // Cherche le lien site web
      const link = document.querySelector('a[href^="http"][target="_blank"]');
      if (link) return link.href;
      
      // Cherche dans le texte
      const text = document.body.innerText;
      const match = text.match(/(https?:\/\/[^\s]+)/);
      return match ? match[1] : null;
    });
    
    // Extrait l'email
    const email = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
      return match ? match[1] : null;
    });
    
    // Extrait le téléphone
    const phone = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/(\+33\s?[0-9](\s?[0-9]{2}){4})/);
      return match ? match[1] : null;
    });
    
    return { siteWeb, email, phone };
    
  } catch (error) {
    console.error(`Erreur scraping Pappers ${siren}: ${error.message}`);
    return { siteWeb: null, email: null, phone: null };
  } finally {
    await page.close();
  }
}

async function analyzeSite(siteWeb) {
  if (!siteWeb) return { score: 0, issues: ['Pas de site web'] };
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(siteWeb)}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO&strategy=MOBILE`,
      { timeout: 45000 }
    );
    
    if (!response.ok) throw new Error('Lighthouse error');
    
    const data = await response.json();
    const categories = data.lighthouseResult.categories;
    const audits = data.lighthouseResult.audits;
    
    const scores = {
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      bestPractices: Math.round(categories['best-practices'].score * 100),
      seo: Math.round(categories.seo.score * 100)
    };
    
    const issues = [];
    if (scores.performance < 50) issues.push('Site lent sur mobile');
    if (scores.accessibility < 70) issues.push('Problèmes accessibilité');
    if (scores.seo < 70) issues.push('Mal référencé sur Google');
    if (!audits['uses-https']?.score) issues.push('Pas de HTTPS sécurisé');
    
    const globalScore = Math.round(
      scores.performance * 0.4 +
      scores.accessibility * 0.2 +
      scores.bestPractices * 0.2 +
      scores.seo * 0.2
    );
    
    return { score: globalScore, issues, scores };
    
  } catch (error) {
    console.error(`Erreur Lighthouse ${siteWeb}: ${error.message}`);
    return { score: 0, issues: ['Analyse impossible'] };
  }
}

async function createLead(entreprise, data, analysis) {
  const payload = {
    siren: entreprise.siren,
    siret: entreprise.siege?.siret,
    companyName: entreprise.nom_complet,
    legalForm: entreprise.nature_juridique,
    nafCode: entreprise.activite_principale,
    address: entreprise.siege?.adresse,
    postalCode: entreprise.siege?.code_postal,
    city: entreprise.siege?.libelle_commune,
    department: entreprise.siege?.departement,
    email: data.email,
    phone: data.phone,
    website: data.siteWeb,
    hasWebsite: !!data.siteWeb,
    websiteScore: analysis.score,
    websiteIssues: analysis.issues,
    source: 'hybrid_scraper',
    status: 'new',
    priority: analysis.score < 30 ? 80 : analysis.score < 60 ? 60 : 40
  };
  
  try {
    const response = await fetch(CRM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log(`✅ Lead créé: ${entreprise.nom_complet}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Erreur création lead ${entreprise.nom_complet}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Démarrage du scraper hybride...\n');
  
  // Département du jour (rotation)
  const today = new Date().getDate();
  const departement = DEPARTEMENTS[today % DEPARTEMENTS.length];
  console.log(`📍 Département du jour: ${departement}\n`);
  
  // Récupère les entreprises
  console.log('🔍 Récupération des entreprises via API gouv...');
  const entreprises = await fetchEntreprisesGouv(departement);
  console.log(`✅ ${entreprises.length} entreprises trouvées\n`);
  
  if (entreprises.length === 0) {
    console.log('❌ Aucune entreprise trouvée');
    process.exit(0);
  }
  
  // Lance le navigateur
  console.log('🌐 Lancement du navigateur...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  let created = 0;
  let errors = 0;
  
  // Traite chaque entreprise
  for (let i = 0; i < entreprises.length; i++) {
    const entreprise = entreprises[i];
    console.log(`\n[${i + 1}/${entreprises.length}] ${entreprise.nom_complet}`);
    
    try {
      // Scrape Pappers
      console.log('  🔎 Scraping Pappers...');
      const data = await scrapePappers(browser, entreprise.siren);
      console.log(`  💻 Site: ${data.siteWeb || 'Aucun'}`);
      
      // Analyse le site
      console.log('  📊 Analyse Lighthouse...');
      const analysis = await analyzeSite(data.siteWeb);
      console.log(`  ⭐ Score: ${analysis.score}/100`);
      
      // Crée le lead
      console.log('  💾 Création du lead...');
      const success = await createLead(entreprise, data, analysis);
      if (success) created++;
      
      // Attente entre chaque entreprise (rate limiting)
      if (i < entreprises.length - 1) {
        console.log('  ⏳ Attente 5s...');
        await new Promise(r => setTimeout(r, 5000));
      }
      
    } catch (error) {
      console.error(`  ❌ Erreur: ${error.message}`);
      errors++;
    }
  }
  
  // Ferme le navigateur
  await browser.close();
  
  console.log(`\n✅ Terminé!`);
  console.log(`📊 ${created} leads créés`);
  console.log(`❌ ${errors} erreurs`);
  
  process.exit(0);
}

// Lance le script
main().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});