# Politique d’injection lead generation (dispatch)

## Où vit la configuration

- **Table** : `public.lead_generation_dispatch_policy_config`  
  Une seule ligne utile, contrainte **`id = 1`** (singleton).
- **Lecture SQL** : fonction **`public.lead_generation_dispatch_policy()`**  
  Retourne la ligne active ou lève une exception si elle est absente (fail fast).
- **Lecture TypeScript** : **`getLeadGenerationDispatchPolicyConfig`** dans  
  `features/lead-generation/queries/get-lead-generation-dispatch-policy-config.ts`  
  (PostgREST sur la même table).

Les seuils ne doivent plus être dupliqués dans le code applicatif ni en dur dans les RPC cockpit : les fonctions **`lead_generation_cockpit_summary`**, **`lead_generation_cockpit_agent_rows`**, **`lead_generation_cockpit_dispatch_health`** les lisent via **`lead_generation_dispatch_policy()`** (ou équivalent en CTE `pol`).

## Paramètres (aperçu)

| Colonne (DB) | Rôle |
| --- | --- |
| `pipeline_backlog_suspend_threshold` | Suivi (contacted + follow_up) au-delà duquel l’injection est suspendue. |
| `sla_breached_suspend_threshold` | Nombre de SLA « breached » au-delà duquel l’injection est suspendue. |
| `breach_ratio_penalty_threshold` / `breach_ratio_bonus_threshold` | Seuils de ratio breached/pending pour pénalité ou bonus. |
| `min_pending_assignments_for_bonus` | Pending minimum pour activer le bonus. |
| `cap_multiplier_penalty` / `cap_multiplier_bonus` | Multiplicateurs de plafond. |
| `cap_base_per_cee_sheet` | Base du plafond avant bornes. |
| `effective_cap_min` / `effective_cap_max` | Plancher et plafond du plafond effectif (arrondi). |

Voir les `COMMENT ON COLUMN` sur la table pour le détail.

## Consommateurs

- **Dispatch réel** : `getLeadGenerationDispatchPolicy` +  
  `computeEffectiveLeadGenStockCap` dans `lib/agent-dispatch-policy.ts` ;  
  services comme `dispatch-lead-generation-stock.ts`.
- **Cockpit / RPC** : fonctions `lead_generation_cockpit_*` ci-dessus.
- **Mes fiches à traiter** : plafond affiché et bouton de récupération utilisent le **`effectiveStockCap`** issu de `getLeadGenerationDispatchPolicy` (aligné sur le dispatch).
- **Validation d’action** : taille max de chunk pour « récupérer un lot » bornée par `effective_cap_max` dans  
  `dispatch-lead-generation-my-queue-chunk-action.ts`.
- **Autres** : leaderboard performance, vue quantificateur CEE (`get-lead-generation-quantifier-cee-overview.ts`), etc.

## Modifier la policy sans divergence

1. Mettre à jour **uniquement** la ligne `id = 1` (migration SQL, script admin avec rôle adapté, ou `psql`).  
   Les écritures via l’API client ne sont pas exposées par défaut (pas de policy INSERT/UPDATE pour `authenticated`).
2. Redéployer / appliquer la migration si changement versionné.
3. Vérifier le **cockpit** et un **dispatch manuel** sur un compte test : les seuils et plafonds doivent rester alignés car TS et SQL lisent la même ligne.

## Comportement si la config manque

- **SQL** : `lead_generation_dispatch_policy()` lève une erreur explicite.
- **TS** : `getLeadGenerationDispatchPolicyConfig` lève une erreur ; pas de fallback silencieux sur d’anciennes constantes.

## Limites

- La **logique de calcul** (multiplicateur, suspension) reste implémentée en parallèle en SQL (RPC) et en TypeScript, mais avec **les mêmes paramètres** : toute évolution de formules doit être mise à jour des deux côtés ou extraite dans une couche partagée future.

## Dépannage (Supabase / SQL Editor)

- **`relation "lead_generation_dispatch_policy_config" already exists`** : la migration `20260430679000_...` est désormais **idempotente** (`CREATE TABLE IF NOT EXISTS`, `INSERT ... ON CONFLICT DO NOTHING`, `DROP POLICY` / `DROP TRIGGER IF EXISTS` avant recréation). Tu peux coller **tout** le fichier en production : la table existante est ignorée et le reste (fonctions, trigger, RPC) est mis à jour.
- **`structure of query does not match function result type` sur `lead_generation_cockpit_agent_rows`** : corrigé en alignant les types du `SELECT` sur le `RETURNS TABLE` (casts explicites `double precision` / `boolean` / `bigint`), voir migration `20260430679200_lead_generation_cockpit_agent_rows_type_fix.sql`.
