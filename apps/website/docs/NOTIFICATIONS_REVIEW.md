# Revue du Système de Notifications - État Actuel

**Date :** 2025-12-01  
**Objectif :** Cartographier l'existant avant refactoring complet

## 📋 Fichiers liés aux notifications

### Migrations SQL
- `migrations/20251201_create_notifications_system.sql` - Migration initiale (à refactoriser)
- `migrations/20251201_add_last_notifications_seen_at.sql` - Champ `last_notifications_seen_at` dans `utilisateurs` (OK, à garder)

### Code Frontend
- `src/services/notifications.js` - Service API (à adapter au nouveau schéma)
- `src/contexts/NotificationsContext.jsx` - Context global (à adapter pour filtrer par utilisateur/rôle)
- `src/components/admin/AdminHeader.jsx` - Badge + dropdown notifications (à adapter)
- `src/pages/admin/NotificationsPage.jsx` - Page complète (à adapter)

### Code Backend
- Aucune Edge Function spécifique aux notifications
- Triggers PostgreSQL dans la migration

---

## 🗄️ Schéma actuel de la table `notifications`

### Colonnes existantes (d'après `20251201_create_notifications_system.sql`)
```sql
- id                  UUID PRIMARY KEY
- type                TEXT ('lead', 'commande', 'system')
- entity_id           UUID (nullable) - ID du lead ou commande
- title               TEXT NOT NULL
- message              TEXT (nullable)
- status               TEXT ('unread', 'read')
- created_at           TIMESTAMPTZ
- read_at              TIMESTAMPTZ (nullable)
- user_id              UUID (nullable) - Référence auth.users
```

### Problèmes identifiés
1. ❌ **Colonne `user_id` ambiguë** : Devrait être `recipient_user_id` pour clarté
2. ❌ **Pas de `recipient_role`** : Impossible de cibler par rôle (admin, manager, commercial)
3. ❌ **Pas de `entity_type`** : Redondant avec `type` mais utile pour requêtes
4. ❌ **Types trop génériques** : `'lead'` devrait être `'lead_created'`, `'lead_assigned'`, etc.
5. ❌ **Pas de RLS policies** : Aucune politique de sécurité définie

---

## 🔧 Triggers existants

### 1. Trigger `trg_notify_new_lead`
- **Fonction :** `notify_new_lead()`
- **Table :** `public.leads`
- **Événement :** `AFTER INSERT`
- **Action :** Crée une notification `type='lead'` avec titre et message
- **Problème :** Pas de ciblage par rôle, notification globale uniquement

### 2. Trigger `trg_notify_new_commande`
- **Fonction :** `notify_new_commande()`
- **Table :** `public.commandes`
- **Événement :** `AFTER INSERT`
- **Action :** Crée une notification `type='commande'` avec titre et message
- **Problème :** Pas de ciblage par rôle, notification globale uniquement

### 3. Trigger manquant : `lead_assigned`
- **Problème :** Aucun trigger pour notifier lors de l'assignation d'un lead à un commercial
- **Colonnes leads :** `commercial_assigne_id` et `responsable_id` (incohérence à clarifier)

---

## 🔐 RLS Policies

### État actuel
- ❌ **Aucune RLS policy** sur la table `notifications`
- ❌ RLS probablement non activé sur la table

### Besoins identifiés
1. **Admin/Manager** : Voir toutes les notifications + globales
2. **Commercial** : Voir ses propres notifications + globales pour son rôle
3. **Autres rôles** : Voir leurs propres notifications + globales

---

## 📊 Schéma de la table `leads` (pour assignation)

### Colonnes d'assignation identifiées
- `commercial_assigne_id` (UUID, nullable) - Utilisé dans `AdminLeads.jsx`, `leads.js`
- `responsable_id` (UUID, nullable) - Utilisé dans `AdminLeadDetail.jsx`

**⚠️ Incohérence :** Deux colonnes pour la même fonction. À vérifier laquelle est la bonne.

### Rôles utilisateurs (table `utilisateurs`)
- `super_admin`
- `admin`
- `commercial`
- `technicien`
- `viewer`

---

## 🎯 Schéma cible (à implémenter)

```sql
CREATE TABLE public.notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                TEXT NOT NULL,               -- 'lead_created', 'lead_assigned', 'order_created', etc.
  title               TEXT NOT NULL,
  message             TEXT,
  entity_type         TEXT,                         -- 'lead' | 'order' | autre
  entity_id           UUID,                         -- id du lead / commande
  recipient_user_id    UUID REFERENCES auth.users(id),  -- null = notification globale
  recipient_role      TEXT,                         -- 'admin' | 'manager' | 'commercial' | null
  status              TEXT NOT NULL DEFAULT 'unread', -- 'unread' | 'read'
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at             TIMESTAMPTZ
);
```

### Types de notifications
- `lead_created` - Nouveau lead créé
- `lead_assigned` - Lead assigné à un commercial
- `order_created` - Nouvelle commande créée
- `system` - Notification système (maintenance, etc.)

---

## 📝 Actions à effectuer

### 1. Migration propre
- [ ] Créer `migrations/20251201_normalize_notifications_system.sql`
- [ ] Migrer les colonnes existantes (`user_id` → `recipient_user_id`)
- [ ] Ajouter `recipient_role` et `entity_type`
- [ ] Mettre à jour les types (`'lead'` → `'lead_created'`, etc.)
- [ ] Créer les index optimisés

### 2. RLS Policies
- [ ] Activer RLS sur `notifications`
- [ ] Policy admin : voir tout
- [ ] Policy manager : voir tout
- [ ] Policy utilisateur : voir ses notifs + globales

### 3. Triggers refactorisés
- [ ] `notify_lead_created()` - Notification globale pour admin/manager
- [ ] `notify_lead_assigned()` - Notification pour le commercial assigné
- [ ] `notify_order_created()` - Notification globale pour admin/manager

### 4. Code Frontend
- [ ] Adapter `notifications.js` pour filtrer par `recipient_user_id` et `recipient_role`
- [ ] Adapter `NotificationsContext` pour utiliser le rôle de l'utilisateur
- [ ] Tester avec différents rôles

---

## 🔍 Notes importantes

1. **Table utilisateurs :** `utilisateurs` (pas `profiles`)
2. **Colonne assignation leads :** Vérifier si `commercial_assigne_id` ou `responsable_id` est la bonne
3. **Rôles :** Pas de `manager` actuellement, seulement `admin` et `commercial`
4. **Realtime :** Déjà configuré dans `NotificationsContext`, à conserver

---

## ✅ Checklist de validation

- [x] Cartographie complète de l'existant
- [ ] Migration propre créée
- [ ] RLS policies créées
- [ ] Triggers refactorisés
- [ ] Code frontend adapté
- [ ] Tests avec différents rôles
- [ ] Documentation finale

