# Essais en local

Pour tester la landing et les formulaires (envoi vers Airtable) en local :

## 1. Configurer l’API (une seule fois)

Dans le dossier `public/api/` :

- Copier `.env.example` en `.env`
- Renseigner dans `.env` :
  - `AIRTABLE_TOKEN` (token Airtable)
  - `AIRTABLE_BASE_ID`
  - `AIRTABLE_TABLE_ID`
  - `BACKUP_EMAIL` (optionnel)

## 2. Lancer les deux serveurs

Ouvre deux terminaux et **place-toi dans le dossier du projet** avant de lancer les commandes :

```bash
cd "/Users/mfd/Documents/Project_effinor_2026/mes landings/Landing_destratificateur"
```

**Terminal 1 — API PHP (port 8080) :**

```bash
npm run dev:api
```

**Terminal 2 — Front (Vite, port 3000) :** (même dossier)

```bash
npm run dev
```

## 3. Tester

- Ouvrir **http://localhost:3000** dans le navigateur.
- Les appels à `/api/lead.php` sont automatiquement redirigés vers le serveur PHP (proxy Vite).
- Les leads partent vers Airtable si le `.env` est correct.

---

## Design — Section rhythm (Trust-First)

- **Tokens** (Tailwind) : `bg-section-page` (#FFFFFF), `bg-section-soft` (#F6F8FB), `bg-section-panel` (#EEF2F6), `bg-section-hero` (gradient). Cartes : `shadow-section-card`, `shadow-section-card-hover`.
- **Composant** : `<Section variant="page|soft|panel|hero" id="…" tight />` — voir `src/components/layout/Section.jsx`.
- **Alternance** : Hero → TrustBar (page) → CeeExplication (panel) → CasClients (page) → Credibilite (soft) → Transparence (page) → EligibilityForm (soft) → Faq (page) → FinalCta (panel) → EnergySimulator (soft). Pas de 4 fonds identiques d'affilée.
- **Checklist** : contraste OK, cartes avec bordure + ombre, CTA orange unique, rythme alterné.

Sans `npm run dev:api`, le front tourne mais l’envoi du formulaire échouera (erreur réseau / 502).
