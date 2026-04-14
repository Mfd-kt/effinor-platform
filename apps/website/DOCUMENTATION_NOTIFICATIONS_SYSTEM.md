# Documentation - Système de Notifications Complet

## 📋 Vue d'ensemble

Système de notifications complet pour l'admin Effinor basé sur une table dédiée `notifications` avec génération automatique via triggers PostgreSQL et affichage temps réel via Supabase Realtime.

## ✅ Éléments implémentés

### 1. Migration SQL (`migrations/20251201_create_notifications_system.sql`)

**Fonctionnalités :**
- ✅ Crée la table `notifications` avec tous les champs nécessaires
- ✅ Crée les index pour les performances
- ✅ Crée les fonctions trigger `notify_new_lead()` et `notify_new_commande()`
- ✅ Crée les triggers `trg_notify_new_lead` et `trg_notify_new_commande`
- ✅ Gère automatiquement la création de notifications lors de l'insertion de leads/commandes

**Structure de la table :**
```sql
- id (UUID, PK)
- type ('lead' | 'commande' | 'system')
- entity_id (UUID, nullable) - ID du lead ou de la commande
- title (TEXT, required)
- message (TEXT, nullable)
- status ('unread' | 'read')
- created_at (TIMESTAMPTZ)
- read_at (TIMESTAMPTZ, nullable)
- user_id (UUID, nullable) - Pour notifications personnalisées futures
```

**À exécuter dans Supabase SQL Editor :**
```sql
-- Voir le fichier migrations/20251201_create_notifications_system.sql
```

**Important :** Après l'exécution, activer Realtime dans Supabase Dashboard → Database → Replication pour la table `notifications`.

### 2. Service Notifications (`src/services/notifications.js`)

**Fonctionnalités :**
- ✅ `fetchNotifications(params)` - Récupère les notifications avec filtres
- ✅ `markNotificationAsRead(id)` - Marque une notification comme lue
- ✅ `markAllNotificationsAsRead()` - Marque toutes les notifications comme lues
- ✅ `markNotificationAsUnread(id)` - Marque une notification comme non lue
- ✅ `getUnreadCount()` - Récupère le nombre de notifications non lues
- ✅ `createSystemNotification(params)` - Crée une notification système manuellement

**Utilisation :**
```javascript
import { fetchNotifications, markNotificationAsRead } from '@/services/notifications';

// Récupérer les notifications non lues
const unread = await fetchNotifications({ status: 'unread', limit: 10 });

// Marquer comme lue
await markNotificationAsRead(notificationId);
```

### 3. NotificationsContext (`src/contexts/NotificationsContext.jsx`)

**Fonctionnalités :**
- ✅ Charge les notifications au montage
- ✅ S'abonne à Supabase Realtime pour recevoir les nouvelles notifications en direct
- ✅ Met à jour automatiquement le compteur de non lues
- ✅ Expose : `notifications`, `unreadCount`, `loading`, `error`, `refresh()`, `markAsRead()`, `markAllAsRead()`

**Utilisation :**
```jsx
import { useNotifications } from '@/contexts/NotificationsContext';

const MyComponent = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  return (
    <div>
      {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
      <button onClick={markAllAsRead}>Tout marquer comme lu</button>
    </div>
  );
};
```

**Provider intégré dans `main.jsx`** au même niveau que `UserProvider`.

### 4. AdminHeader (`src/components/admin/AdminHeader.jsx`)

**Fonctionnalités :**
- ✅ Icône cloche avec badge rouge affichant le nombre de non lues
- ✅ Dropdown avec les 10 dernières notifications
- ✅ Affichage des icônes selon le type (UserPlus pour leads, ShoppingBag pour commandes)
- ✅ Badge "Non lu" pour les notifications non lues
- ✅ Bouton "Tout marquer comme lu"
- ✅ Lien vers la page complète `/admin/notifications`
- ✅ Navigation automatique vers la ressource au clic
- ✅ Marque automatiquement comme lue au clic

**Design :**
- Badge rouge avec nombre (9+ si > 9)
- Dropdown responsive (w-80 sur mobile, w-96 sur desktop)
- Fond vert clair pour les notifications non lues

### 5. Page Notifications (`src/pages/admin/NotificationsPage.jsx`)

**Fonctionnalités :**
- ✅ Hero avec titre, sous-titre et bouton "Tout marquer comme lu"
- ✅ Filtres : Statut (Toutes / Non lues / Lues), Type (Tous / Leads / Commandes / Système), Période (Tout / 24h / 7j / 30j)
- ✅ Liste complète des notifications avec :
  - Icône selon le type
  - Titre (bold si non lu)
  - Message
  - Badge type
  - Date formatée (dd/MM/yyyy HH:mm)
  - Badge "Non lu" si applicable
  - Bouton pour marquer comme lu/non lu
- ✅ Navigation vers la ressource au clic
- ✅ États de chargement et erreur
- ✅ Compteur de notifications filtrées

**Route :** `/admin/notifications`

### 6. Intégration Routes

**Fichier modifié :** `src/App.jsx`
- ✅ Route `/admin/notifications` ajoutée
- ✅ Import de `NotificationsPage` ajouté

## 🔧 Architecture technique

### Structure des fichiers

```
migrations/
└── 20251201_create_notifications_system.sql    # Migration SQL

src/
├── services/
│   └── notifications.js                        # Service API notifications
├── contexts/
│   └── NotificationsContext.jsx                # Contexte global
├── components/
│   └── admin/
│       └── AdminHeader.jsx                      # Header avec cloche
├── pages/
│   └── admin/
│       └── NotificationsPage.jsx                 # Page complète
└── main.jsx                                     # Provider intégré
```

### Flux de données

1. **Création automatique :**
   - Un lead est créé → Trigger `trg_notify_new_lead` → Insert dans `notifications`
   - Une commande est créée → Trigger `trg_notify_new_commande` → Insert dans `notifications`

2. **Affichage temps réel :**
   - `NotificationsContext` s'abonne à Realtime sur `notifications`
   - Nouvelle notification → Mise à jour automatique du state
   - Compteur de non lues mis à jour automatiquement

3. **Marquer comme lu :**
   - Clic sur notification → `markAsRead(id)` → Update dans Supabase
   - Realtime propage la mise à jour → State mis à jour automatiquement

## 📝 Utilisation dans d'autres composants

### Exemple 1 : Afficher le nombre de notifications non lues

```jsx
import { useNotifications } from '@/contexts/NotificationsContext';

const MyComponent = () => {
  const { unreadCount } = useNotifications();
  
  return (
    <div>
      {unreadCount > 0 && (
        <Badge variant="destructive">{unreadCount}</Badge>
      )}
    </div>
  );
};
```

### Exemple 2 : Créer une notification système

```jsx
import { createSystemNotification } from '@/services/notifications';

// Dans une fonction
await createSystemNotification({
  title: 'Maintenance programmée',
  message: 'Le système sera en maintenance demain de 2h à 4h',
  user_id: null // null pour notification globale
});
```

### Exemple 3 : Filtrer les notifications par type

```jsx
import { useNotifications } from '@/contexts/NotificationsContext';

const LeadsNotifications = () => {
  const { notifications } = useNotifications();
  const leadsNotifications = notifications.filter(n => n.type === 'lead');
  
  return (
    <div>
      {leadsNotifications.map(notif => (
        <div key={notif.id}>{notif.title}</div>
      ))}
    </div>
  );
};
```

## 🎨 Design & UX

### Couleurs
- Badge non lu : `bg-rose-500` (rouge)
- Icône lead : `text-emerald-500` (vert)
- Icône commande : `text-blue-500` (bleu)
- Icône système : `text-purple-500` (violet)
- Fond notification non lue : `bg-emerald-50/40`

### Espacements
- Dropdown : `w-80` (mobile), `w-96` (desktop), `max-h-[600px]`
- Items : `p-3` ou `p-4`, `gap-3` ou `gap-4`
- Cards : `rounded-xl`, `shadow-sm`

### Responsive
- Header : visible sur toutes les tailles
- Dropdown : responsive (max-width 320px sur mobile)
- Page : responsive avec grid adaptatif

## 🔐 Sécurité

- ✅ Requêtes Supabase avec RLS (Row Level Security)
- ✅ Triggers avec `SECURITY DEFINER` pour garantir les insertions
- ✅ Validation des types dans la table (CHECK constraints)
- ✅ Gestion d'erreur gracieuse

## 🚀 Prochaines améliorations (optionnel)

1. **Notifications personnalisées** : Utiliser `user_id` pour filtrer par utilisateur
2. **Notifications système** : Créer des notifications pour événements système (maintenance, etc.)
3. **Actions rapides** : Boutons d'action dans les notifications (ex: "Qualifier le lead")
4. **Son** : Notification sonore pour les nouvelles notifications
5. **Badge animé** : Animation du badge lors de nouvelles notifications
6. **Pagination** : Pagination dans la page notifications pour grandes listes

## ✅ Checklist de validation

- [x] Migration SQL créée
- [x] Service notifications créé
- [x] NotificationsContext refactorisé
- [x] AdminHeader mis à jour avec nouveau système
- [x] Page NotificationsPage créée
- [x] Route ajoutée dans App.jsx
- [x] Provider intégré dans main.jsx
- [x] Realtime subscriptions configurées
- [x] Gestion d'erreur complète
- [x] Design cohérent avec la charte Effinor
- [x] Responsive design
- [x] Accessibilité (aria-labels, focus states)

## 📚 Références

- **Migration SQL** : `migrations/20251201_create_notifications_system.sql`
- **Service** : `src/services/notifications.js`
- **Context** : `src/contexts/NotificationsContext.jsx`
- **Header** : `src/components/admin/AdminHeader.jsx`
- **Page** : `src/pages/admin/NotificationsPage.jsx`

## 🐛 Dépannage

### Les notifications ne se créent pas automatiquement

1. Vérifier que la migration SQL a été exécutée
2. Vérifier que les triggers existent : `SELECT * FROM pg_trigger WHERE tgname LIKE 'trg_notify%';`
3. Vérifier les logs Supabase pour les erreurs de trigger

### Realtime ne fonctionne pas

1. Vérifier que Realtime est activé dans Supabase Dashboard → Database → Replication
2. Vérifier les permissions RLS sur la table `notifications`
3. Vérifier la connexion WebSocket dans les DevTools

### Les notifications ne s'affichent pas

1. Vérifier que `NotificationsProvider` est bien dans `main.jsx`
2. Vérifier que `useNotifications()` est appelé dans un composant enfant du provider
3. Vérifier les logs de la console pour les erreurs

## 📖 Guide d'utilisation

### Comment ajouter une nouvelle source de notifications

Pour ajouter un nouveau type de notification (ex: `'system'`), il suffit de :

1. **Créer un trigger** (si automatique) :
```sql
CREATE OR REPLACE FUNCTION public.notify_system_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message)
  VALUES ('system', 'Événement système', 'Description...');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. **Ou créer manuellement** via le service :
```javascript
import { createSystemNotification } from '@/services/notifications';

await createSystemNotification({
  title: 'Titre de la notification',
  message: 'Message optionnel',
  user_id: null // ou un user_id spécifique
});
```

3. **L'UI s'adapte automatiquement** : Le `NotificationsContext` et `AdminHeader` gèrent automatiquement tous les types.

### Comment utiliser useNotifications() dans d'autres composants

```jsx
import { useNotifications } from '@/contexts/NotificationsContext';

const MyComponent = () => {
  const { 
    notifications,      // Liste complète des notifications
    unreadCount,        // Nombre de non lues
    loading,            // État de chargement
    error,              // Erreur éventuelle
    refresh,            // Fonction pour recharger
    markAsRead,         // Fonction pour marquer une notification comme lue
    markAllAsRead       // Fonction pour tout marquer comme lu
  } = useNotifications();
  
  // Filtrer par type
  const leadsNotifications = notifications.filter(n => n.type === 'lead');
  
  // Afficher le compteur
  return <div>Non lues : {unreadCount}</div>;
};
```

