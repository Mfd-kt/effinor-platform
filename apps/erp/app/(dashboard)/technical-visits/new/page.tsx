import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { fetchLeadInternalNotesPlainBlock } from "@/features/leads/lib/lead-internal-notes-export";
import { buildTechnicalVisitDefaultsFromLead } from "@/features/leads/lib/lead-to-technical-visit";
import { getLeadById } from "@/features/leads/queries/get-lead-by-id";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessTechnicalVisitsModule } from "@/lib/auth/module-access";
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
  if (access.kind !== "authenticated" || !canAccessTechnicalVisitsModule(access)) {
    notFound();
  }
  const options = await getTechnicalVisitFormOptions(
    access.kind === "authenticated" ? access : undefined,
  );

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
          className="max-w-4xl"
        />
      )}
    </div>
  );
}
