import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { TechnicalVisitTemplateCreateForm } from "@/features/technical-visits/template-builder/components/admin/technical-visit-template-create-form";
import { requireCeeAdminAccess } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

export default async function NewTechnicalVisitTemplatePage() {
  await requireCeeAdminAccess();
  const ceeSheets: { id: string; label: string }[] = [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <PageHeader
        title="Nouvelle template VT"
        description="Étape 1 : identité métier. La première version sera créée en brouillon (non publiée)."
        actions={
          <Link
            href="/admin/technical-visit-templates"
            className={cn(buttonVariants({ variant: "outline" }), "no-underline")}
          >
            Retour à la liste
          </Link>
        }
      />
      <TechnicalVisitTemplateCreateForm ceeSheets={ceeSheets} />
    </div>
  );
}
