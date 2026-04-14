import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getBeneficiaries } from "@/features/beneficiaries/queries/get-beneficiaries";
import { OperationsFilters } from "@/features/operations/components/operations-filters";
import { OperationsTable } from "@/features/operations/components/operations-table";
import { getOperations } from "@/features/operations/queries/get-operations";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessOperationsModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { OperationStatus } from "@/types/database.types";
import { OPERATION_STATUS_ALL_VALUES } from "@/features/operations/schemas/operation.schema";
import { ClipboardList } from "lucide-react";

const VALID_STATUSES: OperationStatus[] = [...OPERATION_STATUS_ALL_VALUES];

function isOperationStatus(v: string): v is OperationStatus {
  return VALID_STATUSES.includes(v as OperationStatus);
}

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; beneficiary_id?: string }>;
};

export default async function OperationsPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessOperationsModule(access)) {
    notFound();
  }

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rawStatus = typeof sp.status === "string" ? sp.status : "all";
  const rawBeneficiary = typeof sp.beneficiary_id === "string" ? sp.beneficiary_id : "all";

  const statusFilter: OperationStatus | undefined =
    rawStatus !== "all" && isOperationStatus(rawStatus) ? rawStatus : undefined;

  const beneficiaryFilter =
    rawBeneficiary !== "all" && rawBeneficiary.trim() !== "" ? rawBeneficiary.trim() : undefined;

  let operations;
  try {
    operations = await getOperations(
      {
        q: q || undefined,
        operation_status: statusFilter,
        beneficiary_id: beneficiaryFilter,
      },
      access,
    );
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur lors du chargement des opérations.";
    return (
      <div>
        <PageHeader
          title="Opérations"
          description="Dossiers CEE centraux : statuts, délégataire, échéances et pilotage financier."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  const beneficiariesForFilter = (await getBeneficiaries(undefined, access)).map((b) => ({
    id: b.id,
    company_name: b.company_name,
  }));

  const hasFilters =
    Boolean(q.trim()) || rawStatus !== "all" || rawBeneficiary !== "all";

  return (
    <div>
      <PageHeader
        title="Opérations"
        description="Dossiers CEE centraux : statuts, délégataire, échéances et pilotage financier."
        actions={
          <Link href="/beneficiaries" className={cn(buttonVariants())}>
            Créer via un bénéficiaire
          </Link>
        }
      />

      <OperationsFilters
        defaultQ={q}
        defaultStatus={rawStatus}
        defaultBeneficiaryId={rawBeneficiary}
        beneficiaries={beneficiariesForFilter}
      />

      {operations.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun résultat" : "Aucune opération"}
          description={
            hasFilters
              ? "Modifiez les filtres ou créez un nouveau dossier."
              : "Créez une opération liée à un bénéficiaire pour centraliser le pilotage CEE."
          }
          icon={<ClipboardList className="size-10 opacity-50" />}
          action={
            <Link href="/beneficiaries" className={cn(buttonVariants())}>
              Ouvrir les bénéficiaires
            </Link>
          }
        />
      ) : (
        <OperationsTable data={operations} />
      )}
    </div>
  );
}
