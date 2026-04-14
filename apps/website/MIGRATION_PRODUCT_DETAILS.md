# Migration : Ajout des champs de détails produits

## ⚠️ Problème actuel

Lors de la sauvegarde d'un produit, vous recevez l'erreur :
```
Could not find the 'angle_faisceau' column of 'products' in the schema cache
```

Cela signifie que les nouvelles colonnes n'existent pas encore dans votre base de données Supabase.

## ✅ Solution : Exécuter la migration SQL

### Étapes :

1. **Ouvrez Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Accédez au SQL Editor**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Cliquez sur "New query"

3. **Copiez-collez le script de migration**
   - Ouvrez le fichier : `migrations/20251128_add_product_details_fields.sql`
   - Copiez tout le contenu
   - Collez-le dans l'éditeur SQL de Supabase

4. **Exécutez le script**
   - Cliquez sur le bouton "RUN" (ou appuyez sur `Cmd+Enter` / `Ctrl+Enter`)
   - Attendez la confirmation "Success. No rows returned"

5. **Vérifiez que les colonnes ont été créées**
   - Allez dans "Table Editor" > "products"
   - Vérifiez que les nouvelles colonnes apparaissent :
     - `materiaux`
     - `temperature_couleur`
     - `indice_rendu_couleurs`
     - `commande_controle`
     - `tension_entree`
     - `angle_faisceau`
     - `protection`
     - `installation`
     - `dimensions`
     - `poids_net`

## 📋 Contenu de la migration

La migration ajoute 10 nouvelles colonnes de type TEXT à la table `products` :

```sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS materiaux TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS temperature_couleur TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS indice_rendu_couleurs TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS commande_controle TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS tension_entree TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS angle_faisceau TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS protection TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS installation TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS dimensions TEXT;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS poids_net TEXT;
```

## 🔄 Après la migration

Une fois la migration exécutée :
- ✅ Vous pourrez sauvegarder des produits avec tous les nouveaux champs
- ✅ Les champs seront visibles dans le formulaire admin
- ✅ Les champs seront affichés sur la page produit publique

## 💡 Note

Le code a été modifié pour gérer automatiquement l'absence de ces colonnes :
- Si les colonnes n'existent pas, le produit sera sauvegardé sans ces champs
- Un message d'avertissement vous indiquera d'exécuter la migration
- Une fois la migration exécutée, les champs fonctionneront normalement




















