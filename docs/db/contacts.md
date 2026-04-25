# Table : contacts

> Migration : `20260425170000_create_contacts_table.sql`

## But
Stocker les demandes de contact issues des formulaires publics du site vitrine et des landing pages.

**À ne pas confondre avec `leads`** : la table `leads` concerne les prospects qualifiés ayant un projet CEE concret (workflow 0-8). La table `contacts` concerne les demandes générales (informations, devis non qualifiés, partenariats, etc.).

## Sources possibles (`source`)
- `website_form` : formulaire de contact du site principal effinor.fr
- `landing_pac` : landing page PAC
- `landing_reno_global` : landing page Rénovation Globale
- `api` : intégration externe

## Workflow de traitement
1. Création (`new`) via formulaire public (RLS : INSERT anon autorisé)
2. Lecture par staff (`read`)
3. Réponse envoyée (`replied`) → `replied_at` auto-rempli
4. Archivage (`archived`) ou marquage spam (`spam`)

## Rôles autorisés (RLS)
| Rôle | INSERT | SELECT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| `anon` (public) | ✅ | ❌ | ❌ | ❌ |
| `super_admin` | ✅ | ✅ | ✅ | ✅ |
| `admin`, `daf`, `admin_agent` | ✅ | ✅ | ✅ | ❌ |
| Autres | ❌ | ❌ | ❌ | ❌ |

## Triggers
- `trg_contacts_updated_at` : met à jour `updated_at` automatiquement
- `trg_contacts_replied_at` : met à jour `replied_at` quand `status` passe à `replied`

## Indexes
- `created_at DESC` (tri par date dans l'admin)
- `status` (filtrage par statut)
- `assigned_to` (charge par utilisateur)
- `lower(email)` (recherche email insensible casse)
- `source` (analytics par source)