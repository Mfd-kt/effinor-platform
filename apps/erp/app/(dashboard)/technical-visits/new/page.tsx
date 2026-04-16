import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { fetchLeadInternalNotesPlainBlock } from "@/features/leads/lib/lead-internal-notes-export";
import { buildTechnicalVisitDefaultsFromLead } from "@/features/leads/lib/lead-to-technical-visit";
import { getLeadById } from "@/features/leads/queries/get-lead-by-id";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessTechnicalVisitsDirectoryNav } from "@/lib/auth/module-access";
import { isTechnicianWithoutDeskVisitPrivileges } from "@/features/technical-visits/access";
import { createClient } from "@/lib/supabase/server";
import { TechnicalVisitForm } from "@/features/technical-visits/components/technical-visit-form";
import { getTechnicalVisitFormOptions } from "@/features/technical-visits/queries/get-technical-visit-form-options";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ lead_id?: string }>;
};

export default async function NewTechnicalVisitPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rawLeadId = typeof sp.lead_id === "string" ? sp.lead_id.trim() : "";

  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessTechnicalVisitsDirectoryNav(access))) {
    notFound();
  }
  const statusAndAssignmentReadOnly =
    access.kind === "authenticated" && isTechnicianWithoutDeskVisitPrivileges(access);

  let defaultValues = undefined;
  let leadMissing = false;
  if (rawLeadId) {
    const lead = await getLeadById(
      rawLeadId,
      access.kind === "authenticated" ? access : undefined,
    );
    if (lead) {
      const supabase = await createClient();
      const internalNotesBlock = await fetchLeadInternalNotesPlainBlock(supabase, rawLeadId);
      defaultValues = buildTechnicalVisitDefaultsFromLead(lead, { internalNotesBlock });
    } else {
      leadMissing = true;
    }
  }

  const options = await getTechnicalVisitFormOptions(
    access.kind === "authenticated" ? access : undefined,
    {
      targetScheduledAt: defaultValues?.scheduled_at ?? null,
      targetTimeSlot: defaultValues?.time_slot ?? null,
      targetWorksiteLatitude: null,
      targetWorksiteLongitude: null,
      targetWorksiteAddress: defaultValues?.worksite_address ?? null,
      targetWorksitePostalCode: defaultValues?.worksite_postal_code ?? null,
      targetWorksiteCity: defaultValues?.worksite_city ?? null,
      targetWorksiteCountry: "France",
    },
  );

  return (
    <div>
      <PageHeader
        title="Nouvelle visite technique"
        description="Liaison obligatoire à un lead. Données préremplies si vous arrivez depuis une fiche lead."
        actions={
          <Link href="/technical-visits" className={cn(buttonVariants({ variant: "outline" }))}>
            Retour à la liste
          </Link>
        }
      />
      {leadMissing ? (
        <p className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground">
          Lead introuvable pour l&apos;identifiant fourni. Sélectionnez un lead dans le formulaire.
        </p>
      ) : null}
      {options.leads.length === 0 ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground">
          Aucun lead en base.{" "}
          <Link href="/leads/new" className="font-medium underline underline-offset-4">
            Créer un lead
          </Link>{" "}
          avant d&apos;ouvrir une visite technique.
        </p>
      ) : (
        <TechnicalVisitForm
          key={rawLeadId || "new-vt"}
          mode="create"
          options={options}
          defaultValues={defaultValues}
          statusAndAssignmentReadOnly={statusAndAssignmentReadOnly}
          className="max-w-4xl"
          /*
           * Règle métier : /technical-visits/new est un flux legacy.
           * Une VT dynamique (avec template) doit être créée depuis un contexte
           * workflow / fiche CEE qui fournit workflow_id, visit_template_key,
           * visit_template_version et visit_schema_snapshot_json.
           * dynamicSchema est volontairement omis ici (null / undefined).
           */
        />
      )}
    </div>
  );
}
