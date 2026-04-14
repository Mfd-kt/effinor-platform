import Link from "next/link";
import { notFound } from "next/navigation";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessOperationsModule } from "@/lib/auth/module-access";

import { PageHeader } from "@/components/shared/page-header";
import { updateOperation } from "@/features/operations/actions/update-operation";
import { OperationChildModulesGrid } from "@/features/operations/components/operation-child-modules-grid";
import { OperationDossierNav } from "@/features/operations/components/operation-dossier-nav";
import { OperationForm } from "@/features/operations/components/operation-form";
import { OperationSummaryCards } from "@/features/operations/components/operation-summary-cards";
import { OperationTechnicalVisitSection } from "@/features/operations/components/operation-technical-visit-section";
import { OperationStatusBadge } from "@/features/operations/components/operation-status-badge";
import { mergeSuggestedKeyDates } from "@/features/operations/lib/merge-suggested-key-dates";
import { operationRowToFormValues } from "@/features/operations/lib/form-defaults";
import { getOperationById } from "@/features/operations/queries/get-operation-by-id";
import { getOperationKeyDateSuggestions } from "@/features/operations/queries/get-operation-key-date-suggestions";
import { getOperationDossierStats } from "@/features/operations/queries/get-operation-dossier-stats";
import { getOperationFormOptions } from "@/features/operations/queries/get-operation-form-options";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OperationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessOperationsModule(access)) {
    notFound();
  }

  const [row, options, dossierStats] = await Promise.all([
    getOperationById(id, access),
    getOperationFormOptions(access),
    getOperationDossierStats(id),
  ]);

  if (!row) {
    notFound();
  }

  const supabase = await createClient();
  const keyDateSuggestions = await getOperationKeyDateSuggestions(supabase, {
    operationId: id,
    referenceTechnicalVisitId: row.reference_technical_visit_id,
  });
  const operationFormDefaults = mergeSuggestedKeyDates(
    operationRowToFormValues(row),
    keyDateSuggestions,
  );

  const beneficiaryLabel = row.beneficiaries?.company_name ?? "—";
  const vtRef = row.reference_technical_visit;

  return (
    <div>
      <PageHeader
        title={row.title}
        description={
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
              <span className="font-mono text-xs text-foreground/90">{row.operation_reference}</span>
              <span>·</span>
              <span>Màj {formatDateFr(row.updated_at)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <OperationStatusBadge status={row.operation_status} />
              {vtRef ? (
                <span className="text-muted-foreground text-xs">
                  VT de réf.{" "}
                  <Link
                    href={`/technical-visits/${vtRef.id}`}
                    className="font-mono font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {vtRef.vt_reference}
                  </Link>
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">Aucune VT de référence</span>
              )}
            </div>
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/beneficiaries/${row.beneficiary_id}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              {row.beneficiaries ? `Bénéficiaire : ${beneficiaryLabel}` : "Retour au bénéficiaire"}
            </Link>
          </div>
        }
      />

      <OperationDossierNav />

      <section id="operation-dossier-overview" className="scroll-mt-24">
        <OperationSummaryCards operation={row} />
      </section>

      <section id="operation-dossier-modules" className="scroll-mt-24">
        <OperationChildModulesGrid operationId={row.id} stats={dossierStats} />
      </section>

      <section id="operation-dossier-vt" className="scroll-mt-24">
        <OperationTechnicalVisitSection operation={row} />
      </section>

      <section id="operation-dossier-pilotage-form" className="scroll-mt-24">
        <OperationForm
          key={row.id}
          mode="edit"
          operationId={row.id}
          updateOperationAction={updateOperation}
          defaultValues={operationFormDefaults}
          options={options}
          className="max-w-4xl"
        />
      </section>
    </div>
  );
}
