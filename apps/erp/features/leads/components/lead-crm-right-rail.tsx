import { LeadActivityTimeline } from "@/features/leads/components/lead-activity-timeline";
import { LeadEmailHistory } from "@/features/leads/components/lead-email-history";
import { LeadInternalNotesSection } from "@/features/leads/components/lead-internal-notes-section";
import { getLeadEmails } from "@/features/leads/queries/get-lead-emails";
import { getLeadInternalNotes } from "@/features/leads/queries/get-lead-internal-notes";
import { getLeadStudyDocuments } from "@/features/leads/study-pdf/queries/get-lead-study-documents";
import { getEmailTrackingForLead } from "@/features/leads/study-pdf/queries/get-email-tracking";
import { getLeadWorkflowActivityEvents } from "@/features/leads/queries/get-lead-workflow-activity-events";
import type { LeadDetailRow } from "@/features/leads/types";
import { cn } from "@/lib/utils";

export type LeadCrmRightRailWorkflowRef = {
  id: string;
  cee_sheet: { code: string | null; label: string | null } | null;
};

export type LeadCrmRightRailPreloaded = {
  internalNotes: Awaited<ReturnType<typeof getLeadInternalNotes>>;
  studyDocs: Awaited<ReturnType<typeof getLeadStudyDocuments>>;
  emailTracking: Awaited<ReturnType<typeof getEmailTrackingForLead>>;
  leadEmails: Awaited<ReturnType<typeof getLeadEmails>>;
  workflowActivityEvents: Awaited<ReturnType<typeof getLeadWorkflowActivityEvents>>;
};

type LeadCrmRightRailProps = {
  lead: LeadDetailRow;
  workflows: LeadCrmRightRailWorkflowRef[];
  /** Désactive l’ajout de notes internes (ex. agent consultation). */
  readOnly?: boolean;
  className?: string;
  /** Évite un second chargement quand la page a déjà ces données (ex. `/leads/[id]`). */
  preloaded?: LeadCrmRightRailPreloaded;
};

/**
 * Colonne CRM droite (historique workflow, emails, notes internes) — alignée sur `/leads/[id]`.
 */
export async function LeadCrmRightRail({
  lead,
  workflows,
  readOnly = false,
  className,
  preloaded,
}: LeadCrmRightRailProps) {
  const workflowIds = workflows.map((w) => w.id);
  const workflowLabelsById = Object.fromEntries(
    workflows.map((w) => [
      w.id,
      w.cee_sheet?.code?.trim() || w.cee_sheet?.label?.trim() || "Fiche CEE",
    ]),
  );

  const createdByLabel =
    lead.created_by_agent?.full_name?.trim() || lead.created_by_agent?.email || null;

  const [internalNotes, studyDocs, emailTracking, leadEmails, workflowActivityEvents] = preloaded
    ? [
        preloaded.internalNotes,
        preloaded.studyDocs,
        preloaded.emailTracking,
        preloaded.leadEmails,
        preloaded.workflowActivityEvents,
      ]
    : await Promise.all([
        getLeadInternalNotes(lead.id),
        getLeadStudyDocuments(lead.id),
        getEmailTrackingForLead(lead.id),
        getLeadEmails(lead.id),
        getLeadWorkflowActivityEvents(workflowIds),
      ]);

  return (
    <aside
      className={cn(
        "mt-6 w-full max-w-lg shrink-0 space-y-3 self-stretch sm:max-w-none",
        "lg:mt-0 lg:fixed lg:z-20 lg:max-w-none lg:space-y-3",
        "lg:w-[28rem] xl:w-[31rem] 2xl:w-[34rem]",
        "lg:max-h-[calc(100vh-14.5rem)] lg:overflow-y-auto lg:overscroll-contain",
        // 48px = 40px AppFooter + 8px gap visuel. Le rail droit
        // doit toujours rester au-dessus du footer global du shell
        // dashboard, voir components/layout/app-footer.tsx.
        "lg:right-6 lg:bottom-12 xl:right-8 2xl:right-10",
        className,
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
        readOnly={readOnly}
        className="!flex-none"
      />
    </aside>
  );
}
