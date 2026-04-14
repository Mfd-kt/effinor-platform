# ✅ Checklist de Tests - Système Panier & Commande

## 🎯 Objectif

Valider que le système de panier et de commande fonctionne correctement avant mise en production.

---

## 📋 Tests à Effectuer

### 🔍 Phase 1 : Tests Navigation & UI

#### 1.1 Header & Navigation
- [ ] Badge panier s'affiche dans le Header (icône panier)
- [ ] Badge panier affiche "0" quand panier vide
- [ ] Badge panier se met à jour après ajout produit (affiche le nombre d'items)
- [ ] Cliquer sur l'icône panier → redirige vers `/panier`
- [ ] Navigation principale fonctionne (Accueil, Boutique, À propos, Contact)
- [ ] Menu mobile fonctionne correctement

#### 1.2 Page Boutique (`/boutique`)
- [ ] Page charge sans erreur
- [ ] Liste des produits s'affiche
- [ ] Filtres catégories fonctionnent
- [ ] Filtres avancés (puissance, usage) fonctionnent
- [ ] Compteur de produits affiché correctement
- [ ] Cliquer sur un produit → redirige vers `/boutique/[slug]`

---

### 🛍️ Phase 2 : Tests Panier

#### 2.1 Ajout au Panier
- [ ] Sur une fiche produit, bouton "Ajouter au panier" visible
- [ ] Cliquer "Ajouter au panier" → Toast de confirmation s'affiche
- [ ] Toast affiche le message : "✅ Produit ajouté au panier !"
- [ ] Badge panier dans Header se met à jour immédiatement
- [ ] Recharger la page → produit toujours dans le panier (localStorage)

#### 2.2 Page Panier (`/panier`)

**Panier vide :**
- [ ] Message "Votre panier est vide" s'affiche
- [ ] Lien "Continuer vos achats" → redirige vers `/boutique`
- [ ] Pas de formulaire visible

**Panier avec produits :**
- [ ] Liste des produits affichée avec :
  - [ ] Image du produit
  - [ ] Nom du produit
  - [ ] Marque (si disponible)
  - [ ] Référence (si disponible)
  - [ ] Usage (industriel/tertiaire/agricole)
  - [ ] Prix unitaire (ou "Sur demande")
  - [ ] Quantité avec boutons +/-
  - [ ] Prix total par ligne
- [ ] Prix total HT affiché en bas (ou "Sur demande" si produits sur_devis)
- [ ] Bouton "Continuer mes achats" → redirige vers `/boutique`

#### 2.3 Modification du Panier
- [ ] Cliquer sur "+" → quantité augmente
- [ ] Cliquer sur "-" → quantité diminue (minimum 1)
- [ ] Quand quantité = 1, bouton "-" désactive ou supprime
- [ ] Prix total se met à jour en temps réel
- [ ] Cliquer sur icône poubelle → produit retiré du panier
- [ ] Après suppression, prix total recalculé
- [ ] Badge panier dans Header se met à jour

#### 2.4 Persistance Panier
- [ ] Ajouter des produits au panier
- [ ] Recharger la page → produits toujours présents
- [ ] Fermer et rouvrir le navigateur → produits toujours présents
- [ ] Vider le cache localStorage → panier vide (normal)

---

### 📝 Phase 3 : Tests Formulaire Devis

#### 3.1 Affichage Formulaire
- [ ] Formulaire visible seulement si panier non vide
- [ ] Tous les champs visibles :
  - [ ] Nom complet *
  - [ ] Email *
  - [ ] Téléphone *
  - [ ] Raison sociale
  - [ ] SIRET
  - [ ] Secteur d'activité (select)
  - [ ] Code postal
  - [ ] Ville
  - [ ] Type de bâtiment (select)
  - [ ] Message

#### 3.2 Validation Formulaire

**Champs obligatoires :**
- [ ] Soumettre sans nom → erreur "Le nom est requis."
- [ ] Soumettre sans email → erreur "L'email est requis."
- [ ] Soumettre sans téléphone → erreur "Le téléphone est requis."

**Validation format :**
- [ ] Email invalide (ex: "test") → erreur "Format d'email invalide."
- [ ] Email invalide (ex: "test@") → erreur "Format d'email invalide."
- [ ] Email valide (ex: "test@example.com") → pas d'erreur
- [ ] Téléphone invalide (ex: "123") → erreur "Format de téléphone invalide."
- [ ] Téléphone français valide (ex: "0612345678") → pas d'erreur
- [ ] Téléphone français valide avec espaces (ex: "06 12 34 56 78") → pas d'erreur

**Validation SIRET (optionnel) :**
- [ ] SIRET avec 13 chiffres → erreur "Le SIRET doit contenir 14 chiffres."
- [ ] SIRET avec 14 chiffres → pas d'erreur
- [ ] SIRET avec espaces → espaces supprimés automatiquement

**Validation code postal (optionnel) :**
- [ ] Code postal avec 4 chiffres → erreur "Le code postal doit contenir 5 chiffres."
- [ ] Code postal avec 5 chiffres → pas d'erreur

**Panier vide :**
- [ ] Soumettre avec panier vide → erreur "Ajoutez des produits avant de valider."

#### 3.3 Soumission Formulaire

**Succès :**
- [ ] Remplir formulaire valide avec panier non vide
- [ ] Cliquer "Demander un devis"
- [ ] Toast de succès s'affiche : "✅ Demande de devis envoyée !"
- [ ] État de chargement visible (bouton désactivé, loader)
- [ ] Après 1.5s, redirection vers `/merci`
- [ ] Panier vidé après soumission
- [ ] Formulaire réinitialisé après soumission

**Erreur réseau :**
- [ ] Simuler erreur réseau (désactiver réseau)
- [ ] Toast d'erreur s'affiche avec message
- [ ] Panier et formulaire conservés (pas de perte de données)

---

### 🎉 Phase 4 : Tests Page Confirmation

#### 4.1 Page Merci (`/merci`)

**Depuis panier (orderId) :**
- [ ] Redirection depuis panier fonctionne
- [ ] Message affiché : "Merci [Nom] !"
- [ ] Message : "Votre demande de devis a été envoyée avec succès"
- [ ] Référence de commande affichée (orderId)
- [ ] Boutons d'action visibles :
  - [ ] "Retour à l'accueil" → redirige vers `/`
  - [ ] "Voir la boutique" → redirige vers `/boutique`
- [ ] Section "Prochaines étapes" affichée
- [ ] Coordonnées de contact affichées

**Accès direct (sans state) :**
- [ ] Accéder directement à `/merci` → message "Page introuvable"
- [ ] Bouton "Retour à l'accueil" fonctionne

---

### 🗄️ Phase 5 : Tests Base de Données

#### 5.1 Vérification Supabase

**Table `commandes` :**
- [ ] Après soumission, nouvelle ligne créée dans `commandes`
- [ ] Tous les champs remplis correctement :
  - [ ] `nom_client` = nom du formulaire
  - [ ] `email` = email du formulaire
  - [ ] `telephone` = téléphone du formulaire
  - [ ] `societe` = raison sociale (ou null)
  - [ ] `numero_siret` = SIRET sans espaces (ou null)
  - [ ] `code_postal` = code postal (ou null)
  - [ ] `ville` = ville (ou null)
  - [ ] `type_batiment` = type bâtiment (ou null)
  - [ ] `secteur_activite` = secteur (ou null)
  - [ ] `commentaire` = message (ou null)
  - [ ] `produits` = JSON avec détails produits
  - [ ] `statut` = 'Nouveau Devis'
  - [ ] `source` = 'Panier / Demande de devis'
  - [ ] `created_at` = timestamp actuel

**Table `commandes_lignes` :**
- [ ] Lignes de commande créées pour chaque produit du panier
- [ ] Pour chaque ligne :
  - [ ] `commande_id` = ID de la commande
  - [ ] `produit_id` = ID du produit
  - [ ] `quantite` = quantité dans le panier
  - [ ] `prix_unitaire` = prix du produit (ou 0 si sur_devis)
  - [ ] `nom` = nom du produit

---

### 🔒 Phase 6 : Tests Sécurité

#### 6.1 Sanitization
- [ ] Tester avec caractères spéciaux dans le formulaire (<script>, &, etc.)
- [ ] Vérifier que les données sont sanitizées avant insertion
- [ ] Pas d'injection XSS possible

#### 6.2 Validation Côté Serveur
- [ ] Essayer d'insérer des données invalides directement en base
- [ ] RLS (Row Level Security) configurée correctement
- [ ] Seul le front public peut créer des commandes

---

### 📱 Phase 7 : Tests Responsive

#### 7.1 Mobile
- [ ] Page panier responsive sur mobile
- [ ] Formulaire lisible et utilisable sur mobile
- [ ] Boutons accessibles (taille minimale 44x44px)
- [ ] Toast notifications visibles sur mobile

#### 7.2 Tablet
- [ ] Layout adapté sur tablette
- [ ] Formulaire bien organisé

#### 7.3 Desktop
- [ ] Layout optimal sur desktop
- [ ] Formulaire bien espacé

---

### ⚡ Phase 8 : Tests Performance

#### 8.1 Chargement
- [ ] Page panier charge rapidement (< 2s)
- [ ] Pas de lag lors de l'ajout au panier
- [ ] Prix total calculé instantanément

#### 8.2 Persistance
- [ ] localStorage ne ralentit pas l'application
- [ ] Pas de freeze lors de la sauvegarde panier

---

## 🐛 Scénarios de Bugs à Tester

### Bug Potentiel 1 : Panier Vide Après Soumission
**Test :**
- [ ] Soumettre une commande
- [ ] Vérifier que le panier est bien vidé
- [ ] Vérifier que localStorage est bien vidé

### Bug Potentiel 2 : Produit Sur Devis
**Test :**
- [ ] Ajouter un produit avec `sur_devis: true`
- [ ] Vérifier que le prix affiché est "Sur demande"
- [ ] Vérifier que le prix total ignore ce produit

### Bug Potentiel 3 : Doublon dans Panier
**Test :**
- [ ] Ajouter le même produit deux fois
- [ ] Vérifier que la quantité augmente (pas de doublon)
- [ ] Vérifier que le prix total est correct

### Bug Potentiel 4 : Quantité Zéro ou Négative
**Test :**
- [ ] Essayer de mettre quantité à 0
- [ ] Essayer de mettre quantité négative
- [ ] Vérifier que la quantité minimum est 1

### Bug Potentiel 5 : Produit Supprimé de la Base
**Test :**
- [ ] Ajouter un produit au panier
- [ ] Supprimer le produit de la base de données
- [ ] Vérifier que le panier gère correctement l'erreur

---

## ✅ Checklist Finale

### Code
- [ ] Pas de console.log dans le code (utiliser logger)
- [ ] Pas d'erreurs ESLint
- [ ] Build fonctionne (`npm run build`)
- [ ] Pas d'erreurs TypeScript (si applicable)

### Documentation
- [ ] Documentation à jour (`CART_ORDER_FLOW.md`)
- [ ] Code commenté si nécessaire
- [ ] README mis à jour (si nécessaire)

### Base de Données
- [ ] Tables `commandes` et `commandes_lignes` existent
- [ ] RLS configurée correctement
- [ ] Index créés (si nécessaire)

### Production
- [ ] Variables d'environnement configurées
- [ ] Webhook N8N configuré (si souhaité)
- [ ] Tests manuels effectués
- [ ] Validation client satisfaite

---

## 📊 Résultats Attendus

### Taux de Réussite Minimum
- **Tests Navigation** : 100% ✅
- **Tests Panier** : 100% ✅
- **Tests Formulaire** : 100% ✅
- **Tests Base de Données** : 100% ✅
- **Tests Sécurité** : 100% ✅
- **Tests Responsive** : 100% ✅

### Critères de Validation
- ✅ Aucun bug bloquant
- ✅ UX fluide et intuitive
- ✅ Données correctement enregistrées
- ✅ Validation côté client fonctionnelle
- ✅ Sécurité assurée (sanitization, RLS)

---

## 🚀 Après Validation

Une fois tous les tests validés :
1. ✅ Signer la checklist
2. ✅ Documenter les bugs trouvés (si any)
3. ✅ Préparer le déploiement
4. ✅ Configurer le monitoring en production

---

**Date de test** : ___________  
**Testé par** : ___________  
**Statut** : ⬜ À tester | ⬜ En cours | ⬜ Validé | ⬜ Bloqué

---

**Notes** :
- Utiliser ce document pour tracker les tests
- Cocher chaque case au fur et à mesure
- Noter les bugs dans la section "Notes" ci-dessus



























