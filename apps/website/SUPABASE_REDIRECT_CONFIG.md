# Configuration des URLs de redirection Supabase

## 🎯 Problème résolu

L'invitation d'utilisateur générait des erreurs `otp_expired` car la redirection pointait vers la page d'accueil au lieu de `/auth/callback`.

## ✅ Solution implémentée

### 1. Edge Function `create-user` mise à jour

L'Edge Function inclut maintenant `redirectTo` qui pointe vers `/auth/callback` :

```typescript
const redirectTo = `${SITE_URL}/auth/callback?type=invite`;
await adminClient.auth.admin.inviteUserByEmail(email, {
  redirectTo,
  // ...
});
```

### 2. Route `/auth/callback` existante

La route est déjà configurée dans `src/App.jsx` :

```jsx
<Route path="/auth/callback" element={<AuthCallback />} />
```

### 3. URLs à configurer dans Supabase Dashboard

⚠️ **IMPORTANT** : Vous devez configurer ces URLs dans votre dashboard Supabase :

#### 📍 Dans Supabase Dashboard → Authentication → URL Configuration

**Site URL :**
```
https://groupe-effinor.fr
```

**Redirect URLs :** (ajoutez tous ces URLs)

```
https://groupe-effinor.fr/auth/callback
https://groupe-effinor.fr/create-password
https://groupe-effinor.fr/reset-password
https://groupe-effinor.fr/*
```

⚠️ **Note importante :**
- Le wildcard `/*` n'est pas suffisant pour les flows critiques (invite, reset)
- Supabase exige des URLs explicites pour ces flows
- Ajoutez donc toutes les URLs listées ci-dessus

### 4. Variable d'environnement SITE_URL

Pour la production, ajoutez la variable `SITE_URL` dans les secrets de l'Edge Function :

```bash
supabase secrets set SITE_URL=https://groupe-effinor.fr
```

En développement, elle sera automatiquement détectée depuis `supabase/config.toml`.

## 🔄 Flux d'invitation corrigé

1. Admin crée un utilisateur via `/admin/users/new`
2. Edge Function `create-user` est appelée
3. `inviteUserByEmail` est appelé avec `redirectTo: https://groupe-effinor.fr/auth/callback?type=invite`
4. Email d'invitation envoyé avec le lien correct
5. Utilisateur clique sur le lien → redirigé vers `/auth/callback`
6. `AuthCallback` détecte `type=invite` et affiche le formulaire de mot de passe
7. Après définition du mot de passe → redirection vers `/admin/dashboard`

## ✅ Checklist de vérification

- [x] Edge Function `create-user` utilise `redirectTo`
- [x] Route `/auth/callback` existe dans App.jsx
- [x] `AuthCallback` gère correctement `type=invite`
- [ ] **À FAIRE** : Configurer les Redirect URLs dans Supabase Dashboard
- [ ] **À FAIRE** : Ajouter `SITE_URL` dans les secrets Edge Function (production)

## 📝 Templates d'email

Les templates d'email Supabase utilisent automatiquement la variable `redirectTo` passée à `inviteUserByEmail`, donc pas besoin de modifier les templates.

Cependant, si vous voulez personnaliser les emails, vous pouvez utiliser :

```html
<a href="{{ .ConfirmationURL }}">Accepter l'invitation</a>
```

Le `{{ .ConfirmationURL }}` contiendra automatiquement le bon `redirectTo`.

## 🐛 Debug

Si vous rencontrez encore des erreurs `otp_expired` :

1. Vérifiez que les Redirect URLs sont bien configurées dans Supabase Dashboard
2. Vérifiez que `SITE_URL` est défini dans les secrets Edge Function
3. Vérifiez les logs de l'Edge Function pour voir quelle URL est utilisée
4. Vérifiez que la route `/auth/callback` est accessible sur votre site



























