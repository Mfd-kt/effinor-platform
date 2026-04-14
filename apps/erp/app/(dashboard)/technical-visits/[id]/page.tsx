import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { TechnicalVisitForm } from "@/features/technical-visits/components/technical-visit-form";
import { TechnicalVisitStatusBadge } from "@/features/technical-visits/components/technical-visit-status-badge";
import { TechnicalVisitSummaryCards } from "@/features/technical-visits/components/technical-visit-summary-cards";
import { technicalVisitRowToFormValues } from "@/features/technical-visits/lib/form-defaults";
import { getLeadById } from "@/features/leads/queries/get-lead-by-id";
import { getTechnicalVisitById } from "@/features/technical-visits/queries/get-technical-visit-by-id";
import { getAccessContext } from "@/lib/auth/access-context";
import { getTechnicalVisitFormOptions } from "@/features/technical-visits/queries/get-technical-visit-form-options";
import { buttonVariants } from "@/components/ui/button-variants";
import { canAccessTechnicalVisitsModule } from "@/lib/auth/module-access";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TechnicalVisitDetailPage({ params }: PageProps) {
  const { id } = await params;
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessTechnicalVisitsModule(access)) {
    notFound();
  }
  const row = await getTechnicalVisitById(id, access);

  if (!row) {
    notFound();
  }

  const auth = access.kind === "authenticated" ? access : undefined;

  const [options, leadForWorksite] = await Promise.all([
    getTechnicalVisitFormOptions(auth, {
      visitTechnicianProfileId: row.technician_id,
    }),
    row.lead_id ? getLeadById(row.lead_id, auth) : Promise.resolve(null),
  ]);

  return (
    <div>
      <PageHeader
        title={row.vt_reference}
        description={
          <span className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <span>Màj {formatDateFr(row.updated_at)}</span>
            <span className="font-mono text-xs text-foreground/80">{row.id}</span>
            <TechnicalVisitStatusBadge status={row.status} />
          </span>
        }
        actions={
          row.lead_id ? (
            <Link href={`/leads/${row.lead_id}`} className={cn(buttonVariants({ variant: "outline" }))}>
              {row.leads?.company_name ? `Lead : ${row.leads.company_name}` : "Voir le lead"}
            </Link>
          ) : null
        }
      />

      <TechnicalVisitSummaryCards visit={row} />

      <TechnicalVisitForm
        key={row.id}
        mode="edit"
        visitId={row.id}
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
      />
    </div>
  );
}
