import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadCloserWorkflowTools } from "@/features/cee-workflows/components/lead-closer-workflow-tools";
import { LeadCurrentWorkflowCard } from "@/features/cee-workflows/components/lead-current-workflow-card";
import { workflowsEligibleForCloserLeadPageTools } from "@/features/cee-workflows/lib/closer-lead-page-tools";
import { getCloserWorkflowDetail } from "@/features/cee-workflows/queries/get-closer-workflow-detail";
import { getLeadSheetWorkflowsForLead } from "@/features/cee-workflows/queries/get-lead-sheet-workflows";
import { LeadDetailVtActions } from "@/features/leads/components/lead-detail-vt-actions";
import { LeadSimulationResults } from "@/features/leads/components/lead-simulation-results";
import { DeleteLeadButton } from "@/features/leads/components/delete-lead-button";
import { LeadForm } from "@/features/leads/components/lead-form";
import { LeadInternalNotesSection } from "@/features/leads/components/lead-internal-notes-section";
import { LeadStatusBadge } from "@/features/leads/components/lead-status-badge";
import { LeadStudyPdfCard } from "@/features/leads/study-pdf/components/lead-study-pdf-card";
import { LeadActivityTimeline } from "@/features/leads/components/lead-activity-timeline";
import { LeadEmailHistory } from "@/features/leads/components/lead-email-history";
import { LeadRealtimeListener } from "@/features/leads/components/lead-realtime-listener";
import { getLeadStudyDocuments } from "@/features/leads/study-pdf/queries/get-lead-study-documents";
import { getEmailTrackingForLead } from "@/features/leads/study-pdf/queries/get-email-tracking";
import { getLeadEmails } from "@/features/leads/queries/get-lead-emails";
import { getLeadWorkflowActivityEvents } from "@/features/leads/queries/get-lead-workflow-activity-events";
import { contactSalutationLine } from "@/features/leads/lib/contact-map";
import { leadAddressesComplete } from "@/features/leads/lib/lead-address-validation";
import { leadRowToFormValues } from "@/features/leads/lib/form-defaults";
import { getLeadById } from "@/features/leads/queries/get-lead-by-id";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessCeeWorkflowsModule, canAccessCloserWorkspace, canAccessLeadsDirectoryNav } from "@/lib/auth/module-access";
import { canDeleteLead, canReassignLeadCreator } from "@/lib/auth/lead-permissions";
import {
  isRestrictedAgentLeadConsultationReadOnly,
  isRestrictedFieldAgent,
} from "@/lib/auth/restricted-agent-lead-edit";
import { createClient } from "@/lib/supabase/server";
import { getLeadInternalNotes } from "@/features/leads/queries/get-lead-internal-notes";
import { getActiveTechnicalVisitForLead } from "@/features/leads/queries/get-active-technical-visit-for-lead";
import { getTechnicalVisitRefsForLead } from "@/features/leads/queries/get-technical-visits-for-lead";
import { getLeadProfileOptionsForReassign } from "@/features/leads/queries/get-lead-form-options";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Headset } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function eur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

const KPI_TONES = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  teal: "border-teal-200 bg-teal-50 text-teal-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
} as const;

function KpiChip({ label, value, tone }: { label: string; value: string; tone: keyof typeof KPI_TONES }) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs", KPI_TONES[tone])}>
      <span className="font-normal opacity-75">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const access = await getAccessContext();
  const canReassign =
    access.kind === "authenticated" && canReassignLeadCreator(access.roleCodes);
  const canDelete =
    access.kind === "authenticated" && canDeleteLead(access.roleCodes);

  const isAgentLeadExperience =
    access.kind === "authenticated" && isRestrictedFieldAgent(access);

  const [lead, vtRefs, activeVisit, internalNotes, studyDocs, emailTracking, leadEmails, ceeWorkflows] =
    await Promise.all([
      getLeadById(id, access.kind === "authenticated" ? access : undefined),
      isAgentLeadExperience
        ? Promise.resolve([])
        : getTechnicalVisitRefsForLead(id, access.kind === "authenticated" ? access : undefined),
      isAgentLeadExperience
        ? Promise.resolve(null)
        : getActiveTechnicalVisitForLead(id, access.kind === "authenticated" ? access : undefined),
      isAgentLeadExperience ? Promise.resolve([]) : getLeadInternalNotes(id),
      isAgentLeadExperience ? Promise.resolve([]) : getLeadStudyDocuments(id),
      isAgentLeadExperience ? Promise.resolve([]) : getEmailTrackingForLead(id),
      isAgentLeadExperience ? Promise.resolve([]) : getLeadEmails(id),
      access.kind === "authenticated" ? getLeadSheetWorkflowsForLead(id, access) : Promise.resolve([]),
    ]);

  const agentProfiles = canReassign ? await getLeadProfileOptionsForReassign() : [];

  if (!lead) {
    notFound();
  }

  const supabase = await createClient();
  const agentConsultationReadOnly = await isRestrictedAgentLeadConsultationReadOnly(supabase, access, lead.id);

  const closerToolWorkflows =
    access.kind === "authenticated" &&
    canAccessCloserWorkspace(access) &&
    !isAgentLeadExperience
      ? workflowsEligibleForCloserLeadPageTools(ceeWorkflows)
      : [];

  const closerDetails =
    closerToolWorkflows.length > 0
      ? (
          await Promise.all(closerToolWorkflows.map((w) => getCloserWorkflowDetail(w.id, access)))
        ).filter((d): d is NonNullable<typeof d> => d != null)
      : [];

  const workflowLabelsById = Object.fromEntries(
    ceeWorkflows.map((w) => [
      w.id,
      w.cee_sheet?.code?.trim() || w.cee_sheet?.label?.trim() || "Fiche CEE",
    ]),
  );

  const workflowActivityEvents =
    !isAgentLeadExperience && ceeWorkflows.length > 0
      ? await getLeadWorkflowActivityEvents(ceeWorkflows.map((w) => w.id))
      : [];

  const leadListBackHref =
    access.kind === "authenticated" &&
    isRestrictedFieldAgent(access) &&
    !canAccessLeadsDirectoryNav(access)
      ? "/agent"
      : access.kind === "authenticated" &&
          access.roleCodes.includes("closer") &&
          !canAccessLeadsDirectoryNav(access)
        ? "/closer"
        : "/leads";
  const leadListBackLabel =
    leadListBackHref === "/agent"
      ? "Retour au poste Agent"
      : leadListBackHref === "/closer"
        ? "Retour au poste Closer"
        : "Retour à la liste";

  const contact = contactSalutationLine(lead);
  const createdByLabel =
    lead.created_by_agent?.full_name?.trim() ||
    lead.created_by_agent?.email ||
    null;

  const addressesOk = leadAddressesComplete(lead);
  const companyNameOk = Boolean(lead.company_name?.trim());
  const pipelineBlocked = lead.lead_status === "lost" || lead.lead_status === "converted";

  const canOpenAgentWorkstation =
    access.kind === "authenticated" && canAccessCeeWorkflowsModule(access);

  return (
    <div>
      <LeadRealtimeListener leadId={lead.id} />

      {/* ── Header compact ── */}
      <div className="mb-4 border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Left: title + meta */}
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {lead.company_name}
              </h1>
              <LeadStatusBadge status={lead.lead_status} className="text-xs px-2.5 py-0.5" />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {contact && <span className="font-medium text-foreground/80">{contact}</span>}
              {contact && <span className="text-muted-foreground/50">·</span>}
              {lead.product_interest?.trim() && (
                <>
                  <span>
                    <span className="text-muted-foreground">Catégorie · </span>
                    <span className="font-medium text-foreground">{lead.product_interest.trim()}</span>
                  </span>
                  <span className="text-muted-foreground/50">·</span>
                </>
              )}
              {createdByLabel && <span>{createdByLabel}</span>}
              {createdByLabel && <span className="text-muted-foreground/50">·</span>}
              <span className="tabular-nums">{formatDateTimeFr(lead.created_at)}</span>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-2">
            {canDelete && (
              <DeleteLeadButton leadId={lead.id} companyLabel={lead.company_name} />
            )}
            {canOpenAgentWorkstation ? (
              <Link
                href={`/agent?lead=${lead.id}`}
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
                title="Ouvre le poste agent avec la fiche CEE adaptée à la catégorie du lead"
              >
                <Headset className="size-3.5 shrink-0" aria-hidden />
                Poste agent
              </Link>
            ) : null}
            <Link href={leadListBackHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              {leadListBackLabel}
            </Link>
          </div>
        </div>

        {/* ── KPIs ── */}
        {lead.sim_cee_prime_estimated != null && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <KpiChip
              label="Potentiel CA"
              value={eur(lead.sim_cee_prime_estimated)}
              tone="emerald"
            />
            {lead.sim_rest_to_charge != null && lead.sim_rest_to_charge > 0 && (
              <KpiChip
                label="Reste à charge"
                value={eur(lead.sim_rest_to_charge)}
                tone="amber"
              />
            )}
            {lead.sim_saving_eur_30_selected != null && (
              <KpiChip
                label="Économie/an"
                value={eur(lead.sim_saving_eur_30_selected)}
                tone="sky"
              />
            )}
            {lead.sim_co2_saved_tons != null && (
              <KpiChip
                label="CO₂ évité"
                value={`${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(lead.sim_co2_saved_tons)} t`}
                tone="teal"
              />
            )}
          </div>
        )}
      </div>

      {/* Notes : fixed en lg+, marge droite = panneau CRM + gouttière (voir <aside> ci-dessous). */}
      <div className="flex flex-col gap-4">
        <div
          className={cn(
            "min-w-0 space-y-3",
            !isAgentLeadExperience &&
              "lg:pr-[calc(28rem+2rem)] xl:pr-[calc(31rem+2.25rem)] 2xl:pr-[calc(34rem+2.5rem)]",
          )}
        >
          {!isAgentLeadExperience ? (
            <CollapsibleSection title="Workflow fiche CEE" defaultOpen>
              <LeadCurrentWorkflowCard workflows={ceeWorkflows} />
            </CollapsibleSection>
          ) : null}

          {/* 1. Fiche contact — toujours visible pour contexte rapide */}
          <CollapsibleSection
            title={isAgentLeadExperience ? "Vos informations" : "Informations du lead"}
            defaultOpen
          >
            <LeadForm
              key={lead.id}
              mode="edit"
              leadId={lead.id}
              defaultValues={leadRowToFormValues(lead)}
              className="max-w-4xl"
              canReassignCreator={canReassign}
              agentOptions={agentProfiles}
              externalFooter
              formId={`lead-form-${lead.id}`}
              readOnly={agentConsultationReadOnly}
              simplifiedAgentView={isAgentLeadExperience}
            />
          </CollapsibleSection>

          {/* 2. Simulateur — résultats chiffrés, base de la proposition */}
          <CollapsibleSection title="Simulateur commercial">
            <LeadSimulationResults lead={lead} workflows={ceeWorkflows} />
          </CollapsibleSection>

          {!isAgentLeadExperience ? (
            <>
              {/* 3. Documents — étude + accord (masqué si « Poste closer » : même flux dans CloserDocumentsSignaturePanel) */}
              {closerDetails.length === 0 ? (
                <CollapsibleSection title="Documents projet">
                  <LeadStudyPdfCard
                    leadId={lead.id}
                    documents={studyDocs}
                    clientEmail={lead.email ?? undefined}
                    clientName={lead.contact_name ?? undefined}
                    companyName={lead.company_name ?? undefined}
                    siteName={
                      [lead.worksite_address, lead.worksite_postal_code, lead.worksite_city]
                        .filter(Boolean)
                        .join(", ") || undefined
                    }
                  />
                </CollapsibleSection>
              ) : null}

              {closerDetails.length > 0 ? (
                <>
                  {closerDetails.map((d) => (
                    <CollapsibleSection
                      key={d.workflow.id}
                      title={`Poste closer — ${d.workflow.cee_sheet?.code ?? d.workflow.cee_sheet?.label ?? "fiche"}`}
                      defaultOpen
                    >
                      <p className="mb-4 max-w-4xl text-sm text-muted-foreground">
                        Relances, pack commercial, envoi d&apos;accord et clôture. La file d&apos;attente reste sur le
                        menu <strong>Closer</strong>.
                      </p>
                      <LeadCloserWorkflowTools detail={d} />
                    </CollapsibleSection>
                  ))}
                </>
              ) : null}

              {/* Visite technique — en bas de fiche (après emails / closer) */}
              <CollapsibleSection title="Visite technique">
                <LeadDetailVtActions
                  leadId={lead.id}
                  addressesComplete={addressesOk}
                  companyNameOk={companyNameOk}
                  pipelineBlocked={pipelineBlocked}
                  activeVisit={activeVisit}
                  allVisits={vtRefs}
                  consultationReadOnly={agentConsultationReadOnly}
                />
              </CollapsibleSection>
            </>
          ) : null}

          {/* ── Footer enregistrement ── */}
          {!agentConsultationReadOnly ? (
            <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-4 rounded-lg border border-border bg-background/95 px-5 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <p className="text-sm text-muted-foreground">
                Sauvegarde automatique (environ 1 s après la dernière modification).
              </p>
              <button
                type="submit"
                form={`lead-form-${lead.id}`}
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Enregistrer maintenant
              </button>
            </div>
          ) : null}
        </div>

        {!isAgentLeadExperience ? (
          <aside
            className={cn(
              "mt-6 w-full max-w-lg shrink-0 space-y-3 self-stretch sm:max-w-none",
              "lg:mt-0 lg:fixed lg:z-20 lg:max-w-none lg:space-y-3",
              "lg:w-[28rem] xl:w-[31rem] 2xl:w-[34rem]",
              "lg:max-h-[calc(100vh-13.5rem)] lg:overflow-y-auto lg:overscroll-contain",
              "lg:right-6 lg:bottom-8 xl:right-8 2xl:right-10",
            )}
          >
            <LeadActivityTimeline
              leadCreatedAt={lead.created_at}
              leadCreatedByLabel={createdByLabel}
              workflowLabelsById={workflowLabelsById}
              events={workflowActivityEvents}
            />
            <section className="rounded-xl border border-border/80 bg-card shadow-sm">
              <div className="border-b border-border/70 px-3 py-2.5">
                <h2 className="text-sm font-semibold text-foreground">Emails</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Boîte liée au lead : sync, historique, envoi (nouvel email).
                </p>
              </div>
              <div className="p-3">
                <LeadEmailHistory
                  leadId={lead.id}
                  clientEmail={lead.email ?? undefined}
                  clientName={lead.contact_name ?? undefined}
                  companyName={lead.company_name ?? undefined}
                  siteName={
                    [lead.worksite_address, lead.worksite_postal_code, lead.worksite_city]
                      .filter(Boolean)
                      .join(", ") ||
                    [lead.head_office_address, lead.head_office_postal_code, lead.head_office_city]
                      .filter(Boolean)
                      .join(", ") ||
                    undefined
                  }
                  presentationUrl={studyDocs.find((d) => d.document_type === "study_pdf")?.file_url}
                  accordUrl={studyDocs.find((d) => d.document_type === "accord_commercial")?.file_url}
                  initialTracking={emailTracking}
                  initialEmails={leadEmails}
                />
              </div>
            </section>
            <LeadInternalNotesSection
              leadId={lead.id}
              initialNotes={internalNotes}
              variant="sidebar"
              readOnly={agentConsultationReadOnly}
              className="!flex-none"
            />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
