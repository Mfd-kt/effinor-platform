import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ExistingHeatingForm } from "@/features/existing-heating/components/existing-heating-form";
import { getExistingHeatingFormOptions } from "@/features/existing-heating/queries/get-existing-heating-form-options";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessExistingHeatingModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function NewExistingHeatingPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessExistingHeatingModule(access)) {
    notFound();
  }
  const options = await getExistingHeatingFormOptions();

  const canCreate = options.heatingModels.length > 0;

  return (
    <div>
      <PageHeader
        title="Nouveau chauffage existant"
        description="Unité rattachée à un modèle du catalogue (puissances et notes terrain)."
        actions={
          <Link href="/existing-heating" className={cn(buttonVariants({ variant: "outline" }))}>
            Retour à la liste
          </Link>
        }
      />

      {!canCreate ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground">
          Aucun modèle de chauffage en base. Les modèles catalogue doivent être créés en base (table{" "}
          <code className="rounded bg-muted px-1">heating_models</code>) avant d’enregistrer l’existant.
        </p>
      ) : (
        <ExistingHeatingForm mode="create" options={options} className="max-w-4xl" />
      )}
    </div>
  );
}
