# Configuration de l'API Sirene INSEE

## ⚠️ Mise à jour importante

**Nous utilisons maintenant une fonction SQL PostgreSQL au lieu d'une Edge Function.**

Consultez **[SIRENE_SQL_SETUP.md](./SIRENE_SQL_SETUP.md)** pour les instructions de configuration avec la fonction SQL.

---

## Ancienne approche (Edge Function) - ⚠️ DÉPRÉCIÉE

L'ancienne approche utilisant une Supabase Edge Function a été remplacée par une solution SQL plus simple et plus maintenable.

### Pourquoi cette migration ?

- ✅ Plus simple à déployer (pas besoin de déployer de Edge Function)
- ✅ Gestion centralisée dans la base de données
- ✅ Utilisation de l'extension `pg_net` déjà disponible dans Supabase
- ✅ Pas de problème CORS (appels faits côté serveur)

### Ancienne solution (pour référence)

Une Supabase Edge Function avait été créée dans `supabase/functions/fetch-sirene-data/index.ts`. Cette fonction :
- Fait les appels à l'API Sirene INSEE côté serveur (pas de problème CORS)
- Récupère l'unité légale par SIREN
- Récupère l'établissement siège par SIRET (si disponible)
- Retourne les données mappées au format attendu par le frontend

## Étapes de déploiement

### 1. Installer Supabase CLI (si pas déjà fait)

```bash
npm install -g supabase
```

### 2. Se connecter à Supabase

```bash
supabase login
```

### 3. Lier le projet

```bash
supabase link --project-ref votre-project-ref
```

### 4. Configurer le secret SIRENE_API_TOKEN

Vous devez configurer le token OAuth2 de l'API Sirene INSEE comme secret Supabase :

```bash
supabase secrets set SIRENE_API_TOKEN=votre_token_oauth2_sirene
```

**Important** : Obtenez votre token OAuth2 sur https://portail-api.insee.fr/ après avoir :
1. Créé un compte
2. Souscrit à l'API Sirene dans le catalogue
3. Généré un token OAuth2 dans votre espace

### 5. Déployer la Edge Function

```bash
supabase functions deploy fetch-sirene-data
```

### 6. Tester la fonction

Vous pouvez tester la fonction localement :

```bash
supabase functions serve fetch-sirene-data
```

Puis tester avec curl :

```bash
curl -X POST http://localhost:54321/functions/v1/fetch-sirene-data \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"siren": "907547665"}'
```

## Configuration du frontend

Le frontend utilise maintenant automatiquement la Edge Function via `supabase.functions.invoke('fetch-sirene-data')`. Aucune configuration supplémentaire n'est nécessaire côté frontend.

## Vérification

Une fois la fonction déployée et le secret configuré, le bouton "Récupérer" dans la section "Société" du détail d'un lead devrait fonctionner sans erreur CORS.

## Dépannage

### Erreur "Edge Function not found"
- Vérifiez que la fonction est bien déployée : `supabase functions list`
- Vérifiez que vous êtes bien connecté : `supabase projects list`

### Erreur "SIRENE_API_TOKEN not configured"
- Vérifiez que le secret est bien configuré : `supabase secrets list`
- Configurez-le avec : `supabase secrets set SIRENE_API_TOKEN=votre_token`

### Erreur "401 Unauthorized"
- Vérifiez que votre token OAuth2 est valide
- Régénérez un nouveau token sur https://portail-api.insee.fr/

### Erreur "429 Too Many Requests"
- L'API Sirene limite à 30 requêtes par minute
- Attendez quelques instants avant de réessayer

## Notes

- La Edge Function gère automatiquement les erreurs CORS avec les headers appropriés
- Les données sont mappées au format attendu par le composant frontend
- Si l'établissement siège ne peut pas être récupéré, les données de l'unité légale sont quand même retournées

