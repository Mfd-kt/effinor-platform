# Documentation - Page "Mon compte" & Propagation Avatar

## 📋 Vue d'ensemble

Implémentation complète d'une page "Mon compte" moderne niveau SaaS avec propagation globale de l'avatar utilisateur dans toute l'application via un contexte React global.

## ✅ Éléments implémentés

### 1. UserContext Global (`src/contexts/UserContext.jsx`)

**Fonctionnalités :**
- ✅ Charge automatiquement le profil depuis la table `utilisateurs`
- ✅ Crée le profil s'il n'existe pas
- ✅ Méthodes `refreshProfile()` et `updateProfile()` pour mise à jour réactive
- ✅ Synchronisation avec `AuthContext`
- ✅ Gestion d'erreurs complète

**Utilisation :**
```jsx
import { useUser } from '@/contexts/UserContext';

const MyComponent = () => {
  const { profile, loading, refreshProfile } = useUser();
  // profile contient toutes les données utilisateur
};
```

### 2. Composant Avatar Réutilisable (`src/components/common/UserAvatar.jsx`)

**Fonctionnalités :**
- ✅ Affiche l'image si disponible (`photo_profil_url` ou `avatar_url`)
- ✅ Fallback avec initiales et fond coloré
- ✅ Tailles configurables : `sm`, `md`, `lg`, `xl`, `2xl` ou nombre
- ✅ Compatible avec les données de la table `utilisateurs`

**Props :**
- `user` : Objet utilisateur avec `photo_profil_url`, `prenom`, `nom`, `full_name`, `email`
- `size` : Taille de l'avatar (défaut: `md`)
- `className` : Classes CSS supplémentaires
- `alt` : Texte alternatif

**Exemple :**
```jsx
import UserAvatar from '@/components/common/UserAvatar';

<UserAvatar user={profile} size="lg" className="ring-2 ring-emerald-500" />
```

### 3. Page "Mon compte" (`src/pages/admin/MonCompte.jsx`)

**Design :**
- ✅ Style moderne niveau SaaS
- ✅ Cartes blanches avec ombres légères
- ✅ Espacements généreux
- ✅ Typographie claire
- ✅ Responsive (mobile/desktop)

**Fonctionnalités :**
- ✅ Upload de photo avec compression automatique (800x800px, qualité 80%)
- ✅ Stockage dans Supabase Storage (`avatars/{user.id}/{timestamp}.ext`)
- ✅ Champs : Prénom, Nom, Email (lecture seule), Téléphone, Fonction/Poste
- ✅ États de chargement, succès et erreur
- ✅ Validation des champs obligatoires
- ✅ Mise à jour réactive via `UserContext`

**Routes :**
- `/admin/mon-compte` (principale)
- `/admin/account` (alias)

### 4. Propagation de l'avatar

**Sidebar (`src/components/admin/AdminSidebar.jsx`) :**
- ✅ Utilise `UserContext` et `UserAvatar`
- ✅ Bloc avatar cliquable vers `/admin/mon-compte`
- ✅ Mise à jour automatique

**Notes & Historique (`src/components/NotesTimeline.jsx`) :**
- ✅ Affiche les avatars des auteurs avec nom complet
- ✅ Stocke l'auteur en JSON avec toutes les infos
- ✅ Matching amélioré pour retrouver les utilisateurs

**Liste des Leads (`src/pages/admin/AdminLeads.jsx`) :**
- ✅ Affiche l'avatar du commercial assigné
- ✅ Utilise `UserAvatar` pour cohérence

### 5. Migration SQL (`migrations/20251201_add_avatar_url_to_utilisateurs.sql`)

**Fonctionnalités :**
- ✅ Ajoute la colonne `avatar_url` si elle n'existe pas
- ✅ Copie les données de `photo_profil_url` vers `avatar_url`
- ✅ Crée un index pour améliorer les performances
- ✅ Commentaire sur la colonne

**À exécuter dans Supabase SQL Editor :**
```sql
-- Voir le fichier migrations/20251201_add_avatar_url_to_utilisateurs.sql
```

## 🔧 Architecture technique

### Structure des fichiers

```
src/
├── contexts/
│   ├── UserContext.jsx          # Contexte global utilisateur
│   └── AuthContext.jsx           # Contexte auth (existant)
├── components/
│   ├── common/
│   │   └── UserAvatar.jsx        # Composant avatar réutilisable
│   ├── admin/
│   │   └── AdminSidebar.jsx      # Sidebar avec avatar cliquable
│   └── NotesTimeline.jsx         # Notes avec avatars
├── pages/
│   └── admin/
│       └── MonCompte.jsx         # Page "Mon compte"
├── migrations/
│   └── 20251201_add_avatar_url_to_utilisateurs.sql
└── main.jsx                      # Intégration UserProvider
```

### Flux de données

1. **Connexion utilisateur :**
   - `AuthContext` détecte la connexion
   - `UserProvider` charge le profil depuis `utilisateurs`
   - Le profil est disponible via `useUser()`

2. **Modification du profil :**
   - Utilisateur modifie son profil dans "Mon compte"
   - Upload de l'avatar dans Supabase Storage
   - Mise à jour dans la table `utilisateurs`
   - Appel de `refreshProfile()` du `UserContext`
   - Tous les composants utilisant `useUser()` se mettent à jour

3. **Affichage de l'avatar :**
   - Composants utilisent `UserAvatar` avec les données du `UserContext`
   - Si `photo_profil_url` ou `avatar_url` existe → affiche l'image
   - Sinon → affiche les initiales avec fond coloré

## 📝 Utilisation dans d'autres composants

### Exemple 1 : Afficher l'avatar de l'utilisateur connecté

```jsx
import { useUser } from '@/contexts/UserContext';
import UserAvatar from '@/components/common/UserAvatar';

const MyComponent = () => {
  const { profile } = useUser();
  
  return (
    <div>
      <UserAvatar user={profile} size="lg" />
      <p>{profile?.full_name}</p>
    </div>
  );
};
```

### Exemple 2 : Afficher l'avatar d'un utilisateur spécifique

```jsx
import UserAvatar from '@/components/common/UserAvatar';

const UserCard = ({ userId, userData }) => {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar user={userData} size="md" />
      <div>
        <p className="font-semibold">{userData.full_name}</p>
        <p className="text-sm text-gray-500">{userData.email}</p>
      </div>
    </div>
  );
};
```

### Exemple 3 : Mettre à jour le profil

```jsx
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabaseClient';

const UpdateProfile = () => {
  const { profile, refreshProfile } = useUser();
  
  const handleUpdate = async () => {
    await supabase
      .from('utilisateurs')
      .update({ prenom: 'Nouveau prénom' })
      .eq('id', profile.id);
    
    // Recharger le profil pour mettre à jour tous les composants
    await refreshProfile();
  };
  
  return <button onClick={handleUpdate}>Mettre à jour</button>;
};
```

## 🎨 Design & UX

### Couleurs
- Fond principal : `bg-slate-50` (#F3F4F6)
- Cartes : `bg-white` avec `border-slate-200`
- Boutons primaires : `bg-emerald-500 hover:bg-emerald-600`
- Texte principal : `text-slate-900`
- Texte secondaire : `text-slate-600`

### Espacements
- Padding des cartes : `p-6` (desktop), `p-4` (mobile)
- Gap entre éléments : `gap-4` ou `gap-6`
- Marges : `mb-6` pour les sections

### Responsive
- Mobile : cartes empilées, paddings réduits
- Desktop : largeur max `max-w-4xl`, centré

## 🔐 Sécurité

- ✅ Route protégée par `RequireAdmin` (authentification requise)
- ✅ Validation des champs obligatoires
- ✅ Sanitization des données avant sauvegarde
- ✅ Gestion d'erreurs complète
- ✅ Upload sécurisé dans Supabase Storage avec validation de type et taille

## 🚀 Prochaines améliorations (optionnel)

1. **Dashboard** : Ajouter les avatars dans les sections "Activité récente"
2. **Commentaires** : Utiliser `UserAvatar` pour les auteurs de commentaires
3. **Historique** : Afficher les avatars dans l'historique des actions
4. **Notifications** : Afficher les avatars dans les notifications

## ✅ Checklist de validation

- [x] UserContext créé et fonctionnel
- [x] Composant UserAvatar réutilisable
- [x] Page MonCompte avec design moderne
- [x] Upload d'avatar avec compression
- [x] Stockage dans Supabase Storage
- [x] Sidebar avec avatar cliquable
- [x] Propagation dans Notes & Historique
- [x] Propagation dans liste des Leads
- [x] Routes configurées (`/admin/mon-compte` et `/admin/account`)
- [x] Mise à jour réactive
- [x] Gestion d'erreurs
- [x] Responsive design
- [x] Migration SQL créée

## 📚 Références

- **UserContext** : `src/contexts/UserContext.jsx`
- **UserAvatar** : `src/components/common/UserAvatar.jsx`
- **MonCompte** : `src/pages/admin/MonCompte.jsx`
- **Migration SQL** : `migrations/20251201_add_avatar_url_to_utilisateurs.sql`

