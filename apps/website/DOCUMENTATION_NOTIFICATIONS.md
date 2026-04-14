# Documentation - Système de Notifications Temps Réel

## 📋 Vue d'ensemble

Système de notifications temps réel pour l'admin Effinor qui affiche les nouveaux leads et commandes en direct via Supabase Realtime.

## ✅ Éléments implémentés

### 1. Migration SQL (`migrations/20251201_add_last_notifications_seen_at.sql`)

**Fonctionnalités :**
- ✅ Ajoute la colonne `last_notifications_seen_at TIMESTAMPTZ NULL` à la table `utilisateurs`
- ✅ Initialise la valeur à `NOW()` pour tous les utilisateurs existants
- ✅ Crée un index pour améliorer les performances
- ✅ Gère le cas où la colonne existe déjà

**À exécuter dans Supabase SQL Editor :**
```sql
-- Voir le fichier migrations/20251201_add_last_notifications_seen_at.sql
```

### 2. NotificationsContext (`src/contexts/NotificationsContext.jsx`)

**Fonctionnalités :**
- ✅ Charge les notifications depuis Supabase (leads et commandes créés après `last_notifications_seen_at`)
- ✅ S'abonne à Supabase Realtime pour recevoir les nouveaux événements en direct
- ✅ Normalise les notifications (leads et commandes) avec un format uniforme
- ✅ Gère les états : `notifications`, `hasUnread`, `loading`, `error`
- ✅ Méthode `markAllAsRead()` pour marquer toutes les notifications comme lues
- ✅ Gestion d'erreur gracieuse si la colonne `last_notifications_seen_at` n'existe pas

**Utilisation :**
```jsx
import { useNotifications } from '@/contexts/NotificationsContext';

const MyComponent = () => {
  const { notifications, hasUnread, loading, markAllAsRead } = useNotifications();
  
  return (
    <div>
      {hasUnread && <Badge>Nouveau</Badge>}
      <button onClick={markAllAsRead}>Marquer comme lu</button>
    </div>
  );
};
```

**Format des notifications :**
```javascript
{
  id: 'lead-123' | 'commande-456',
  type: 'lead' | 'commande',
  title: 'Nouveau lead : Jean Dupont (Entreprise)',
  description: 'jean@example.com' | 'Client • 1 234,56 €',
  created_at: '2025-12-01T10:30:00Z',
  link: '/admin/leads/123' | '/admin/orders/456',
  raw: { /* données brutes */ }
}
```

### 3. AdminHeader (`src/components/admin/AdminHeader.jsx`)

**Fonctionnalités :**
- ✅ Icône cloche avec badge vert si `hasUnread === true`
- ✅ Dropdown aligné à droite avec :
  - Liste des 10 dernières notifications
  - Icônes différentes pour leads (`UserPlus`) et commandes (`ShoppingBag`)
  - Titre en gras, description en gris, date relative (ex: "il y a 2 heures")
  - Bouton "Marquer tout comme lu" en haut
  - États de chargement et message "Aucune notification"
- ✅ Fermeture automatique au clic en dehors
- ✅ Navigation vers la page de détail au clic sur une notification

**Design :**
- Fond blanc, ombre douce (`0 10px 40px rgba(15,23,42,0.12)`)
- Largeur : `w-96` (384px)
- Max height : `600px` avec scroll
- Hover states sur les items

### 4. Badges dans la Sidebar (`src/components/admin/AdminSidebar.jsx`)

**Fonctionnalités :**
- ✅ Badge vert sur "Leads" si des notifications de type `lead` existent
- ✅ Badge vert sur "Commandes" si des notifications de type `commande` existent
- ✅ Affichage du nombre (ex: "3" ou "9+" si > 9)
- ✅ Design discret : pill vert avec texte blanc

**Exemple :**
```jsx
<Link to="/admin/leads">
  Leads
  {unreadLeadsCount > 0 && (
    <span className="badge">{unreadLeadsCount}</span>
  )}
</Link>
```

### 5. Intégration dans AdminLayout (`src/components/admin/AdminLayout.jsx`)

**Fonctionnalités :**
- ✅ Header sticky en haut avec fond `bg-gray-900`
- ✅ AdminHeader intégré à droite du header
- ✅ Responsive : header visible sur toutes les tailles d'écran

### 6. Provider dans main.jsx

**Fonctionnalités :**
- ✅ `NotificationsProvider` enveloppe l'application au même niveau que `UserProvider`
- ✅ Accès aux notifications dans tous les composants admin

## 🔧 Architecture technique

### Structure des fichiers

```
src/
├── contexts/
│   └── NotificationsContext.jsx    # Contexte global notifications
├── components/
│   └── admin/
│       ├── AdminHeader.jsx          # Header avec cloche notifications
│       ├── AdminSidebar.jsx         # Sidebar avec badges
│       └── AdminLayout.jsx          # Layout avec header
├── migrations/
│   └── 20251201_add_last_notifications_seen_at.sql
└── main.jsx                         # Intégration NotificationsProvider
```

### Flux de données

1. **Chargement initial :**
   - `NotificationsContext` charge les notifications depuis Supabase
   - Filtre par `last_notifications_seen_at` (ou 7 jours par défaut si null)
   - Normalise et trie les notifications

2. **Realtime :**
   - S'abonne aux événements `INSERT` sur `leads` et `commandes`
   - Ajoute automatiquement les nouvelles notifications à la liste
   - Marque comme "non lu" si `last_notifications_seen_at` existe

3. **Marquer comme lu :**
   - Met à jour `last_notifications_seen_at` dans `utilisateurs`
   - Vide le flag `hasUnread`
   - Les nouvelles notifications après cette date seront considérées comme "nouvelles"

## 📝 Utilisation dans d'autres composants

### Exemple 1 : Afficher le nombre de notifications non lues

```jsx
import { useNotifications } from '@/contexts/NotificationsContext';

const MyComponent = () => {
  const { hasUnread, notifications } = useNotifications();
  
  return (
    <div>
      {hasUnread && (
        <span className="badge">
          {notifications.length} nouvelle{notifications.length > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};
```

### Exemple 2 : Filtrer par type de notification

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

### Exemple 3 : Rafraîchir manuellement

```jsx
import { useNotifications } from '@/contexts/NotificationsContext';

const RefreshButton = () => {
  const { refreshNotifications, loading } = useNotifications();
  
  return (
    <button onClick={refreshNotifications} disabled={loading}>
      {loading ? 'Chargement...' : 'Rafraîchir'}
    </button>
  );
};
```

## 🎨 Design & UX

### Couleurs
- Badge non lu : `bg-emerald-500` (vert)
- Icône lead : `text-emerald-500`
- Icône commande : `text-blue-500`
- Fond dropdown : `bg-white`
- Bordure : `border-slate-200`

### Espacements
- Dropdown : `w-96` (384px), `max-h-[600px]`
- Items : `p-3`, `gap-3`
- Header dropdown : `px-4 py-3`

### Responsive
- Header visible sur toutes les tailles
- Dropdown responsive (s'adapte à la largeur de l'écran)

## 🔐 Sécurité

- ✅ Requêtes Supabase avec RLS (Row Level Security)
- ✅ Filtrage par utilisateur via `profile.id`
- ✅ Gestion d'erreur gracieuse si colonne manquante
- ✅ Pas de données sensibles exposées dans les notifications

## 🚀 Prochaines améliorations (optionnel)

1. **Notifications persistantes** : Stocker les notifications dans une table dédiée
2. **Filtres** : Filtrer par type (leads uniquement, commandes uniquement)
3. **Actions** : Boutons d'action rapide dans le dropdown (ex: "Qualifier le lead")
4. **Son** : Notification sonore pour les nouveaux événements
5. **Badge animé** : Animation du badge lors de nouvelles notifications

## ✅ Checklist de validation

- [x] Migration SQL créée
- [x] NotificationsContext créé et fonctionnel
- [x] AdminHeader avec dropdown créé
- [x] Badges dans Sidebar ajoutés
- [x] AdminLayout mis à jour avec header
- [x] Provider intégré dans main.jsx
- [x] Realtime subscriptions configurées
- [x] Gestion d'erreur gracieuse
- [x] Design cohérent avec la charte Effinor
- [x] Responsive design
- [x] Accessibilité (aria-labels, focus states)

## 📚 Références

- **NotificationsContext** : `src/contexts/NotificationsContext.jsx`
- **AdminHeader** : `src/components/admin/AdminHeader.jsx`
- **Migration SQL** : `migrations/20251201_add_last_notifications_seen_at.sql`

## 🐛 Dépannage

### Les notifications ne s'affichent pas

1. Vérifier que la migration SQL a été exécutée
2. Vérifier que `last_notifications_seen_at` existe dans la table `utilisateurs`
3. Vérifier les logs de la console (mode DEV) pour voir les erreurs

### Realtime ne fonctionne pas

1. Vérifier que Realtime est activé dans Supabase Dashboard
2. Vérifier les permissions RLS sur les tables `leads` et `commandes`
3. Vérifier la connexion WebSocket dans les DevTools

### Les badges ne s'affichent pas

1. Vérifier que `useNotifications()` est appelé dans un composant enfant de `NotificationsProvider`
2. Vérifier que les notifications sont bien chargées (`notifications.length > 0`)



















