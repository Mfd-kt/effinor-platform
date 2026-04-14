import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BeneficiariesFilters } from "@/features/beneficiaries/components/beneficiaries-filters";
import { BeneficiariesTable } from "@/features/beneficiaries/components/beneficiaries-table";
import { getBeneficiaries } from "@/features/beneficiaries/queries/get-beneficiaries";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessBeneficiariesModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { BeneficiaryStatus } from "@/types/database.types";
import { Building2 } from "lucide-react";

const VALID_STATUSES: BeneficiaryStatus[] = [
  "prospect",
  "active",
  "inactive",
  "blocked",
];

function isBeneficiaryStatus(v: string): v is BeneficiaryStatus {
  return VALID_STATUSES.includes(v as BeneficiaryStatus);
}

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

export default async function BeneficiariesPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessBeneficiariesModule(access)) {
    notFound();
  }

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rawStatus = typeof sp.status === "string" ? sp.status : "all";

  const statusFilter: BeneficiaryStatus | undefined =
    rawStatus !== "all" && isBeneficiaryStatus(rawStatus) ? rawStatus : undefined;

  let beneficiaries;
  try {
    beneficiaries = await getBeneficiaries(
      {
        q: q || undefined,
        status: statusFilter,
      },
      access,
    );
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur lors du chargement des bénéficiaires.";
    return (
      <div>
        <PageHeader
          title="Bénéficiaires"
          description="Entreprises et contacts : siège, chantier, zone climatique."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  const hasFilters = Boolean(q.trim()) || rawStatus !== "all";

  return (
    <div>
      <PageHeader
        title="Bénéficiaires"
        description="Entreprises et contacts : siège, chantier, zone climatique."
        actions={
          <Link
            href="/beneficiaries/new"
            className={cn(buttonVariants())}
          >
            Nouveau bénéficiaire
          </Link>
        }
      />

      <BeneficiariesFilters defaultQ={q} defaultStatus={rawStatus} />

      {beneficiaries.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun résultat" : "Aucun bénéficiaire"}
          description={
            hasFilters
              ? "Modifiez les filtres ou créez une nouvelle fiche."
              : "Créez un premier bénéficiaire pour préparer les dossiers CEE."
          }
          icon={<Building2 className="size-10 opacity-50" />}
          action={
            <Link href="/beneficiaries/new" className={cn(buttonVariants())}>
              Nouveau bénéficiaire
            </Link>
          }
        />
      ) : (
        <BeneficiariesTable data={beneficiaries} />
      )}
    </div>
  );
}
