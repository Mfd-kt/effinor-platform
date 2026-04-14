# Documentation - Notifications Temps Réel Frontend

**Date :** 2025-12-01  
**Version :** 1.0

## ✅ Système en place

Le système de notifications temps réel est **déjà implémenté** et fonctionnel dans `src/contexts/NotificationsContext.jsx`.

### Fonctionnalités actives

1. ✅ **Abonnement Realtime Supabase**
   - Canal : `realtime:notifications`
   - Écoute les événements `INSERT` et `UPDATE` sur la table `notifications`
   - Mise à jour automatique de la liste et du compteur

2. ✅ **Toast automatique**
   - Affiche un toast pour chaque nouvelle notification non lue
   - Durée : 6 secondes
   - Icône selon le type de notification

3. ✅ **Son de notification** (optionnel)
   - Son discret généré via Web Audio API
   - Se joue uniquement si la page est visible (pas si l'utilisateur est sur un autre onglet)

4. ✅ **Vibration mobile** (optionnel)
   - Vibration de 200ms sur mobile
   - Se déclenche uniquement si la page est visible

5. ✅ **Mise à jour automatique**
   - Badge de compteur mis à jour en temps réel
   - Liste des notifications mise à jour automatiquement
   - Pas besoin de rafraîchir la page

---

## 🔧 Architecture

### NotificationsContext

Le contexte `NotificationsContext` :

1. **Charge les notifications au montage** via `fetchNotifications()`
2. **S'abonne à Realtime** pour recevoir les nouvelles notifications
3. **Affiche un toast** pour chaque nouvelle notification non lue
4. **Met à jour le state** automatiquement

### Flux de données

```
Trigger PostgreSQL → INSERT dans notifications
    ↓
Supabase Realtime → Événement WebSocket
    ↓
NotificationsContext → Reçoit l'événement
    ↓
1. Ajoute à la liste des notifications
2. Incrémente le compteur unreadCount
3. Affiche un toast
4. Joue un son (si page visible)
5. Vibre (si mobile et page visible)
```

---

## 📝 Utilisation

### Dans un composant

```jsx
import { useNotifications } from '@/contexts/NotificationsContext';

const MyComponent = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  return (
    <div>
      {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
      {notifications.map(notif => (
        <div key={notif.id}>{notif.title}</div>
      ))}
    </div>
  );
};
```

### Dans le Header (AdminHeader)

Le `AdminHeader` utilise déjà `useNotifications()` et affiche :
- Badge avec le nombre de non lues
- Dropdown avec les 10 dernières notifications
- Mise à jour automatique en temps réel

---

## 🎯 Types de notifications et icônes

| Type | Icône | Description |
|------|-------|-------------|
| `lead_created` | 👤 | Nouveau lead créé |
| `lead_assigned` | 👤 | Lead assigné à un commercial |
| `order_created` | 🛒 | Nouvelle commande créée |
| `order_assigned` | 🛒 | Commande assignée (futur) |
| `system` | ⚙️ | Notification système |

---

## 🔔 Toast automatique

Chaque nouvelle notification non lue déclenche automatiquement un toast avec :
- **Titre** : Icône + titre de la notification
- **Description** : Message de la notification
- **Durée** : 6 secondes
- **Position** : En bas à droite (configuré dans `Toaster`)

### Personnalisation du toast

Le toast est créé automatiquement dans `NotificationsContext` :

```javascript
toast({
  title: `${icon} ${newNotification.title}`,
  description: newNotification.message || '',
  duration: 6000,
});
```

Pour personnaliser, modifier la fonction dans `NotificationsContext.jsx` ligne ~217.

---

## 🔊 Son de notification

Le son est généré via Web Audio API :
- **Fréquence** : 800 Hz
- **Type** : Sine wave
- **Durée** : 0.1 seconde
- **Volume** : 30% (discret)

Le son ne se joue que si :
- La page est visible (`!document.hidden`)
- Le navigateur supporte Web Audio API

### Désactiver le son

Pour désactiver le son, commenter ou supprimer l'appel à `playNotificationSound()` dans `NotificationsContext.jsx`.

---

## 📳 Vibration mobile

La vibration est activée automatiquement sur mobile :
- **Durée** : 200ms
- **Condition** : Page visible et navigateur supporte `navigator.vibrate`

### Désactiver la vibration

Pour désactiver la vibration, commenter ou supprimer l'appel à `navigator.vibrate()` dans `NotificationsContext.jsx`.

---

## 🐛 Dépannage

### Les notifications n'apparaissent pas en temps réel

1. **Vérifier que Realtime est activé :**
   - Supabase Dashboard → Database → Replication
   - Vérifier que `notifications` est activé

2. **Vérifier la console :**
   ```javascript
   // Devrait afficher :
   [NotificationsContext] ✅ Abonné au canal Realtime notifications
   ```

3. **Vérifier les logs Realtime :**
   - Ouvrir la console du navigateur
   - Créer un nouveau lead
   - Vérifier qu'un événement `INSERT` est reçu

### Le toast ne s'affiche pas

1. **Vérifier que `Toaster` est dans `App.jsx` :**
   ```jsx
   import { Toaster } from '@/components/ui/toaster';
   
   // Dans le return de App
   <Toaster />
   ```

2. **Vérifier que le toast est bien appelé :**
   - Ouvrir la console
   - Créer une notification
   - Vérifier les logs : `[NotificationsContext] ✨ Nouvelle notification en temps réel`

### Le son ne fonctionne pas

1. **Vérifier que la page est visible** (pas un autre onglet)
2. **Vérifier que le navigateur supporte Web Audio API**
3. **Vérifier les permissions audio** (certains navigateurs demandent une interaction utilisateur)

---

## ✅ Checklist de validation

- [x] Realtime activé dans Supabase Dashboard
- [x] NotificationsContext s'abonne au canal Realtime
- [x] Toast automatique pour nouvelles notifications
- [x] Son de notification (optionnel)
- [x] Vibration mobile (optionnel)
- [x] Badge mis à jour en temps réel
- [x] Liste des notifications mise à jour automatiquement
- [x] Pas besoin de rafraîchir la page

---

## 🚀 Résultat final

Avec ce système en place :

✅ **Les notifications apparaissent instantanément** sans rafraîchir la page  
✅ **Toast automatique** pour chaque nouvelle notification  
✅ **Badge mis à jour en temps réel** dans le header  
✅ **Son discret** pour attirer l'attention (si page visible)  
✅ **Vibration mobile** pour les notifications importantes  
✅ **Filtrage automatique par RLS** (admin voit tout, commercial voit ses notifs)  

**Le système fonctionne comme un vrai SaaS professionnel ! 🎉**






