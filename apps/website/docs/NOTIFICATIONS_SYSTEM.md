# Documentation - Système de Notifications Effinor Admin

**Date :** 2025-12-01  
**Version :** 1.0 (Final)

## 📋 Vue d'ensemble

Système de notifications complet et normalisé pour Effinor Admin, avec :
- ✅ Schéma SQL propre et extensible
- ✅ RLS (Row Level Security) pour la sécurité
- ✅ Triggers automatiques pour leads et commandes
- ✅ Support des notifications par utilisateur et par rôle
- ✅ Realtime Supabase pour les mises à jour en direct

---

## 🗄️ Schéma de la table `public.notifications`

### Structure

```sql
CREATE TABLE public.notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT NOT NULL CHECK (type IN ('lead_created', 'lead_assigned', 'order_created', 'order_assigned', 'system')),
  title             TEXT NOT NULL,
  message           TEXT NOT NULL,
  entity_type       TEXT CHECK (entity_type IN ('lead', 'order', 'system')) DEFAULT 'system',
  entity_id         UUID NULL,
  recipient_user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role    TEXT NULL,
  status            TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  read_at           TIMESTAMPTZ NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meta              JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

### Colonnes expliquées

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `type` | TEXT | Type de notification : `lead_created`, `lead_assigned`, `order_created`, `order_assigned`, `system` |
| `title` | TEXT | Titre de la notification (requis) |
| `message` | TEXT | Message détaillé (requis) |
| `entity_type` | TEXT | Type d'entité liée : `lead`, `order`, `system` |
| `entity_id` | UUID | ID de l'entité liée (lead.id ou commande.id) |
| `recipient_user_id` | UUID | ID utilisateur destinataire (nullable pour notifications globales) |
| `recipient_role` | TEXT | Rôle destinataire (nullable, pour notifications par rôle) |
| `status` | TEXT | Statut : `unread` ou `read` |
| `read_at` | TIMESTAMPTZ | Date de lecture (nullable) |
| `created_at` | TIMESTAMPTZ | Date de création |
| `meta` | JSONB | Métadonnées supplémentaires (données du lead/commande, etc.) |

### Index

Les index suivants sont créés pour optimiser les performances :

- `idx_notifications_created_at` : Tri par date
- `idx_notifications_status` : Filtrage par statut
- `idx_notifications_type` : Filtrage par type
- `idx_notifications_recipient_user_id` : Notifications par utilisateur
- `idx_notifications_recipient_role` : Notifications par rôle
- `idx_notifications_entity` : Recherche par entité
- `idx_notifications_recipient_user_status` : Composite (user + status + date)
- `idx_notifications_recipient_role_status` : Composite (role + status + date)

---

## 🔐 RLS (Row Level Security)

### Policies

#### 1. Admin voit toutes les notifications
```sql
CREATE POLICY admin_all_notifications
ON public.notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role = 'admin'
  )
);
```

#### 2. Manager voit toutes les notifications
```sql
CREATE POLICY manager_all_notifications
ON public.notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role = 'manager'
  )
);
```

#### 3. Super Admin voit toutes les notifications
```sql
CREATE POLICY super_admin_all_notifications
ON public.notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role = 'super_admin'
  )
);
```

#### 4. Utilisateur voit ses propres notifications + globales + celles de son rôle
```sql
CREATE POLICY user_notifications
ON public.notifications FOR SELECT
TO authenticated
USING (
  recipient_user_id = auth.uid()
  OR (
    recipient_role IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.utilisateurs
      WHERE utilisateurs.auth_user_id = auth.uid()
      AND utilisateurs.role = recipient_role
    )
  )
  OR (recipient_user_id IS NULL AND recipient_role IS NULL)  -- notification globale
);
```

#### 5. Utilisateur peut mettre à jour ses propres notifications
```sql
CREATE POLICY user_update_notifications
ON public.notifications FOR UPDATE
TO authenticated
USING (
  recipient_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role IN ('admin', 'super_admin', 'manager')
  )
);
```

#### 6. Insertion réservée aux admins (ou service_role via triggers)
```sql
CREATE POLICY service_insert_notifications
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE utilisateurs.auth_user_id = auth.uid()
    AND utilisateurs.role IN ('admin', 'super_admin')
  )
);
```

**Note :** Les triggers utilisent `SECURITY DEFINER` donc ils peuvent insérer même sans cette policy.

---

## ⚙️ Triggers automatiques

### 1. Notification lors de la création d'un lead

**Fonction :** `notify_lead_created()`  
**Trigger :** `trg_notify_lead_created`  
**Événement :** `AFTER INSERT ON public.leads`

**Comportement :**
- Crée une notification `type='lead_created'`
- Destinée aux managers (`recipient_role='manager'`)
- Contient le nom complet, la société, la source, et les coordonnées
- Stocke les métadonnées dans `meta` (JSONB)

**Exemple de notification :**
```json
{
  "type": "lead_created",
  "title": "Nouveau lead : Jean Dupont (ACME Corp)",
  "message": "Un nouveau lead vient d'être créé depuis Formulaire site • jean.dupont@acme.fr",
  "entity_type": "lead",
  "entity_id": "uuid-du-lead",
  "recipient_role": "manager",
  "meta": {
    "lead_id": "uuid-du-lead",
    "nom": "Jean Dupont",
    "societe": "ACME Corp",
    "source": "Formulaire site",
    "email": "jean.dupont@acme.fr"
  }
}
```

### 2. Notification lors de l'assignation d'un lead

**Fonction :** `notify_lead_assigned()`  
**Trigger :** `trg_notify_lead_assigned`  
**Événement :** `AFTER INSERT OR UPDATE OF commercial_assigne_id, responsable_id ON public.leads`

**Comportement :**
- Crée une notification `type='lead_assigned'` uniquement si :
  - Un commercial est assigné (`commercial_assigne_id` ou `responsable_id`)
  - L'assignation a changé (nouveau lead ou réassignation)
- Destinée au commercial assigné (`recipient_user_id` et `recipient_role='commercial'`)
- Utilise `commercial_assigne_id` en priorité, sinon `responsable_id`

**Exemple de notification :**
```json
{
  "type": "lead_assigned",
  "title": "Lead assigné : Jean Dupont (ACME Corp)",
  "message": "Un lead vient de vous être assigné • jean.dupont@acme.fr",
  "entity_type": "lead",
  "entity_id": "uuid-du-lead",
  "recipient_user_id": "uuid-du-commercial",
  "recipient_role": "commercial",
  "meta": {
    "lead_id": "uuid-du-lead",
    "nom": "Jean Dupont",
    "societe": "ACME Corp",
    "email": "jean.dupont@acme.fr"
  }
}
```

### 3. Notification lors de la création d'une commande

**Fonction :** `notify_order_created()`  
**Trigger :** `trg_notify_order_created`  
**Événement :** `AFTER INSERT ON public.commandes`

**Comportement :**
- Crée une notification `type='order_created'`
- Destinée aux managers (`recipient_role='manager'`)
- Contient la référence, le nom du client, et le montant TTC/HT
- Stocke les métadonnées dans `meta` (JSONB)

**Exemple de notification :**
```json
{
  "type": "order_created",
  "title": "Nouvelle commande : CMD-20251201-1234",
  "message": "Une nouvelle commande vient d'être créée : ACME Corp • 1 250,00 € TTC",
  "entity_type": "order",
  "entity_id": "uuid-de-la-commande",
  "recipient_role": "manager",
  "meta": {
    "order_id": "uuid-de-la-commande",
    "reference": "CMD-20251201-1234",
    "client_nom": "ACME Corp",
    "total_ttc": 1250.00,
    "paiement_statut": "paye"
  }
}
```

### 4. Notification lors de l'assignation d'une commande (préparé pour le futur)

**Fonction :** `notify_order_assigned()`  
**Trigger :** Non actif pour l'instant (la table `commandes` n'a pas de colonne d'assignation)

**Note :** Cette fonction est préparée pour le futur si vous ajoutez une colonne `commercial_assigne_id` ou `responsable_id` dans la table `commandes`.

---

## 🎯 Types de notifications

| Type | Description | Destinataire | Déclencheur |
|------|-------------|--------------|-------------|
| `lead_created` | Nouveau lead créé | Managers | Trigger sur `leads` INSERT |
| `lead_assigned` | Lead assigné à un commercial | Commercial assigné | Trigger sur `leads` UPDATE (commercial_assigne_id) |
| `order_created` | Nouvelle commande créée | Managers | Trigger sur `commandes` INSERT |
| `order_assigned` | Commande assignée (futur) | Commercial assigné | Trigger sur `commandes` UPDATE (si colonne existe) |
| `system` | Notification système | Défini manuellement | Création manuelle |

---

## 🔍 Logique de filtrage RLS

### Pour un Admin
- ✅ Voit toutes les notifications (policy `admin_all_notifications`)

### Pour un Manager
- ✅ Voit toutes les notifications (policy `manager_all_notifications`)

### Pour un Super Admin
- ✅ Voit toutes les notifications (policy `super_admin_all_notifications`)

### Pour un Commercial
- ✅ Voit ses propres notifications (`recipient_user_id = auth.uid()`)
- ✅ Voit les notifications globales (`recipient_user_id IS NULL AND recipient_role IS NULL`)
- ✅ Voit les notifications pour son rôle (`recipient_role = 'commercial'`)
- ❌ Ne voit pas les notifications d'autres commerciaux

---

## 💻 Insérer une notification depuis une Edge Function ou n8n

### Depuis une Edge Function (Supabase)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Notification globale pour managers
await supabase
  .from('notifications')
  .insert({
    type: 'system',
    title: 'Maintenance programmée',
    message: 'Le système sera en maintenance demain de 2h à 4h',
    entity_type: 'system',
    recipient_role: 'manager',
    meta: {
      maintenance_date: '2025-12-02',
      maintenance_start: '02:00',
      maintenance_end: '04:00'
    }
  })

// Notification pour un utilisateur spécifique
await supabase
  .from('notifications')
  .insert({
    type: 'system',
    title: 'Bienvenue !',
    message: 'Votre compte a été créé avec succès',
    entity_type: 'system',
    recipient_user_id: userId,
    meta: {
      welcome_message: true
    }
  })
```

### Depuis n8n (Webhook)

```json
{
  "type": "system",
  "title": "Nouveau webhook reçu",
  "message": "Un nouveau webhook a été reçu depuis n8n",
  "entity_type": "system",
  "recipient_role": "admin",
  "meta": {
    "webhook_source": "n8n",
    "timestamp": "2025-12-01T10:00:00Z"
  }
}
```

**Note :** Pour insérer depuis n8n, vous devez utiliser le `service_role_key` de Supabase (jamais dans le code client).

---

## 📝 Exemples de requêtes Supabase (JS)

### Récupérer les notifications non lues
```javascript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('status', 'unread')
  .order('created_at', { ascending: false })
  .limit(10);
```

### Marquer toutes les notifications comme lues
```javascript
const { error } = await supabase
  .from('notifications')
  .update({ 
    status: 'read', 
    read_at: new Date().toISOString() 
  })
  .eq('status', 'unread');
```

### Filtrer par type
```javascript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('type', 'lead_assigned')
  .order('created_at', { ascending: false });
```

### Utiliser les métadonnées (meta JSONB)
```javascript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('type', 'lead_created')
  .filter('meta->>lead_id', 'eq', leadId);
```

---

## 🚀 Migration

Pour appliquer ce système :

1. **Exécuter la migration SQL :**
   ```sql
   -- Voir migrations/20251201_notifications_system.sql
   ```

2. **Activer Realtime dans Supabase Dashboard :**
   - Database → Replication
   - Activer pour la table `notifications`

3. **Vérifier les RLS policies :**
   - Database → Tables → notifications → Policies
   - Vérifier que toutes les policies sont créées

4. **Tester avec différents rôles :**
   - Créer un lead → Vérifier notification `lead_created` pour managers
   - Assigner un lead → Vérifier notification `lead_assigned` pour le commercial
   - Créer une commande → Vérifier notification `order_created` pour managers

---

## 🐛 Dépannage

### Les notifications ne s'affichent pas

1. **Vérifier RLS :**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'notifications';
   ```

2. **Vérifier le rôle de l'utilisateur :**
   ```sql
   SELECT role FROM public.utilisateurs WHERE auth_user_id = auth.uid();
   ```

3. **Tester une requête directe :**
   ```javascript
   const { data, error } = await supabase
     .from('notifications')
     .select('*')
     .limit(1);
   console.log('Notifications:', data, 'Error:', error);
   ```

### Les triggers ne fonctionnent pas

1. **Vérifier que les triggers existent :**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE 'trg_notify%';
   ```

2. **Tester manuellement :**
   ```sql
   SELECT public.notify_lead_created();
   ```

3. **Vérifier les logs Supabase :**
   - Dashboard → Logs → Postgres Logs

---

## 📚 Références

- **Migration SQL :** `migrations/20251201_notifications_system.sql`
- **Service Frontend :** `src/services/notifications.js`
- **Context Frontend :** `src/contexts/NotificationsContext.jsx`
- **Header :** `src/components/admin/AdminHeader.jsx`
- **Page :** `src/pages/admin/NotificationsPage.jsx`

---

## ✅ Checklist de validation

- [x] Migration SQL créée et testée
- [x] RLS policies créées et testées
- [x] Triggers créés et testés
- [x] Index créés pour performances
- [x] Documentation complète
- [ ] Realtime activé dans Supabase Dashboard
- [ ] Tests avec différents rôles effectués
