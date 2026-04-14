# Migration des Statuts Leads vers Système Dynamique

## 📋 Résumé

Cette migration transforme le système de statuts des leads d'un système basé sur texte (colonne `statut` TEXT) vers un système dynamique utilisant la table `lead_statuses` via une foreign key (`status_id` UUID).

## ✅ Implémentation réalisée

### A. Migration Base de Données

**Fichier SQL :** `migrations/add_lead_status_id_migration.sql`

1. ✅ **Ajout de la colonne `status_id`** (UUID, nullable au début)
2. ✅ **Création de la foreign key** vers `lead_statuses(id)`
3. ✅ **Validation du statut par défaut** (`NOUVEAU` avec `is_default=true`)
4. ✅ **Backfill intelligent des données existantes** :
   - Mapping par `code` (majuscules) en priorité
   - Mapping par `label` (cas insensible)
   - Mapping normalisé par slug/snake_case
   - Priorité aux codes en majuscules (structure principale avec `lead_count>0`)
5. ✅ **Synchronisation de la colonne texte** `statut` avec `status.label`
6. ✅ **Trigger automatique** pour maintenir la synchronisation
7. ✅ **Index de performance** sur `status_id`
8. ✅ **Création de la table `leads_events`** pour logger les changements

### B. Adaptation de l'API (`src/lib/api/leads.js`)

#### 1. ✅ Fonctions utilitaires créées

- `getDefaultStatusId()` : Récupère le statut par défaut (priorité à `NOUVEAU`)
- `getStatusIdFromSlugOrLabel(slugOrLabel)` : Convertit un code/label en `status_id`
  - Support des codes majuscules (`NOUVEAU`, `QUALIFICATION`)
  - Support des slugs snake_case (`nouveau_lead`, `qualification_en_cours`)
  - Support des labels (`"Nouveau lead"`, `"Qualification en cours"`)
- `logLeadStatusChange(leadId, oldStatusId, newStatusId, userId)` : Log dans `leads_events`

#### 2. ✅ `getAllLeads()` - Modifié

- ✅ Jointure avec `lead_statuses` pour récupérer les données de statut
- ✅ Support du filtrage par `status_id` (UUID) ou `statut` (code/label) pour compatibilité
- ✅ Retourne un objet `status` enrichi avec chaque lead (code, label, color, pipeline_order, etc.)

#### 3. ✅ `getLeadById()` - Modifié

- ✅ Jointure avec `lead_statuses`
- ✅ Retourne l'objet `status` complet avec code, pipeline_order, is_won, is_lost, is_closed

#### 4. ✅ `createLead()` - Modifié

- ✅ Utilise `status_id` si fourni
- ✅ Convertit automatiquement `statut` (code/label) en `status_id`
- ✅ Utilise le statut par défaut (`NOUVEAU`) si aucun statut n'est fourni
- ✅ Synchronise automatiquement la colonne texte `statut` avec `status.label`
- ✅ Retourne le lead avec l'objet `status` enrichi

#### 5. ✅ `updateLead()` - Modifié

- ✅ Détection automatique des changements de `status_id`
- ✅ Synchronisation de la colonne texte `statut` avec le nouveau statut
- ✅ Log automatique dans `leads_events` si `status_id` change
- ✅ Retourne le lead avec l'objet `status` enrichi

#### 6. ✅ `changeLeadStatus()` - Réécrit

- ✅ Accepte `status_id` (UUID) ou code (`'NOUVEAU'`, `'nouveau_lead'`) ou label
- ✅ Conversion automatique code/label → `status_id`
- ✅ Priorité aux codes majuscules (structure principale)
- ✅ Log dans `leads_events` avec ancien/nouveau statut
- ✅ Synchronisation automatique de la colonne texte
- ✅ Retourne le lead avec l'objet `status` enrichi

### C. Support de la structure réelle `lead_statuses`

La table `lead_statuses` utilise :
- **`code`** (ex: `'NOUVEAU'`, `'QUALIFICATION'`, `'nouveau_lead'`) - **source de vérité principale**
- **`slug`** (optionnel, snake_case)
- **`pipeline_order`** (au lieu de `order_index` dans certains cas)
- **`is_won`**, **`is_lost`**, **`is_closed`** (métadonnées de pipeline)
- **`lead_count`** (compteur de leads par statut)

L'API supporte maintenant les deux colonnes (`code` et `slug`) et priorise `code` en majuscules.

## 📁 Fichiers modifiés

1. **`migrations/add_lead_status_id_migration.sql`** (nouveau)
   - Script SQL complet pour la migration
   - Backfill intelligent des données (mapping par code, label, slug)
   - Création de la table `leads_events`
   - Triggers et index

2. **`src/lib/api/leads.js`** (modifié)
   - Intégration des statuts dynamiques
   - Support des codes majuscules et slugs snake_case
   - Fonctions utilitaires pour conversion code→status_id
   - Logging des changements

3. **`src/lib/api/statuses.js`** (modifié)
   - Support de `pipeline_order` en plus de `order_index`
   - Support de `code` en plus de `slug`

## 🔄 Compatibilité rétroactive

- ✅ La colonne texte `statut` est **conservée** pour compatibilité
- ✅ Les anciennes requêtes filtrant par `statut` (texte) continuent de fonctionner
- ✅ Le trigger maintient automatiquement la synchronisation `status_id` ↔ `statut`
- ✅ Les fonctions API acceptent les deux formats (UUID, code majuscule, slug snake_case, label)
- ✅ Priorité aux codes majuscules (structure principale avec `lead_count>0`)

## 📝 À faire dans Supabase

### Étape 1 : Exécuter la migration SQL

1. Ouvrir le **SQL Editor** dans Supabase Dashboard
2. Copier le contenu de `migrations/add_lead_status_id_migration.sql`
3. Exécuter le script
4. Vérifier les résultats des requêtes de validation à la fin du script

### Étape 2 : Vérifier les statuts

Vérifier que le statut `NOUVEAU` existe et est marqué comme par défaut :
```sql
SELECT * FROM lead_statuses WHERE code = 'NOUVEAU' OR is_default = true;
```

Si plusieurs statuts avec `code = 'NOUVEAU'`, prioriser celui avec `is_default = true` et `lead_count = 23`.

### Étape 3 : Vérifier le backfill

Vérifier que tous les leads ont un `status_id` :
```sql
SELECT 
  COUNT(*) as total,
  COUNT(status_id) as avec_status_id,
  COUNT(*) - COUNT(status_id) as sans_status_id
FROM leads;
```

Si `sans_status_id > 0`, réexécuter la partie backfill du script.

### Étape 4 : Vérifier le mapping

Vérifier que les statuts texte ont été correctement mappés :
```sql
SELECT 
  l.statut as statut_texte,
  ls.code,
  ls.label,
  COUNT(*) as count
FROM leads l
JOIN lead_statuses ls ON l.status_id = ls.id
GROUP BY l.statut, ls.code, ls.label
ORDER BY count DESC;
```

### Étape 5 (optionnel) : Nettoyer les doublons

Si vous avez des statuts en double (ex: `NOUVEAU` et `nouveau_lead`), vous pouvez :
1. Conserver les codes en majuscules (`NOUVEAU`, `QUALIFICATION`, etc.)
2. Désactiver ou supprimer les doublons en minuscules
3. Mettre à jour `is_default = true` sur le statut principal

Exemple :
```sql
-- Marquer les doublons (codes en minuscules) comme inactifs
UPDATE lead_statuses
SET is_active = false
WHERE code ~ '^[a-z_]'
AND code IN (SELECT LOWER(code) FROM lead_statuses WHERE code ~ '^[A-Z_]+');
```

### Étape 6 (optionnel) : Rendre `status_id` NOT NULL

Une fois que tous les leads ont un `status_id`, décommenter dans le script :
```sql
ALTER TABLE leads ALTER COLUMN status_id SET NOT NULL;
```

## 🔍 Tests à effectuer

1. ✅ **Créer un lead** sans statut → doit utiliser le statut par défaut (`NOUVEAU`)
2. ✅ **Créer un lead** avec `status_id` → doit utiliser ce statut
3. ✅ **Créer un lead** avec `statut` (code) → doit convertir en `status_id`
4. ✅ **Changer le statut** d'un lead par code (`'NOUVEAU'`, `'QUALIFICATION'`) → doit fonctionner
5. ✅ **Changer le statut** d'un lead par slug (`'nouveau_lead'`) → doit fonctionner
6. ✅ **Filtrer les leads** par `status_id` → doit fonctionner
7. ✅ **Filtrer les leads** par `statut` (texte) → doit fonctionner (backward compatibility)
8. ✅ **Lister les leads** → doit afficher l'objet `status` enrichi avec code, color, pipeline_order

## ⚠️ Notes importantes

1. **La colonne texte `statut` est conservée** pour compatibilité avec le code existant
2. **Le trigger maintient la synchronisation** automatiquement entre `status_id` et `statut` (texte)
3. **`status_id` est maintenant la source de vérité** pour les statuts
4. **Priorité aux codes majuscules** (`NOUVEAU`, `QUALIFICATION`) car ce sont les statuts principaux
5. **Pour supprimer l'ancienne colonne `statut` dans le futur** : `ALTER TABLE leads DROP COLUMN statut;`
6. **Les policies RLS doivent être vérifiées** si elles filtrent sur `statut` (texte)`

## 🎯 Prochaines étapes (optionnel)

1. **Adapter les composants UI** pour utiliser `status_id` directement
   - Modifier `LeadsTableFilters` pour charger les statuts depuis `lead_statuses`
   - Modifier `LeadSidebar` pour afficher les statuts dynamiques
   - Supprimer la constante `LEAD_STATUSES` hardcodée

2. **Mettre à jour `getLeadStats()`** pour utiliser `status_id` au lieu de filtrer par texte

3. **Adapter le mapping dans la migration** pour gérer les doublons si nécessaire

4. **Créer une vue ou fonction SQL** pour simplifier les requêtes de statuts

## 📚 Références

- Module Réglages : `/admin/settings/lead-statuses`
- API Statuses : `src/lib/api/statuses.js`
- API Leads : `src/lib/api/leads.js`
- Structure réelle : Voir JSON fourni par l'utilisateur (codes majuscules + snake_case)

## 🗂️ Structure des statuts dans lead_statuses

D'après les données fournies, la table `lead_statuses` contient :

### Codes en majuscules (structure principale) :
- `NOUVEAU` (is_default=true, lead_count=23)
- `QUALIFICATION`
- `DONNEES_RECUES`
- `ETUDE`
- `DEVIS_ENVOYE`
- `DEVIS_SIGNE` (is_won=true, is_closed=true)
- `HORS_CIBLE` (is_lost=true, is_closed=true)
- `CLOTURE` (is_won=true, is_closed=true)

### Codes en minuscules/snake_case (doublons à nettoyer) :
- `nouveau_lead`
- `qualification_en_cours`
- `donnees_recues`
- `etude_en_cours`
- `devis_envoye`
- `devis_signe`
- `hors_cible_annule`
- `cloture`

**Recommandation** : Conserver les codes en majuscules et désactiver les doublons en minuscules une fois la migration validée.
