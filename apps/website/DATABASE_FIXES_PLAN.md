# 🔧 Plan de Correction - Base de Données ECPS/Effinor

## 🎯 RÉSUMÉ EXÉCUTIF

**37 opérations base de données analysées**  
**3 problèmes CRITIQUES identifiés**  
**5 problèmes IMPORTANTS identifiés**  
**4 problèmes MINEURS identifiés**

---

## 🔴 PHASE 1: CORRECTIONS CRITIQUES (À FAIRE IMMÉDIATEMENT)

### Fix #1: Unifier les Clients Supabase ✅

**Problème**: 3 fichiers clients différents créent de l'incohérence

**Fichiers à modifier**:
1. `src/pages/Boutique.jsx` - Remplacer import
2. `src/pages/Cart.jsx` - Remplacer import
3. `src/pages/ProductDetail.jsx` - Remplacer import
4. `src/pages/admin/AdminVisitors.jsx` - Remplacer import

**Fichiers à supprimer**:
- `src/lib/customSupabaseClient.js`
- `src/lib/supabase.js`

**Action**:
```javascript
// AVANT (dans chaque fichier)
import { supabase } from '@/lib/customSupabaseClient';
// ou
import { supabase } from '@/lib/supabase';

// APRÈS
import { supabase } from '@/lib/supabaseClient';
```

---

### Fix #2: Ajouter Sanitization ✅

**Problème**: Aucune sanitization avant INSERT/UPDATE (risque XSS)

**Étape 1**: Créer `src/utils/sanitize.js`
```javascript
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  if (!str) return '';
  return str.trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

export const sanitizeFormData = (data) => {
  if (!data || typeof data !== 'object') return data;
  const sanitized = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  });
  return sanitized;
};
```

**Étape 2**: Modifier `src/utils/formUtils.js`
```javascript
import { sanitizeFormData } from '@/utils/sanitize';

export const handleFormSubmission = async (formData) => {
  try {
    const sanitizedData = sanitizeFormData(formData); // AJOUTER ICI
    const { data, error } = await supabase
      .from('leads')
      .insert([sanitizedData]) // Utiliser sanitizedData
      // ...
  }
};
```

**Fichiers à modifier**:
- ✅ `src/utils/formUtils.js`
- ✅ `src/pages/Contact.jsx`
- ✅ `src/pages/CEEEligibilityForm.jsx`
- ✅ `src/pages/admin/AdminProductForm.jsx`
- ✅ `src/pages/admin/AdminUserForm.jsx`
- ✅ `src/pages/Cart.jsx`
- ✅ Tous les autres INSERT/UPDATE

---

### Fix #3: Corriger DELETE en Cascade ✅

**Problème**: Si le 2ème DELETE échoue, les notes sont supprimées mais le lead reste

**Solution Option 1: Vérification d'erreur** (Recommandé)
```javascript
// src/pages/admin/AdminLeads.jsx
const handleDeleteLead = async (leadId) => {
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce lead définitivement ?")) return;

  try {
    // Delete notes first
    const { error: notesError } = await supabase
      .from('leads_notes')
      .delete()
      .eq('lead_id', leadId);
      
    if (notesError) {
      throw new Error(`Erreur lors de la suppression des notes: ${notesError.message}`);
    }
    
    // Then delete lead
    const { error: leadError } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);
      
    if (leadError) throw leadError;

    setLeads(prev => prev.filter(lead => lead.id !== leadId));
    toast({ title: "Succès", description: "Lead supprimé." });
  } catch (error) {
    logger.error('Error deleting lead:', error);
    toast({ 
      title: "Erreur", 
      description: `Impossible de supprimer le lead: ${error.message}`, 
      variant: "destructive" 
    });
  }
};
```

**Solution Option 2: Trigger PostgreSQL** (Plus robuste)
```sql
-- Dans Supabase SQL Editor
CREATE OR REPLACE FUNCTION delete_lead_cascade()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM leads_notes WHERE lead_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_delete_lead
BEFORE DELETE ON leads
FOR EACH ROW
EXECUTE FUNCTION delete_lead_cascade();
```

**Fichiers à modifier**:
- `src/pages/admin/AdminLeads.jsx`
- `src/pages/admin/AdminLeadDetail.jsx`

---

## 🟠 PHASE 2: CORRECTIONS IMPORTANTES (Cette semaine)

### Fix #4: Ajouter Pagination

**Fichiers à modifier**:
- `src/pages/admin/AdminLeads.jsx`
- `src/pages/admin/AdminProducts.jsx`
- `src/pages/admin/AdminOrders.jsx`

**Pattern à implémenter**:
```javascript
const [page, setPage] = useState(0);
const [pageSize] = useState(20);
const [totalCount, setTotalCount] = useState(0);

const fetchLeads = async () => {
  const { data, error, count } = await supabase
    .from('leads')
    .select('id, nom, email, created_at, statut, source', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  
  setLeads(data);
  setTotalCount(count);
};
```

---

### Fix #5: Optimiser select('*')

**Remplacer dans**:
- `AdminLeads.jsx`: `select('id, nom, email, created_at, statut, source')`
- `AdminProducts.jsx`: `select('id, nom, description, prix, actif, categorie')`
- `AdminLeadDetail.jsx`: Garder `select('*')` si toutes les colonnes sont nécessaires
- `Boutique.jsx`: `select('id, nom, description, prix, image_1, slug, actif, categorie')`

---

### Fix #6: Corriger Contact.jsx

**Problème**: Pas de récupération de l'ID après insert

**Solution**:
```javascript
const { data, error } = await supabase
  .from('leads')
  .insert([{...}])
  .select('id') // AJOUTER
  .single(); // AJOUTER
```

---

### Fix #7: Corriger Cart.jsx

**Problème**: Pas de création dans `commandes_lignes`

**Solution**:
```javascript
// Après création de la commande
const { data: orderData, error: orderError } = await supabase
  .from('commandes')
  .insert([{...}])
  .select('id')
  .single();

if (orderError) throw orderError;

// Créer les lignes de commande
const lines = cart.map(item => ({
  commande_id: orderData.id,
  produit_id: item.id,
  quantite: item.quantity,
  prix_unitaire: item.prix || 0
}));

const { error: linesError } = await supabase
  .from('commandes_lignes')
  .insert(lines);

if (linesError) throw linesError;
```

---

## 🟡 PHASE 3: AMÉLIORATIONS MINEURES (Prochaine itération)

### Fix #8: Remplacer alert() par toast()

**Fichiers**:
- `src/pages/admin/AdminUserForm.jsx` ligne 128, 150

---

### Fix #9: Standardiser les messages d'erreur

**Tous les fichiers doivent avoir des messages cohérents**:
- Succès: "Opération réussie"
- Erreur: "Une erreur est survenue. Veuillez réessayer."

---

## 📊 STATISTIQUES

### Opérations par Type

| Type | Nombre | Problèmes |
|------|--------|-----------|
| SELECT | 16 | 8 avec select('*'), 0 avec pagination |
| INSERT | 9 | 9 sans sanitization |
| UPDATE | 6 | 6 sans sanitization |
| DELETE | 6 | 2 sans transaction |
| **TOTAL** | **37** | **25 problèmes** |

### Problèmes par Sévérité

| Sévérité | Nombre | Fixes Requis |
|----------|--------|--------------|
| 🔴 CRITIQUE | 3 | 3 fichiers à créer/modifier |
| 🟠 IMPORTANT | 5 | 8 fichiers à modifier |
| 🟡 MINEUR | 4 | 3 fichiers à modifier |

---

## ✅ CHECKLIST DE VÉRIFICATION

Avant de commiter:

- [ ] Tous les imports Supabase utilisent `supabaseClient.js`
- [ ] Sanitization ajoutée avant tous les INSERT/UPDATE
- [ ] DELETE en cascade corrigé (vérification ou trigger)
- [ ] Pagination ajoutée sur AdminLeads, AdminProducts, AdminOrders
- [ ] select('*') remplacé par colonnes spécifiques
- [ ] Contact.jsx récupère l'ID après insert
- [ ] Cart.jsx crée les lignes de commande
- [ ] Tous les alert() remplacés par toast()
- [ ] Tests manuels effectués sur chaque formulaire
- [ ] Pas de régression identifiée

---

## 📝 NOTES IMPORTANTES

1. **Backup**: Faire un backup de la base Supabase avant modifications
2. **Test**: Tester chaque correction dans un environnement de dev
3. **Migration**: Appliquer les corrections par phase
4. **RLS**: Vérifier que RLS est configuré dans Supabase Dashboard
5. **Indexes**: Vérifier les indexes sur colonnes fréquemment requêtées

---

## 📦 Migration adresse commandes (à exécuter dans Supabase)

```sql
alter table public.commandes
  add column if not exists adresse_ligne1 text,
  add column if not exists adresse_ligne2 text,
  add column if not exists pays text default 'France';
```

> Remarque :
> - Les anciennes commandes auront `adresse_ligne1` à NULL → le front/admin gère ce cas en n'affichant que code_postal + ville.
> - À terme, `adresse_ligne1` pourra être rendue NOT NULL côté base si nécessaire.

**Dernière mise à jour**: 2024-12-XX

