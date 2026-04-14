import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ExistingHeatingForm } from "@/features/existing-heating/components/existing-heating-form";
import { ExistingHeatingRelationsSection } from "@/features/existing-heating/components/existing-heating-relations-section";
import { ExistingHeatingSummaryCards } from "@/features/existing-heating/components/existing-heating-summary-cards";
import { formatHeatingModelLabel } from "@/features/existing-heating/constants";
import { existingHeatingRowToFormValues } from "@/features/existing-heating/lib/form-defaults";
import { getExistingHeatingUnitById } from "@/features/existing-heating/queries/get-existing-heating-unit-by-id";
import { getExistingHeatingFormOptions } from "@/features/existing-heating/queries/get-existing-heating-form-options";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessExistingHeatingModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ExistingHeatingDetailPage({ params }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessExistingHeatingModule(access)) {
    notFound();
  }
  const { id } = await params;
  const [row, options] = await Promise.all([
    getExistingHeatingUnitById(id),
    getExistingHeatingFormOptions(),
  ]);

  if (!row) {
    notFound();
  }

  const hm = row.heating_models;
  const title =
    hm != null
      ? formatHeatingModelLabel({
          brand: hm.brand,
          model: hm.model,
          power_kw: hm.power_kw,
        })
      : "Chauffage existant";

  return (
    <div>
      <PageHeader
        title={title}
        description={
          <span className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <span className="font-mono text-xs text-foreground/90">{row.id}</span>
            <span>Màj {formatDateFr(row.updated_at)}</span>
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/existing-heating" className={cn(buttonVariants({ variant: "outline" }))}>
              Retour à la liste
            </Link>
          </div>
        }
      />

      <ExistingHeatingSummaryCards unit={row} />

      <ExistingHeatingRelationsSection unit={row} />

      <ExistingHeatingForm
        key={row.id}
        mode="edit"
        existingHeatingUnitId={row.id}
        defaultValues={existingHeatingRowToFormValues(row)}
        options={options}
        className="max-w-4xl"
      />
    </div>
  );
}
