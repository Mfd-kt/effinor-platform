import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { OperationSiteForm } from "@/features/operation-sites/components/operation-site-form";
import { getOperationSiteFormOptions } from "@/features/operation-sites/queries/get-operation-site-form-options";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessOperationSitesModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function NewOperationSitePage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessOperationSitesModule(access)) {
    notFound();
  }
  const options = await getOperationSiteFormOptions();

  return (
    <div>
      <PageHeader
        title="Nouveau site technique"
        description="Déclaration d’un lieu d’intervention rattaché à une opération CEE."
        actions={
          <Link href="/operation-sites" className={cn(buttonVariants({ variant: "outline" }))}>
            Retour à la liste
          </Link>
        }
      />

      {options.operations.length === 0 ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground">
          Aucune opération en base.{" "}
          <Link href="/operations/new" className="font-medium underline underline-offset-4">
            Créer une opération
          </Link>{" "}
          avant d’ajouter un site technique.
        </p>
      ) : (
        <OperationSiteForm mode="create" options={options} className="max-w-4xl" />
      )}
    </div>
  );
}
