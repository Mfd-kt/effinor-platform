import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { canViewTechnicalVisitPilotageAlerts } from "@/features/technical-visits/alerts/technical-visit-alerts-access";
import { refreshTechnicalVisitAlerts } from "@/features/technical-visits/alerts/sync-technical-visit-alerts";
import {
  canAdminSoftDeleteTechnicalVisit,
  getTechnicalVisitFieldAccessLevelForAuthenticatedViewer,
  isTechnicianWithoutDeskVisitPrivileges,
  shouldHideTechnicianFieldworkFormUntilVisitStarted,
} from "@/features/technical-visits/access";
import { TechnicalVisitAdminDeleteButton } from "@/features/technical-visits/components/technical-visit-admin-delete-button";
import { TechnicalVisitsRealtimeListener } from "@/features/technical-visits/components/technical-visits-realtime-listener";
import { TechnicalVisitForm } from "@/features/technical-visits/components/technical-visit-form";
import { TechnicalVisitPilotageAlertsPanel } from "@/features/technical-visits/components/technical-visit-pilotage-alerts-panel";
import { TechnicalVisitStatusBadge } from "@/features/technical-visits/components/technical-visit-status-badge";
import { TechnicalVisitSummaryCards } from "@/features/technical-visits/components/technical-visit-summary-cards";
import { TechnicalVisitLifecycleToolbar } from "@/features/technical-visits/components/technical-visit-lifecycle-toolbar";
import { TechnicalVisitDetailMobileHero } from "@/features/technical-visits/components/technical-visit-detail-mobile-hero";
import { TechnicalVisitStartGeoProofCard } from "@/features/technical-visits/components/technical-visit-start-geo-proof-card";
import { TechnicalVisitTechnicianRestrictedPanel } from "@/features/technical-visits/components/technical-visit-technician-restricted-panel";
import { mergeBatTh142GeneralAnswersFromLeadAndVisit } from "@/features/technical-visits/dynamic/bat-th-142-prefill-from-lead";
import { technicalVisitRowToFormValues } from "@/features/technical-visits/lib/form-defaults";
import { computeVisitPermissions, resolveActorRole } from "@/features/technical-visits/lifecycle/rules";
import { getLeadById } from "@/features/leads/queries/get-lead-by-id";
import { getTechnicalVisitById } from "@/features/technical-visits/queries/get-technical-visit-by-id";
import { getTechnicalVisitAudioNotes } from "@/features/technical-visits/queries/get-technical-visit-audio-notes";
import {
  getOpenTechnicalVisitAlerts,
  summarizeOpenPilotageAlerts,
} from "@/features/technical-visits/queries/get-technical-visit-alerts";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";
import { getTechnicalVisitFormOptions } from "@/features/technical-visits/queries/get-technical-visit-form-options";
import { getVisitTemplateSchemaForDetailUnified } from "@/features/technical-visits/workflow/resolve-visit-template-unified";
import { buttonVariants } from "@/components/ui/button-variants";
import { canAccessTechnicalVisitsDirectoryNav } from "@/lib/auth/module-access";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TechnicalVisitDetailPage({ params }: PageProps) {
  const { id } = await params;
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessTechnicalVisitsDirectoryNav(access))) {
    notFound();
  }
  const row = await getTechnicalVisitById(id, access);

  if (!row) {
    notFound();
  }

  const supabase = await createClient();
  const auth = access.kind === "authenticated" ? access : undefined;

  const fieldAccessLevel =
    access.kind === "authenticated"
      ? getTechnicalVisitFieldAccessLevelForAuthenticatedViewer(access, row)
      : "full";
  const technicianRestricted = fieldAccessLevel === "technician_restricted";

  const [options, leadForWorksite, audioNotes, dynamicSchemaResolved] = await Promise.all([
    getTechnicalVisitFormOptions(auth, {
      visitTechnicianProfileId: row.technician_id,
    }),
    row.lead_id ? getLeadById(row.lead_id, auth) : Promise.resolve(null),
    !technicianRestricted ? getTechnicalVisitAudioNotes(row.id) : Promise.resolve([]),
    getVisitTemplateSchemaForDetailUnified(
      supabase,
      row.visit_schema_snapshot_json,
      row.visit_template_key,
      row.visit_template_version,
    ),
  ]);

  let pilotageOpenAlerts: Awaited<ReturnType<typeof getOpenTechnicalVisitAlerts>> = [];
  if (!technicianRestricted && canViewTechnicalVisitPilotageAlerts(access)) {
    await refreshTechnicalVisitAlerts(supabase, row.id);
    pilotageOpenAlerts = await getOpenTechnicalVisitAlerts(row.id);
  }
  const pilotageSummary = summarizeOpenPilotageAlerts(pilotageOpenAlerts);
  const pilotageAlertBadge =
    !technicianRestricted && pilotageSummary.openCount > 0
      ? { openCount: pilotageSummary.openCount, criticalCount: pilotageSummary.criticalCount }
      : null;

  const statusAndAssignmentReadOnly =
    access.kind === "authenticated" && isTechnicianWithoutDeskVisitPrivileges(access);

  const baseDynamicAnswers: Record<string, unknown> | undefined =
    row.form_answers_json && typeof row.form_answers_json === "object" && !Array.isArray(row.form_answers_json)
      ? (row.form_answers_json as Record<string, unknown>)
      : undefined;

  const dynamicAnswersForForm =
    dynamicSchemaResolved?.template_key === "BAT-TH-142"
      ? mergeBatTh142GeneralAnswersFromLeadAndVisit(baseDynamicAnswers, leadForWorksite, row)
      : baseDynamicAnswers;

  return (
    <div
      className={cn(
        !technicianRestricted &&
          "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0",
      )}
    >
      <TechnicalVisitsRealtimeListener filters={[`id=eq.${row.id}`]} debounceMs={400} />
      {!technicianRestricted ? (
        <TechnicalVisitDetailMobileHero
          visit={row}
          pilotageAlertSummary={pilotageAlertBadge}
          footer={
            row.lead_id ? (
              <Link
                href={`/leads/${row.lead_id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "flex h-12 w-full items-center justify-center font-semibold",
                )}
              >
                {row.leads?.company_name ? row.leads.company_name : "Voir le lead"}
              </Link>
            ) : null
          }
        />
      ) : null}

      <div className="hidden md:block">
        <PageHeader
          title={row.vt_reference}
          description={
            <span className="flex flex-wrap items-center gap-3 text-muted-foreground">
              <span>Màj {formatDateFr(row.updated_at)}</span>
              <span className="font-mono text-xs text-foreground/80">{row.id}</span>
              <TechnicalVisitStatusBadge status={row.status} />
              {pilotageAlertBadge ? (
                <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {pilotageAlertBadge.openCount} alerte{pilotageAlertBadge.openCount > 1 ? "s" : ""} pilotage
                  {pilotageAlertBadge.criticalCount > 0
                    ? ` · ${pilotageAlertBadge.criticalCount} critique${pilotageAlertBadge.criticalCount > 1 ? "s" : ""}`
                    : ""}
                </span>
              ) : null}
            </span>
          }
          actions={
            row.lead_id && !technicianRestricted ? (
              <Link href={`/leads/${row.lead_id}`} className={cn(buttonVariants({ variant: "outline" }))}>
                {row.leads?.company_name ? `Lead : ${row.leads.company_name}` : "Voir le lead"}
              </Link>
            ) : null
          }
        />
      </div>

      {!technicianRestricted ? (
        <div className="hidden md:block">
          <TechnicalVisitSummaryCards visit={row} fieldAccessLevel={fieldAccessLevel} />
        </div>
      ) : null}

      {(() => {
        const actorRole = resolveActorRole(access.kind === "authenticated" ? access.roleCodes : []);
        const lifecycleRow = {
          status: row.status,
          started_at: row.started_at,
          completed_at: row.completed_at,
          performed_at: row.performed_at,
          locked_at: row.locked_at,
          locked_by: row.locked_by,
          technician_id: row.technician_id,
          scheduled_at: row.scheduled_at,
        };
        const permissions = computeVisitPermissions(lifecycleRow, actorRole);
        const readOnly = !permissions.edit;

        if (technicianRestricted) {
          return <TechnicalVisitTechnicianRestrictedPanel visit={row} />;
        }

        const hideTechnicianFieldworkForm =
          access.kind === "authenticated" &&
          shouldHideTechnicianFieldworkFormUntilVisitStarted(access, row, fieldAccessLevel);

        const lifecycleAndAdminBlock = (
          <div className="mb-6">
            <TechnicalVisitLifecycleToolbar
              visitId={row.id}
              permissions={permissions}
              isLocked={Boolean(row.locked_at)}
              isStarted={Boolean(row.started_at)}
              isCompleted={Boolean(row.completed_at)}
            />
            {readOnly ? (
              <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-50/50 px-3 py-3 text-sm leading-relaxed text-amber-900 md:py-2 dark:bg-amber-950/20 dark:text-amber-200">
                Cette visite est en lecture seule (statut, verrou ou droits insuffisants).
              </p>
            ) : null}
            {canAdminSoftDeleteTechnicalVisit(access) ? (
              <div className="mt-4 flex flex-col gap-3 rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Administrateur :</span> archiver cette visite (elle
                  disparaît des listes ; données conservées pour l’audit).
                </p>
                <TechnicalVisitAdminDeleteButton
                  visitId={row.id}
                  vtReference={row.vt_reference}
                  redirectAfterDelete="/technical-visits"
                />
              </div>
            ) : null}
          </div>
        );

        if (hideTechnicianFieldworkForm) {
          return (
            <>
              {lifecycleAndAdminBlock}
              <div className="max-w-4xl rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">Formulaire terrain masqué</p>
                <p className="mt-1">
                  Utilisez le bouton « Démarrer la visite » ci-dessus pour ouvrir le formulaire et les champs à
                  compléter sur site.
                </p>
              </div>
            </>
          );
        }

        return (
          <>
            {lifecycleAndAdminBlock}

            <TechnicalVisitStartGeoProofCard
              startedAt={row.started_at}
              proof={row.start_geo_proof}
              showPreciseCoords={fieldAccessLevel === "full"}
            />

            {canViewTechnicalVisitPilotageAlerts(access) && pilotageOpenAlerts.length > 0 ? (
              <div className="mb-6 max-w-4xl">
                <TechnicalVisitPilotageAlertsPanel alerts={pilotageOpenAlerts} />
              </div>
            ) : null}

            <TechnicalVisitForm
              key={row.id}
              mode="edit"
              visitId={row.id}
              readOnly={readOnly}
              statusAndAssignmentReadOnly={statusAndAssignmentReadOnly}
              audioNotes={audioNotes}
              defaultValues={technicalVisitRowToFormValues(
                row,
                leadForWorksite
                  ? {
                      worksite_address: leadForWorksite.worksite_address,
                      worksite_postal_code: leadForWorksite.worksite_postal_code,
                      worksite_city: leadForWorksite.worksite_city,
                    }
                  : null,
              )}
              options={options}
              className="max-w-4xl"
              dynamicSchema={dynamicSchemaResolved}
              dynamicAnswers={dynamicAnswersForForm}
            />
          </>
        );
      })()}
    </div>
  );
}
