# 🚀 Déploiement de l'Edge Function create-lead-and-redirect

## Prérequis

- Supabase CLI installé
- Projet Supabase lié

## Déploiement

### 1. Installer Supabase CLI (si nécessaire)

```bash
npm install -g supabase
```

### 2. Se connecter à Supabase

```bash
supabase login
```

### 3. Lier le projet (si pas déjà fait)

```bash
cd /Users/mfd/Projects/ecps-effinor
supabase link --project-ref erjgptxkctrfszrzhoxa
```

### 4. Déployer la fonction

```bash
supabase functions deploy create-lead-and-redirect
```

### 5. Vérifier le déploiement

La fonction sera accessible à :
```
https://erjgptxkctrfszrzhoxa.supabase.co/functions/v1/create-lead-and-redirect
```

## Test

### Via le Dashboard Supabase

1. Allez dans **Edge Functions** > **create-lead-and-redirect**
2. Cliquez sur **Invoke**
3. Utilisez ce body de test :

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "0123456789",
  "company": "Test Company",
  "buildingType": "Bureau",
  "surfaceArea": "100-500",
  "postalCode": "75001",
  "landing": "landing_luminaire_exterieur"
}
```

### Réponse attendue

```json
{
  "success": true,
  "leadId": "uuid-du-lead",
  "redirectUrl": "https://groupe-effinor.fr/formulaire-complet?leadId=...&prenom=Test&nom=User&..."
}
```

## Variables d'environnement

Les variables suivantes sont **automatiquement disponibles** dans les Edge Functions Supabase :
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅

**Aucune configuration supplémentaire nécessaire.**

## Notes

- La fonction utilise `service_role` pour bypass RLS
- L'URL de redirection est générée avec tous les paramètres nécessaires
- Compatible avec toutes les landing pages (passez le paramètre `landing`)

---

**Date** : 2025-01-12

