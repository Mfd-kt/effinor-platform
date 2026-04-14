import Link from "next/link";
import { notFound } from "next/navigation";

import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessBeneficiariesModule } from "@/lib/auth/module-access";

import { PageHeader } from "@/components/shared/page-header";
import { BeneficiaryForm } from "@/features/beneficiaries/components/beneficiary-form";
import { BeneficiaryStatusBadge } from "@/features/beneficiaries/components/beneficiary-status-badge";
import { BeneficiaryTechnicalVisitsSection } from "@/features/beneficiaries/components/beneficiary-technical-visits-section";
import { beneficiaryRowToFormValues } from "@/features/beneficiaries/lib/form-defaults";
import { BeneficiaryCreateOperationSection } from "@/features/beneficiaries/components/beneficiary-create-operation-section";
import { getBeneficiaryById } from "@/features/beneficiaries/queries/get-beneficiary-by-id";
import { getBeneficiaryOperationCreationContext } from "@/features/beneficiaries/queries/get-beneficiary-operation-creation-context";
import { getBeneficiaryTechnicalVisits } from "@/features/beneficiaries/queries/get-beneficiary-technical-visits";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BeneficiaryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessBeneficiariesModule(access)) {
    notFound();
  }

  const row = await getBeneficiaryById(id, access);

  if (!row) {
    notFound();
  }

  const [technicalVisits, operationContext] = await Promise.all([
    getBeneficiaryTechnicalVisits(id, access),
    getBeneficiaryOperationCreationContext(id),
  ]);

  return (
    <div>
      <PageHeader
        title={row.company_name}
        description={
          <span className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <span>Créé le {formatDateFr(row.created_at)}</span>
            <span className="font-mono text-xs text-foreground/80">{row.id}</span>
            <BeneficiaryStatusBadge status={row.status} />
          </span>
        }
        actions={
          <Link
            href="/beneficiaries"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Retour à la liste
          </Link>
        }
      />

      {operationContext ? (
        <BeneficiaryCreateOperationSection beneficiaryId={row.id} context={operationContext} />
      ) : null}

      <BeneficiaryForm
        key={row.id}
        mode="edit"
        beneficiaryId={row.id}
        defaultValues={beneficiaryRowToFormValues(row)}
        className="max-w-4xl"
      />

      <BeneficiaryTechnicalVisitsSection visits={technicalVisits} />
    </div>
  );
}
