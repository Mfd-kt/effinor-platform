# Archive - Anciennes migrations notifications (obsolètes)

**Date :** 2025-12-01  
**Raison :** Remplacées par `20251201_notifications_system.sql`

## Fichiers obsolètes

Ces migrations ont été remplacées par une migration unique et propre :

- ❌ `migrations/20251201_create_notifications_system.sql` - Première version, schéma incomplet
- ❌ `migrations/20251201_normalize_notifications_system.sql` - Version de normalisation, mais trop complexe

## Migration actuelle

✅ **`migrations/20251201_notifications_system.sql`** - Version finale, propre et complète

## Action recommandée

**Ne pas exécuter** les anciennes migrations. Utiliser uniquement `20251201_notifications_system.sql`.

Si vous avez déjà exécuté les anciennes migrations, la nouvelle migration :
- Sauvegarde automatiquement les données existantes
- Migre les colonnes vers le nouveau schéma
- Supprime les anciens triggers et policies
- Recrée tout proprement



















