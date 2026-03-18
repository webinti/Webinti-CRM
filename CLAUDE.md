# Webinti CRM — Brief projet

CRM de facturation interne pour Tim / Webinti (auto-entrepreneur freelance).
Remplacement de Sellsy. Usage mono-utilisateur, admin uniquement, **tout en français**.

---

## Stack

| Couche | Technologie |
|---|---|
| Framework | Next.js 15 — App Router, TypeScript strict |
| Base de données | Neon PostgreSQL (pool: `ep-muddy-king-althnjh3-pooler.c-3.eu-central-1.aws.neon.tech`) |
| ORM | Drizzle ORM |
| Auth | Better-Auth (email/password) |
| CSS | Tailwind CSS v4 + inline `style={}` pour les couleurs |
| Animations | Framer Motion |
| Toasts | Sonner |
| Paiements | Stripe (à venir) |
| Emails | Resend (à venir) |
| PDF | React-PDF (à venir) |

**Répertoire :** `/Users/Tim/Documents/Claude/Webinti CRM/webinti-crm/`

---

## Architecture

- **Server components** par défaut pour les pages de détail (data fetching via Drizzle)
- **Client components** pour les listes avec état, formulaires, dialogs — `'use client'` en tête de fichier
- **Pattern page + actions** : `page.tsx` (server) + `[module]-actions.tsx` (client) pour les pages de détail avec CRUD
- Routes API dans `src/app/api/` — auth vérifiée sur chaque route avec `auth.api.getSession({ headers: await headers() })`

---

## Design system

### Couleurs — palette Webinti dark navy

```
Backgrounds:
  #0d0d14   bg-base        (body, inputs)
  #13131e   bg-surface     (cards, panels)
  #1a1a28   bg-overlay     (hover states, contact cards)
  #232336   bg-muted

Borders:
  #252538   border-default
  #33334e   border-strong  (hover)

Textes:
  #f0f0ff   text-primary
  #9898b8   text-secondary
  #5e5e7a   text-muted

Accents:
  #7ee5aa   brand green — TOUTES les icônes, dots actifs, focus inputs
  #6366f1   accent indigo — liens, CTA
  #818cf8   accent light  — hover liens
```

> Ne jamais utiliser des gris neutres (`#1c1c1c`, `#2a2a2a`, etc.). Toujours dark navy.

### Règle Tailwind v4

**Éviter** les classes avec modificateur d'opacité Tailwind : `border-white/07`, `bg-white/05`, etc.
**Utiliser** des inline styles avec `rgba()` ou hex explicites :
```tsx
// MAUVAIS
<div className="border border-white/07 bg-[#161727]">

// BON
<div style={{ border: '1px solid #252538', background: '#13131e' }}>
```

### Composants UI disponibles (`src/components/ui/`)

| Composant | Usage |
|---|---|
| `Button` | `variant="primary"` (gradient) / `"secondary"` / `"ghost"`, prop `loading` |
| `Input` | `label`, `type`, tous inline styles, focus vert `#7ee5aa` |
| `Textarea` | Même pattern que `Input` |
| `Card` / `CardContent` / `CardHeader` / `CardTitle` | Containers navy `#13131e` |
| `Badge` | `variant="primary/muted/default"` ou `status={q.status}` pour couleurs auto |
| `Avatar` | `name="..."` génère initiales colorées, `size="sm/md/lg"` |
| `Dialog` / `DialogContent` / `DialogClose` | Modals — prop `title` obligatoire |
| `Table` / `TableHeader` / `TableBody` / `TableRow` / `TableHead` / `TableCell` / `TableEmpty` | Tables stylisées |
| `DropdownMenu` + items | Menu contextuel (3 points) |
| `Select` + items | Sélecteur stylisé |
| `AddressAutocomplete` | Autocomplétion via api-adresse.data.gouv.fr (France, gratuit, sans clé) |

### Icônes

Toutes les icônes Lucide avec `style={{ color: '#7ee5aa' }}` dans les `CardTitle` et sections.
Taille standard : `size={14}` dans les headers de cards, `size={15}` dans les tables.

### Navigation progress bar

`next-nprogress-bar` installé dans `src/app/layout.tsx`, couleur `#7ee5aa`, **toujours enveloppé dans `<Suspense>`**.

---

## Modules

### Construits

| Module | Routes | API |
|---|---|---|
| Dashboard | `/dashboard` | `/api/dashboard` |
| Sociétés | `/societes`, `/societes/[id]` | `/api/societes`, `/api/societes/[id]`, `/api/societes/[id]/adresses` |
| Contacts | `/contacts`, `/contacts/[id]` | `/api/contacts`, `/api/contacts/[id]` |
| Devis | `/devis`, `/devis/[id]`, `/devis/nouveau` | `/api/devis`, `/api/devis/[id]` |
| Factures | `/factures`, `/factures/[id]`, `/factures/nouvelle` | `/api/factures`, `/api/factures/[id]` |
| Acomptes | `/acomptes`, `/acomptes/nouveau` | `/api/acomptes`, `/api/acomptes/[id]` |
| Paramètres | `/parametres` | `/api/settings` |
| Auth | `/login` | Better-Auth + `/api/auth` |

### À implémenter

- [ ] Génération PDF devis/factures (React-PDF)
- [ ] Pages modifier devis `/devis/[id]/modifier` et facture `/factures/[id]/modifier`
- [ ] Envoi email devis/facture (Resend)
- [ ] Stripe payment link sur factures
- [ ] Signature électronique devis
- [ ] Format Factur-X (XML dans PDF/A-3)
- [ ] Import clients depuis Bubble
- [ ] Déploiement VPS → crm.webinti.com

---

## Règles métier

- **Pas de TVA** — auto-entrepreneur. Mention légale : *"TVA non applicable, art. 293 B du CGI"*
- **Numérotation** : `DEV-ANNÉE-NNNN` / `FAC-ANNÉE-NNNN` / `ACP-ANNÉE-NNNN` — incrémental, non modifiable
- **Acompte** : 30% par défaut, document séparé (pas une ligne de facture)
- **Devises** : EUR et USD
- **Téléphones** : format international, placeholder `+33 6 12 34 56 78`, `type="tel"`
- **Adresses** : autocomplétion via `AddressAutocomplete` (api-adresse.data.gouv.fr), lien Google Maps en affichage

---

## Ton et conventions de code

- **Langue** : tout en français dans l'UI, les labels, les messages d'erreur
- **Inline styles** plutôt que classes Tailwind pour les couleurs (règle Tailwind v4)
- **Pas de commentaires** sauf si la logique n'est pas évidente
- **Pas de over-engineering** : pas de helpers pour du one-shot, pas d'abstractions prématurées
- Réponses courtes et directes, pas de récapitulatif en fin de message
