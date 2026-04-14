import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { createOperation } from "@/features/operations/actions/create-operation";
import { OperationForm } from "@/features/operations/components/operation-form";
import { mergeSuggestedKeyDates } from "@/features/operations/lib/merge-suggested-key-dates";
import { buildOperationCreateDefaultsFromSearchParams } from "@/features/operations/lib/operation-form-from-search-params";
import { getOperationKeyDateSuggestions } from "@/features/operations/queries/get-operation-key-date-suggestions";
import { getOperationFormOptions } from "@/features/operations/queries/get-operation-form-options";
import { buttonVariants } from "@/components/ui/button-variants";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessOperationsModule } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewOperationPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessOperationsModule(access)) {
    notFound();
  }

  const [options, sp] = await Promise.all([getOperationFormOptions(access), searchParams]);
  const baseDefaults = buildOperationCreateDefaultsFromSearchParams(sp, options);
  const supabase = await createClient();
  const vtSuggestions = await getOperationKeyDateSuggestions(supabase, {
    operationId: null,
    referenceTechnicalVisitId: baseDefaults.reference_technical_visit_id ?? null,
  });
  const defaultValues = mergeSuggestedKeyDates(baseDefaults, vtSuggestions);
  const lockedBeneficiaryId = Boolean(defaultValues.beneficiary_id);
  const lockedReferenceTechnicalVisitId = Boolean(defaultValues.reference_technical_visit_id);

  const beneficiaryKey =
    typeof sp.beneficiary_id === "string"
      ? sp.beneficiary_id
      : Array.isArray(sp.beneficiary_id)
        ? sp.beneficiary_id[0]
        : "";
  const vtKey =
    typeof sp.reference_technical_visit_id === "string"
      ? sp.reference_technical_visit_id
      : Array.isArray(sp.reference_technical_visit_id)
        ? sp.reference_technical_visit_id[0]
        : "";

  const backHref =
    defaultValues.beneficiary_id && String(defaultValues.beneficiary_id).trim()
      ? `/beneficiaries/${defaultValues.beneficiary_id}`
      : "/beneficiaries";
  const backLabel =
    defaultValues.beneficiary_id && String(defaultValues.beneficiary_id).trim()
      ? "Retour au bénéficiaire"
      : "Retour aux bénéficiaires";

  return (
    <div>
      <PageHeader
        title="Nouvelle opération"
        description="Création d’un dossier CEE lié à un bénéficiaire. Les pièces jointes et sites techniques viendront ensuite."
        actions={
          <Link href={backHref} className={cn(buttonVariants({ variant: "outline" }))}>
            {backLabel}
          </Link>
        }
      />
      {options.beneficiaries.length === 0 ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground">
          Aucun bénéficiaire en base.{" "}
          <Link href="/beneficiaries/new" className="font-medium underline underline-offset-4">
            Créer un bénéficiaire
          </Link>{" "}
          avant d’ouvrir une opération.
        </p>
      ) : (
        <OperationForm
          key={`create-op-${beneficiaryKey}-${vtKey}`}
          mode="create"
          createOperationAction={createOperation}
          options={options}
          defaultValues={defaultValues}
          lockedBeneficiaryId={lockedBeneficiaryId}
          lockedReferenceTechnicalVisitId={lockedReferenceTechnicalVisitId}
          className="max-w-4xl"
        />
      )}
    </div>
  );
}
