# Journal d’événements — pipeline commerciale (lead generation)

Table : `public.lead_generation_assignment_events`  
Vue d’aide aux KPI : `public.lead_generation_assignment_event_milestones`

## Types d’événements (`event_type`)

| Valeur | Déclencheur | Notes |
|--------|-------------|--------|
| `assigned` | Succès du RPC `dispatch_lead_generation_stock_claim` (via services dispatch) | Une ligne par assignation ; dédup index unique. `metadata_json.source`: `dispatch_lead_generation_stock_claim` |
| `first_contact` | Première sortie du statut pipeline `new` (activité commerciale) | Dédup index unique. Combiné aux événements `moved_to_*` selon la cible |
| `moved_to_contacted` | Passage pipeline vers `contacted` | Émis depuis `emitLeadGenerationPipelineEventsAfterActivity` |
| `moved_to_follow_up` | Passage pipeline vers `follow_up` | Idem |
| `moved_to_converted` | Conversion CRM (RPC `convert_lead_generation_assignment_to_lead` ou `finalize_lead_generation_conversion_with_existing_lead`) | Dédup index unique ; ne pas doubler avec l’UI activité |
| `outcome_changed` | Changement de `outcome` assignation (activité ou conversion) | Peut coexister avec `moved_to_converted` si l’outcome change |
| `sla_breached` | Transition SLA → `breached` dans `refreshLeadGenerationAssignmentSla` | Une fois par passage en retard (aligné Slack) |
| `dispatch_blocked` | Politique `getLeadGenerationDispatchPolicy` : injection suspendue | `assignment_id` / `stock_id` **null** |
| `dispatch_resumed` | Injection réussie après un `dispatch_blocked` sans `dispatch_resumed` intervenu | `assignment_id` / `stock_id` **null** ; `metadata_json.after_dispatch_blocked_at` |

## Champs

- **from_/to_commercial_pipeline_status**, **from_/to_outcome** : état métier avant/après la transition (null autorisé pour `assigned`, dispatch agent-scoped).
- **occurred_at** : instant métier (souvent aligné sur l’activité ou le dispatch).
- **metadata_json** : contexte libre (`source`, `reason`, ids lead, etc.).

## Déduplication

Index partiels uniques : `assigned`, `first_contact`, `moved_to_converted` par `assignment_id`.  
Le service `recordLeadGenerationAssignmentEvent` ignore l’erreur Postgres `23505`.

## Fichiers clés

- Migration : `supabase/migrations/*_lead_generation_assignment_events.sql`
- Insertion : `features/lead-generation/services/record-lead-generation-assignment-event.ts`
- Activité : `lib/emit-lead-generation-assignment-pipeline-events.ts` + `services/log-lead-generation-assignment-activity.ts`
- Conversion : `services/record-lead-generation-conversion-journal.ts` + `services/convert-lead-generation-assignment-to-lead.ts`
- Dispatch : `lib/lead-generation-dispatch-journal.ts` + `services/dispatch-lead-generation-stock.ts`
- SLA : `services/refresh-lead-generation-assignment-sla.ts`
- Analytics de base : `queries/get-lead-generation-pipeline-event-analytics.ts`

## KPI possibles (à calculer côté SQL / app)

- Délai assignation → premier contact : `first_contact_event_at - assigned_event_at` (vue `lead_generation_assignment_event_milestones`)
- Taux new → contacté / contacté → converti : jointures sur événements par assignation
- Fenêtres glissantes : `getLeadGenerationPipelineEventCounts({ windowDays })`
