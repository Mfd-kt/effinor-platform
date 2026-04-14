import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { DocumentForm } from "@/features/documents/components/document-form";
import { getDocumentFormOptions } from "@/features/documents/queries/get-document-form-options";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessDocumentsModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function NewDocumentPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessDocumentsModule(access)) {
    notFound();
  }
  const options = await getDocumentFormOptions();

  return (
    <div>
      <PageHeader
        title="Nouveau document"
        description="Ajout au référentiel documentaire."
        actions={
          <Link href="/documents" className={cn(buttonVariants({ variant: "outline" }))}>
            Retour à la liste
          </Link>
        }
      />

      <DocumentForm mode="create" options={options} className="max-w-4xl" />
    </div>
  );
}
