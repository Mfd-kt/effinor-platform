# 🏢 ECPS (Effinor) - Plateforme de Génération de Leads CEE

Plateforme web complète pour la génération et gestion de leads pour les projets d'efficacité énergétique avec financement CEE (Certificats d'Économies d'Énergie).

## Description

Plateforme de génération de leads pour solutions d'efficacité énergétique avec financement CEE. Système complet incluant formulaires multi-étapes, calcul automatique de primes CEE, dashboard admin, et gestion de catalogue produits.

## 📋 Table des Matières

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Structure du Projet](#structure-du-projet)
- [Développement](#développement)
- [Déploiement](#déploiement)
- [Contribution](#contribution)

## 🎯 Aperçu

ECPS est une solution complète permettant de :
- Générer des leads qualifiés via des formulaires optimisés
- Calculer automatiquement le potentiel de primes CEE
- Gérer les leads via un back-office complet
- Tracker les conversions et performances marketing

### Métriques Clés
- ✅ Taux de conversion : 50%
- 💰 Panier moyen : 7,000€
- 📊 CA mensuel actuel : 140,000€
- 🎯 Objectif : 1,000,000€/mois

## ⚡ Fonctionnalités

### Front-end Public
- **Page d'accueil** avec mini-formulaire de qualification
- **Formulaire CEE complet** en 6 étapes progressives
- **Calcul automatique** du potentiel de primes CEE
- **Design responsive** optimisé mobile-first
- **SEO optimisé** avec React Helmet

### Back-office Admin
- Dashboard avec statistiques en temps réel
- Gestion complète des leads (statuts, priorités, notes)
- Suivi des conversions par source
- Gestion des produits et utilisateurs
- Export des données

### Intégrations (À venir)
- [ ] Webhooks N8N pour automatisation
- [ ] Pixels de tracking (Facebook, Google, TikTok)
- [ ] Notifications Slack temps réel
- [ ] Synchronisation Airtable
- [ ] Backup email automatique

## 🛠️ Tech Stack

### Frontend
- **React 18** - Framework UI moderne
- **Vite** - Build tool ultra-rapide
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL - Base de données relationnelle
  - Supabase Auth - Authentification
  - Supabase Storage - Stockage de fichiers

### Architecture
- **Frontend**: React SPA (Single Page Application)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Auth**: Supabase Auth avec Row Level Security (RLS)
- **Storage**: Supabase Storage pour images produits

### Dev Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📦 Installation

### Prérequis
- Node.js >= 18.x
- npm ou yarn
- Compte Supabase

### Steps

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/ecps-effinor.git
cd ecps-effinor
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Éditer `.env` avec vos credentials Supabase et Sirene :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon

# API Sirene INSEE (optionnel - pour auto-remplissage des données société)
# Service gratuit et officiel (INSEE) : https://www.data.gouv.fr/dataservices/api-sirene-open-data
# Documentation technique : https://www.sirene.fr/static-resources/documentation/sommaire_311.html
# Documentation OpenAPI : https://api-apimanager.insee.fr/portal/environments/DEFAULT/apis/2ba0e549-5587-3ef1-9082-99cd865de66f/pages/6548510e-c3e1-3099-be96-6edf02870699/content
# Note: Les appels sont faits via une fonction SQL (pas directement depuis le frontend)
# Pour configurer la clé API :
#   1. Créez un compte sur https://portail-api.insee.fr/
#   2. Souscrivez à l'API Sirene dans le catalogue (bouton "SOUSCRIRE")
#   3. Générez une clé d'intégration (API Key) dans votre espace
#   4. Configurez la clé comme secret Supabase : app.sirene_api_key (pas de variable d'environnement frontend nécessaire)
#   5. Limite : 30 requêtes par minute (usage open data gratuit)
# La variable VITE_SIRENE_API_TOKEN ci-dessous n'est plus utilisée (gérée côté serveur)
VITE_SIRENE_API_TOKEN=votre_cle_api_sirene
```

4. **Lancer le serveur de développement**
```bash
npm run dev
# ou
yarn dev
```

Le site sera accessible sur `http://localhost:3000`

## ⚙️ Configuration

### Supabase Setup

1. **Créer un projet Supabase** sur https://supabase.com

2. **Créer les tables nécessaires** :

```sql
-- Table leads
CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nom TEXT,
  telephone TEXT,
  email TEXT,
  societe TEXT,
  siret TEXT,
  adresse TEXT,
  type_batiment TEXT,
  surface_m2 NUMERIC,
  consommation_annuelle NUMERIC,
  montant_cee_estime NUMERIC,
  statut TEXT DEFAULT 'nouveau',
  priorite TEXT DEFAULT 'normale',
  source TEXT,
  products JSONB,
  message TEXT,
  notes_techniques TEXT,
  formulaire_complet BOOLEAN DEFAULT false,
  etape_formulaire TEXT
);

-- Index pour performance
CREATE INDEX idx_leads_statut ON leads(statut);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_source ON leads(source);
```

3. **Configurer RLS (Row Level Security)** selon vos besoins

### Structure des Leads

Un lead contient :
- **Informations de contact** : nom, téléphone, email
- **Informations entreprise** : société, SIRET, adresse
- **Détails du projet** : type de bâtiment, surface, consommation
- **Estimation CEE** : montant estimé de primes
- **Workflow** : statut, priorité, source, étape du formulaire

## 📁 Structure du Projet

```
ecps-effinor/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── admin/          # Composants admin
│   │   ├── cee/            # Composants formulaire CEE
│   │   ├── modals/         # Modales
│   │   ├── popups/         # Popups marketing
│   │   └── ui/             # Composants UI (Radix)
│   ├── contexts/           # Context API (Auth, Cart, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Configurations (Supabase, utils)
│   ├── pages/              # Pages de l'application
│   │   ├── admin/          # Pages admin
│   │   ├── Home.jsx        # Page d'accueil
│   │   ├── CEEEligibilityForm.jsx  # Formulaire complet
│   │   └── ...
│   ├── styles/             # Styles globaux
│   ├── utils/              # Fonctions utilitaires
│   ├── App.jsx             # Composant racine
│   └── main.jsx            # Point d'entrée
├── public/                 # Assets statiques
├── plugins/                # Plugins Vite custom
├── .env.example            # Template variables d'environnement
├── .gitignore
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🚀 Développement

### Scripts disponibles

```bash
# Développement
npm run dev          # Démarre le serveur de dev sur le port 3000

# Production
npm run build        # Build l'application pour production
npm run preview      # Preview du build de production
```

### Conventions de Code

- **Composants** : PascalCase (ex: `MiniEstimationForm.jsx`)
- **Fonctions utilitaires** : camelCase (ex: `validateEmail()`)
- **Constantes** : UPPER_SNAKE_CASE (ex: `TOTAL_STEPS`)
- **CSS Classes** : kebab-case ou Tailwind utilities

### Workflow Git

```bash
# Créer une branche pour une nouvelle feature
git checkout -b feature/nom-de-la-feature

# Commiter avec des messages clairs
git commit -m "feat: ajout tracking pixels Facebook"

# Pusher et créer une Pull Request
git push origin feature/nom-de-la-feature
```

### Conventions de Commit

- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage, CSS
- `refactor:` - Refactoring code
- `test:` - Ajout de tests
- `chore:` - Maintenance, dépendances

## 📊 Formulaires

### Mini Formulaire (Page d'accueil)
Champs : Nom, Téléphone, Type de bâtiment, Surface, Email
- Validation française du téléphone
- Enregistrement dans `leads` avec `source: 'hero_formulaire_accueil'`
- Redirection vers formulaire complet

### Formulaire CEE Complet (6 étapes)
1. **Infos entreprise** : Nom société, SIRET, Adresse
2. **Contact principal** : Prénom, Nom, Poste, Contact
3. **Dépenses énergétiques** : Consommation annuelle
4. **Nombre de bâtiments** : 1 à 10+
5. **Détails bâtiments** : Type, surface, hauteur, chauffage (pour chaque bâtiment)
6. **Remarques** : Commentaires + Affichage estimation CEE

**Calcul CEE** : Basé sur surface, type de bâtiment, consommation → LED + Chauffage

## 🌐 Déploiement

### Avec Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

### Variables d'environnement Production
Configurer sur votre plateforme de déploiement :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🤝 Contribution

### Membres de l'équipe
- **Moufdi** - Director General / Product Owner
- **Aimen** - Ads Manager (Facebook/Instagram/TikTok)
- **[Ton Nom]** - Developer

### Process de contribution

1. **Fork** le projet
2. Créer une **branche feature** (`git checkout -b feature/AmazingFeature`)
3. **Commit** les changements (`git commit -m 'feat: Add AmazingFeature'`)
4. **Push** sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une **Pull Request**

### Code Review
- Toutes les PR doivent être reviewées avant merge
- Tests automatiques doivent passer
- Documentation mise à jour si nécessaire

## 🔒 Security Features

- **Data Sanitization**: Protection XSS avec `sanitizeFormData()` avant tous les INSERT/UPDATE
- **Row Level Security (RLS)**: Politiques de sécurité au niveau base de données
- **Environment Variables**: Credentials stockés dans `.env` (jamais commitées)
- **Conditional Logging**: Logs uniquement en développement (sauf erreurs)
- **Input Validation**: Validation côté client et serveur
- **Unified Supabase Client**: Un seul client Supabase pour cohérence

## 📊 Database Schema

### Tables Principales

- **leads**: Données des prospects/leads
  - Informations contact, entreprise, projet
  - Estimation CEE, statut, priorité
  - Workflow et historique

- **products**: Catalogue produits
  - Informations produits, prix, images
  - Catégories, statut actif/inactif
  - Ordre d'affichage

- **commandes**: Commandes clients
  - Informations client, statut
  - Date création, total

- **commandes_lignes**: Lignes de commande
  - Produits commandés, quantités, prix

- **visiteurs**: Tracking des visiteurs
  - IP, page actuelle, referer
  - Statut (active/left), temps session

- **utilisateurs / profiles**: Gestion utilisateurs
  - Authentification, rôles
  - Profils admin

- **leads_notes**: Notes sur les leads
  - Timeline, historique
  - Notes utilisateurs

Voir `DATABASE_ANALYSIS_REPORT.md` pour le schéma complet.

## 📈 Recent Improvements

### Phase 1: Security (✅ Completed)
- Unification des clients Supabase
- Ajout sanitization des données (XSS protection)
- Correction DELETE en cascade avec vérification d'erreur

### Phase 2: Performance (✅ Completed)
- Pagination sur toutes les pages admin
- Optimisation des requêtes (select spécifiques)
- Création des lignes de commande dans `commandes_lignes`
- Standardisation des messages d'erreur

### Phase 3: Polish (✅ Completed)
- Filtres côté serveur pour AdminProducts
- Messages d'erreur améliorés et actionnables
- Documentation complète (indexes, RLS, README)

## 📚 Documentation

- **CODE_ANALYSIS.md**: Rapport d'audit du code complet
- **DATABASE_ANALYSIS_REPORT.md**: Analyse détaillée de l'intégration base de données
- **DATABASE_FIXES_PLAN.md**: Plan d'implémentation des corrections
- **DATABASE_INDEXES.md**: Index recommandés pour performance
- **SUPABASE_RLS_GUIDE.md**: Guide de configuration Row Level Security

## 📝 TODO / Roadmap

### Court terme (Sprint actuel)
- [ ] Intégration webhooks N8N
- [ ] Pixels de tracking Facebook/Google
- [ ] Notifications Slack automatiques
- [ ] Backup email des leads

### Moyen terme
- [ ] Dashboard analytics avancé
- [ ] A/B Testing sur formulaires
- [ ] Intégration VSL (Video Sales Letter)
- [ ] Automatisation devis PDF

### Long terme
- [ ] Mobile app (React Native)
- [ ] IA pour qualification automatique des leads
- [ ] CRM intégré complet
- [ ] API publique pour partenaires

## 📞 Support

Pour toute question :
- **Email** : contact@ecps.fr
- **Slack** : #dev-ecps
- **GitHub Issues** : [Issues Page](https://github.com/votre-username/ecps-effinor/issues)

## 📄 License

Propriétaire - ECPS (Groupe Effinor)
Tous droits réservés © 2024

---

**Développé avec ❤️ pour révolutionner l'efficacité énergétique en France** 🇫🇷
# Déploiement automatique configuré ✅
