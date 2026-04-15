import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { TechnicalVisitTemplateCreateForm } from "@/features/technical-visits/template-builder/components/admin/technical-visit-template-create-form";
import { getAdminCeeSheets } from "@/features/cee-workflows/queries/get-admin-cee-sheets";
import { requireCeeAdminAccess } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

export default async function NewTechnicalVisitTemplatePage() {
  await requireCeeAdminAccess();
  const sheets = await getAdminCeeSheets();
  const ceeSheets = sheets.map((s) => ({ id: s.id, label: `${s.code} — ${s.name}` }));

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
