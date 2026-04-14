# 🤝 Guide de Contribution - ECPS

Merci de contribuer au projet ECPS ! Ce document explique comment collaborer efficacement sur ce projet.

## 📋 Avant de Commencer

### Prérequis Techniques
- Node.js >= 18.x installé
- Git configuré avec votre identité
- Accès au repository GitHub
- Compte Supabase (pour accès à la base de données de dev)
- Cursor IDE installé (recommandé)

### Accès aux Ressources
- **GitHub Repository** : `https://github.com/ecps/effinor`
- **Supabase Dev** : Demander les credentials à Moufdi
- **Slack Channel** : #dev-ecps
- **Figma** : [Lien vers les designs si applicable]

## 🔄 Workflow de Développement

### 1. Setup Initial

```bash
# Cloner le repo
git clone https://github.com/ecps/effinor.git
cd effinor

# Installer les dépendances
npm install

# Copier et configurer .env
cp .env.example .env
# Éditer .env avec les bonnes credentials

# Lancer le projet
npm run dev
```

### 2. Créer une Nouvelle Feature

```bash
# Toujours partir de main à jour
git checkout main
git pull origin main

# Créer une branche pour votre feature
git checkout -b feature/nom-descriptif

# Exemples de noms de branches :
# feature/facebook-pixel-tracking
# feature/n8n-webhook-integration
# fix/form-validation-bug
# docs/update-readme
```

### 3. Développer

- **Commiter régulièrement** avec des messages clairs
- **Tester localement** avant de pusher
- **Respecter les conventions** de code du projet

```bash
# Commiter vos changements
git add .
git commit -m "feat: ajout du tracking pixel Facebook"

# Pusher votre branche
git push origin feature/nom-descriptif
```

### 4. Pull Request

1. **Aller sur GitHub** et créer une Pull Request
2. **Remplir le template** PR avec :
   - Description de ce qui a été fait
   - Screenshots si UI change
   - Tests effectués
   - Breaking changes si applicable
3. **Assigner un reviewer** (Moufdi ou autre dev)
4. **Attendre la review** avant de merger

## 📝 Conventions de Code

### Commits Messages

Suivre le format **Conventional Commits** :

```
<type>(<scope>): <description courte>

[corps optionnel]

[footer optionnel]
```

**Types** :
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation uniquement
- `style:` - Formatage, point-virgules manquants, etc
- `refactor:` - Refactoring (ni feature ni fix)
- `perf:` - Amélioration de performance
- `test:` - Ajout de tests
- `chore:` - Maintenance, dépendances, config

**Exemples** :
```bash
feat(forms): ajout validation SIRET française
fix(admin): correction affichage leads dashboard
docs(readme): ajout section déploiement
style(components): formatage avec Prettier
refactor(utils): simplification logique calcul CEE
```

### Code Style

#### JavaScript/React
```javascript
// ✅ BON - Composants en PascalCase
function MiniEstimationForm() { }

// ✅ BON - Fonctions/variables en camelCase
const calculateCEEPotential = () => { }
const formData = {}

// ✅ BON - Constantes en UPPER_SNAKE_CASE
const TOTAL_STEPS = 6
const API_BASE_URL = 'https://...'

// ❌ MAUVAIS
function mini_estimation_form() { }
const Calculate_CEE_Potential = () => { }
```

#### Structure des Composants React
```javascript
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from 'lucide-react'

// 1. Composant principal
const MyComponent = ({ prop1, prop2 }) => {
  // 2. Hooks
  const navigate = useNavigate()
  const [state, setState] = useState('')

  // 3. Effets
  useEffect(() => {
    // ...
  }, [])

  // 4. Fonctions handlers
  const handleSubmit = () => {
    // ...
  }

  // 5. Rendu
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

export default MyComponent
```

#### Tailwind CSS
```jsx
// ✅ BON - Classes groupées logiquement
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

// ❌ MAUVAIS - Classes désorganisées
<div className="p-4 flex shadow-md bg-white rounded-lg items-center justify-between">
```

## 🧪 Tests

### Avant de Soumettre une PR

**Checklist** :
- [ ] Le code compile sans erreur (`npm run build`)
- [ ] Aucune erreur ESLint
- [ ] Testé manuellement sur Chrome/Firefox/Safari
- [ ] Testé responsive (mobile/tablet/desktop)
- [ ] Formulaires testés avec données valides/invalides
- [ ] Vérifier que Supabase reçoit bien les données
- [ ] Pas de `console.log()` oubliés

### Tests Manuels Critiques

Pour chaque feature impactant les formulaires :

1. **Mini-formulaire (Homepage)**
   - Remplir avec données valides → doit créer lead dans Supabase
   - Tester validation téléphone français
   - Vérifier redirection vers formulaire complet

2. **Formulaire CEE Complet**
   - Tester navigation entre les 6 étapes
   - Vérifier pré-remplissage des données
   - Tester calcul CEE avec différents scénarios
   - Vérifier mise à jour du lead dans Supabase

3. **Admin Dashboard**
   - Vérifier affichage des nouveaux leads
   - Tester filtres et recherche
   - Vérifier modification de statuts

## 🐛 Rapporter un Bug

### Template Issue GitHub

```markdown
## 🐛 Description du Bug
[Description claire et concise]

## 📋 Étapes pour Reproduire
1. Aller sur '...'
2. Cliquer sur '...'
3. Voir l'erreur

## ✅ Comportement Attendu
[Ce qui devrait se passer]

## ❌ Comportement Actuel
[Ce qui se passe réellement]

## 📸 Screenshots
[Si applicable]

## 🖥️ Environnement
- OS: [ex: macOS 14.0]
- Browser: [ex: Chrome 120]
- Version Node: [ex: 18.17.0]

## 📝 Contexte Additionnel
[Toute autre information utile]
```

## 🚀 Demander une Nouvelle Feature

### Template Feature Request

```markdown
## 🎯 Problème à Résoudre
[Quel problème cette feature résout-elle?]

## 💡 Solution Proposée
[Description de la feature souhaitée]

## 🔄 Alternatives Considérées
[Autres approches possibles]

## 📊 Impact Business
[Comment ça aide ECPS à atteindre ses objectifs?]

## 📝 Notes Additionnelles
[Mockups, références, etc.]
```

## 🔒 Sécurité

### ⚠️ À NE JAMAIS FAIRE

- ❌ **Commiter des secrets** (.env, API keys, passwords)
- ❌ **Pousser des credentials** Supabase dans le code
- ❌ **Exposer des données clients** dans les logs
- ❌ **Désactiver la validation** côté serveur

### ✅ Bonnes Pratiques

- ✅ Utiliser `.env` pour toutes les variables sensibles
- ✅ Valider TOUS les inputs côté client ET serveur
- ✅ Utiliser Supabase RLS (Row Level Security)
- ✅ Sanitizer les données avant insertion DB

## 📞 Communication

### Channels Slack

- **#dev-ecps** : Discussion technique générale
- **#dev-reviews** : Reviews de code, PRs
- **#dev-bugs** : Rapports de bugs urgents
- **#general-ecps** : Annonces générales

### Meetings

- **Daily Standup** : Lundi-Vendredi 9h30 (optionnel remote)
- **Sprint Planning** : Tous les lundis 10h
- **Demo** : Tous les vendredis 16h
- **Retro** : Tous les vendredis 17h

### Response Time Attendu

- **Bug critique** (prod down) : < 1h
- **Bug important** : < 4h
- **Feature request** : Discussion dans les 24h
- **PR review** : < 24h (jours ouvrés)

## 🎓 Ressources Utiles

### Documentation Technique
- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Outils Internes
- **Supabase Dashboard** : [Lien]
- **N8N Workflows** : [Lien]
- **Analytics** : [Lien]
- **Figma Designs** : [Lien]

## ❓ Questions Fréquentes

### Comment accéder à la base de données de dev?
→ Demander les credentials Supabase à Moufdi sur Slack

### Puis-je travailler directement sur `main`?
→ Non, toujours créer une branche feature

### Combien de temps avant qu'une PR soit reviewée?
→ Généralement < 24h jours ouvrés

### Que faire si mon build échoue?
→ Vérifier les erreurs ESLint, tester localement avec `npm run build`

### Comment tester avec de vraies données?
→ Utiliser l'environnement de dev Supabase, ne JAMAIS toucher à prod

---

## 🙏 Merci de Contribuer!

Chaque contribution, grande ou petite, aide ECPS à atteindre son objectif de 1M€/mois. 

**Restons en contact** :
- Slack: #dev-ecps
- Email: dev@ecps.fr

**Happy Coding!** 🚀
