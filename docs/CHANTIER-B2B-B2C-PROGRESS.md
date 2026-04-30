# Chantier B2B/B2C — Avancement

## ✅ Terminé
- Phase 0 : Discovery + classification colonnes
- Phase 1 : Design détaillé (Q1-Q8 + D1-D5 tranchés)
- Phase 2.0 : Plan SQL final + correctif trigger I.0
- Phase 2.1 : Migration DB (commit 9524169)
  - Tables leads_b2b, leads_b2c, lead_activity_events
  - Triggers de cohérence + auto-fill display_name + realtime
  - 7 leads backfillés en lead_type='unknown'
- Phase 2.2 : Schémas Zod (commit 36833c5)
- Phase 2.2.5 : RLS centralisée auth_can_access_lead (commit 08f0964)
- Phase 2.3.A : Discovery du code existant (rapport)
- Phase 2.3.B.1 : convertLeadType + helpers (commit 9afaaca)
  - Bug du trigger 'b2c' → 'b2b' fixé via neutralisation à 'unknown'
- Phase 2.3.B.2 : updateLeadBundle dormant (commit 2f19cf3)

## 🔜 Prochaine étape : Phase 2.3.C
Modifier ~14 fichiers existants pour qu'ils consomment les
nouvelles tables, schémas et Server Actions.u moins risqué au plus risqué) :
1. leads-table.tsx (display_name au lieu de company_name)
2. notification-service.ts (Slack)
3. generate-email-draft.ts (IA)
4. study-pdf/domain/validation.ts
5. create-technical-visit-from-lead.ts (validation)
6. get-lead-by-id.ts (charger extensions)
7. get-leads.ts (filtrage par lead_type)
8. find-duplicate-lead.ts (SIRET dans leads_b2b)
9. study-pdf/domain/build-study-view-model.ts (PDF)
10. simulator-cee/services/create-simulation.ts
11. apps/website + landing-pac + landing-reno-global (simulateur public)
12. create-lead.ts + map-to-db.ts
13. update-lead.ts (bascule progressive vers updateLeadBundle)
14. RPC SQL convert_lead_generation_assignment_to_lead

## ⏳ Phase 2.4 — Refonte LeadForm
- Découpage en LeadFormCommon + LeadFormB2C + LeadFormB2B + LeadFormQualification
- Bouton conversion + modal
- Audit log dans LeadActivityTimeline
- Bascule de l'autosave sur updateLeadBundle

## ⏳ Phase 2.5 — Liste, simulateur, emails, PDF (finitions)
- Badge type + filtre-table
- KPI séparés cockpit
- Migration 2 (DROP des colonnes legacy de leads)

## Commits sur main
- 9524169 feat(db): add lead_type with B2B/B2C extensions
- 36833c5 feat(leads): add Zod schemas for B2B/B2C lead types
- 08f0964 feat(db): centralize lead access authorization for extensions
- 9afaaca feat(leads): add convertLeadType server action and helpers
- 2f19cf3 feat(leads): add updateLeadBundle server action

## Backups pg_dump
- effinor-prod-postphase23B-20260430-XXXX.dump (à créer)
