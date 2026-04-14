# Guide de déploiement de la fonction Stripe

## Problème
La fonction Edge Function `create-stripe-checkout` doit être redéployée sur Supabase pour que les modifications prennent effet.

## Solution : Redéployer la fonction

### Option 1 : Via Supabase Dashboard (Recommandé)

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Edge Functions** (menu de gauche)
4. Trouvez la fonction `create-stripe-checkout`
5. Cliquez sur **Deploy** ou **Redeploy**

### Option 2 : Via Supabase CLI

```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier le projet (si pas déjà fait)
supabase link --project-ref votre-project-ref

# Déployer la fonction
supabase functions deploy create-stripe-checkout
```

### Option 3 : Via l'interface Supabase

1. Allez dans **Edge Functions** > **create-stripe-checkout**
2. Cliquez sur **Edit**
3. Copiez-collez le contenu de `supabase/functions/create-stripe-checkout/index.ts`
4. Cliquez sur **Deploy**

## Vérification

Après le déploiement, testez un paiement et vérifiez dans les logs Supabase que :
- L'URL détectée est correcte (pas `groupe-effinor.fr` si vous êtes en local)
- Les URLs `success_url` et `cancel_url` pointent vers votre site

## Logs à vérifier

Dans les logs de la fonction Edge Function, vous devriez voir :
```
[create-stripe-checkout] URL finale utilisée: http://localhost:3000
[create-stripe-checkout] URLs de redirection: { success_url: "...", cancel_url: "..." }
```




















