# 🔧 Guide de correction : Leads assignés aux commerciaux

## Problème identifié

1. **Erreur de foreign key** : La table `notifications` a une foreign key qui pointe vers `auth.users` au lieu de `utilisateurs`
2. **Aucun lead assigné** : Aucun lead n'a de `commercial_assigne_id` défini

## Solution en 3 étapes

### Étape 1 : Corriger la foreign key (OBLIGATOIRE)

Exécutez dans Supabase SQL Editor :

```sql
-- Fichier: migrations/20251202_fix_notifications_foreign_key.sql
```

Cette migration :
- Supprime l'ancienne foreign key vers `auth.users`
- Crée une nouvelle foreign key vers `utilisateurs`
- Permet aux notifications de fonctionner correctement

### Étape 2 : S'assurer que la colonne existe

Exécutez dans Supabase SQL Editor :

```sql
-- Fichier: migrations/20251202_ensure_commercial_assigne_id_in_leads.sql
```

Cette migration :
- Ajoute la colonne `commercial_assigne_id` si elle n'existe pas
- Crée un index pour les performances

### Étape 3 : Assigner des leads (POUR TESTER)

Exécutez dans Supabase SQL Editor :

```sql
-- Fichier: migrations/20251202_quick_assign_leads.sql
```

**⚠️ IMPORTANT** : Modifiez l'email dans le script (ligne avec `'koutmoufdi@gmail.com'`) pour mettre l'email de votre commercial.

Cette migration :
- Trouve le commercial par email
- Assign les 10 premiers leads non assignés
- Affiche un résumé des leads assignés

## Vérification

Après avoir exécuté les 3 migrations, vérifiez :

1. **Dans Supabase Table Editor** → `leads` :
   - Vérifiez que certains leads ont un `commercial_assigne_id` défini

2. **Dans l'interface admin** :
   - Connectez-vous en tant que commercial
   - Allez sur `/commercial/leads`
   - Les leads assignés devraient apparaître

3. **Dans la console du navigateur** :
   - Les logs devraient montrer : `[AdminLeads] Loaded leads: {count: X, total: X}` avec X > 0

## Si ça ne fonctionne toujours pas

1. Vérifiez que vous êtes bien connecté avec le bon compte (celui avec `role_slug = 'commercial'`)
2. Vérifiez dans Supabase que des leads ont bien `commercial_assigne_id = votre_id`
3. Vérifiez les logs de la console pour voir les erreurs éventuelles



















