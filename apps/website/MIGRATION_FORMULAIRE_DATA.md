# Migration : Ajout de la colonne formulaire_data (JSONB)

## 📋 Objectif

Ajouter la colonne `formulaire_data` de type JSONB à la table `leads` pour stocker toutes les données du formulaire, notamment les bâtiments dans un format JSON structuré.

## 🚀 Instructions d'exécution

### Option 1 : Utiliser le script de migration (Recommandé)

1. **Ouvrez Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Ouvrez le SQL Editor**
   - Dans le menu de gauche, cliquez sur "SQL Editor"

3. **Exécutez la migration**
   - Ouvrez le fichier : `migrations/20260112_add_formulaire_data_column.sql`
   - Copiez tout le contenu
   - Collez-le dans le SQL Editor
   - Cliquez sur "RUN" ou appuyez sur `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)

### Option 2 : Utiliser le script simple

Si vous préférez un script plus simple, utilisez le fichier :
- `ADD_FORMULAIRE_DATA_COLUMN.sql`

## ✅ Vérification

Après l'exécution, vérifiez que la colonne a été créée :

```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'formulaire_data';
```

Vous devriez voir :
- `column_name`: `formulaire_data`
- `data_type`: `jsonb`
- `column_default`: `'{}'::jsonb`

Vérifiez aussi que les index ont été créés :

```sql
-- Vérifier les index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'leads' AND indexname LIKE '%formulaire_data%';
```

Vous devriez voir deux index :
- `idx_leads_formulaire_data` (index GIN principal)
- `idx_leads_formulaire_data_buildings` (index GIN pour les bâtiments)

## 📊 Structure JSON attendue

La colonne `formulaire_data` stockera les données au format suivant :

```json
{
  "buildings": [
    {
      "type": "warehouse",
      "surface": 1000,
      "ceilingHeight": 5,
      "heating": true,
      "heatingMode": "gas",
      "heatingPower": "100",
      "heatingSetpoint": "19",
      "interiorLighting": {
        "neon": {
          "enabled": true,
          "quantity": "10",
          "powerPerUnit": "58"
        },
        "doubleNeon": {
          "enabled": false,
          "quantity": "",
          "powerPerUnit": ""
        },
        "halogen": {
          "enabled": false,
          "quantity": "",
          "powerPerUnit": ""
        }
      },
      "exteriorLighting": {
        "changedByCEE": false,
        "type": "Projecteurs halogènes",
        "quantity": "20"
      }
    }
  ],
  "technicalData": {
    "ceilingHeight": "5",
    "heating": true,
    "heatingMode": "gas",
    "heatingPower": "100",
    "heatingSetpoint": "19",
    "interiorLighting": {...}
  },
  "step1": {...},
  "step2": {...},
  ...
}
```

## 🔍 Requêtes SQL utiles

### Voir tous les bâtiments d'un lead

```sql
SELECT 
  id,
  nom,
  email,
  formulaire_data->'buildings' as buildings
FROM leads
WHERE formulaire_data->'buildings' IS NOT NULL
  AND jsonb_array_length(formulaire_data->'buildings') > 0;
```

### Compter les leads avec des bâtiments

```sql
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN formulaire_data->'buildings' IS NOT NULL 
    AND jsonb_array_length(formulaire_data->'buildings') > 0 
    THEN 1 END) as leads_with_buildings
FROM leads;
```

### Voir un lead spécifique avec ses bâtiments

```sql
SELECT 
  id,
  nom,
  email,
  formulaire_data->'buildings' as buildings,
  jsonb_array_length(formulaire_data->'buildings') as building_count
FROM leads
WHERE id = 'VOTRE_LEAD_ID';
```

## ⚠️ Notes importantes

1. **Sécurité** : Le script utilise `IF NOT EXISTS`, donc il est sûr de l'exécuter plusieurs fois
2. **Performance** : Les index GIN améliorent considérablement les performances des requêtes JSON
3. **Compatibilité** : La colonne `products` est conservée pour la compatibilité avec l'ancien système
4. **Migration des données** : Si vous avez des données existantes dans `products`, vous pouvez les migrer vers `formulaire_data` (voir section optionnelle dans le script)

## 🐛 Dépannage

### La colonne n'apparaît pas

1. Vérifiez que le script a été exécuté sans erreur
2. Rafraîchissez la page du Table Editor
3. Vérifiez les permissions RLS (Row Level Security)

### Erreur "column already exists"

C'est normal si la colonne existe déjà. Le script utilise `IF NOT EXISTS` donc il ne fera rien.

### Erreur de permissions

Assurez-vous d'être connecté avec un compte ayant les permissions d'administrateur sur Supabase.

## 📝 Fichiers concernés

- `migrations/20260112_add_formulaire_data_column.sql` - Migration complète
- `ADD_FORMULAIRE_DATA_COLUMN.sql` - Script simple
- `src/services/landing/luminaires/leadService.js` - Service qui utilise cette colonne
- `src/components/leads/LeadDetails/BuildingsSection.jsx` - Composant qui lit/écrit dans cette colonne

