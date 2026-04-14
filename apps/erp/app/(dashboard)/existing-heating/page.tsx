import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ExistingHeatingFilters } from "@/features/existing-heating/components/existing-heating-filters";
import { ExistingHeatingTable } from "@/features/existing-heating/components/existing-heating-table";
import { getExistingHeatingFormOptions } from "@/features/existing-heating/queries/get-existing-heating-form-options";
import { getExistingHeatingUnits } from "@/features/existing-heating/queries/get-existing-heating-units";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessExistingHeatingModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    heating_model_id?: string;
  }>;
};

export default async function ExistingHeatingPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessExistingHeatingModule(access)) {
    notFound();
  }
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rawModel = typeof sp.heating_model_id === "string" ? sp.heating_model_id : "all";

  const modelFilter =
    rawModel !== "all" && rawModel.trim() !== "" ? rawModel.trim() : undefined;

  let units;
  try {
    units = await getExistingHeatingUnits({
      q: q || undefined,
      heating_model_id: modelFilter,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur lors du chargement du chauffage existant.";
    return (
      <div>
        <PageHeader
          title="Chauffage existant"
          description="Unités observées, liées aux modèles catalogue."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  const options = await getExistingHeatingFormOptions();

  const hasFilters = Boolean(q.trim()) || rawModel !== "all";

  return (
    <div>
      <PageHeader
        title="Chauffage existant"
        description="Inventaire : modèles, quantités, puissances — base pour études et devis."
        actions={
          <Link href="/existing-heating/new" className={cn(buttonVariants())}>
            Nouveau chauffage existant
          </Link>
        }
      />

      <ExistingHeatingFilters
        defaultQ={q}
        defaultHeatingModelId={rawModel}
        options={options}
      />

      {units.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun résultat" : "Aucune unité enregistrée"}
          description={
            hasFilters
              ? "Modifiez les filtres ou créez une nouvelle fiche."
              : "Enregistrez une unité avec un modèle de chauffage du catalogue."
          }
          icon={<Flame className="size-10 opacity-50" />}
          action={
            <Link href="/existing-heating/new" className={cn(buttonVariants())}>
              Nouveau chauffage existant
            </Link>
          }
        />
      ) : (
        <ExistingHeatingTable data={units} />
      )}
    </div>
  );
}
