import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { TechnicalStudyForm } from "@/features/technical-studies/components/technical-study-form";
import { getTechnicalStudyFormOptions } from "@/features/technical-studies/queries/get-technical-study-form-options";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessTechnicalStudiesModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function NewTechnicalStudyPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessTechnicalStudiesModule(access)) {
    notFound();
  }
  const options = await getTechnicalStudyFormOptions();

  return (
    <div>
      <PageHeader
        title="Nouvelle étude technique"
        description="Création d’une fiche d’étude liée à un document du référentiel (NDD, éclairage, analyse, etc.)."
        actions={
          <Link href="/technical-studies" className={cn(buttonVariants({ variant: "outline" }))}>
            Retour à la liste
          </Link>
        }
      />

      {options.documents.length === 0 ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground">
          Aucun document dans le référentiel.{" "}
          <Link href="/documents/new" className="font-medium underline underline-offset-4">
            Créer un document
          </Link>{" "}
          avant d’enregistrer une étude.
        </p>
      ) : (
        <TechnicalStudyForm mode="create" options={options} className="max-w-4xl" />
      )}
    </div>
  );
}
