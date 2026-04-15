import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { TechnicalVisitTemplateList } from "@/features/technical-visits/template-builder/components/admin/technical-visit-template-list";
import { getTechnicalVisitTemplatesAdminList } from "@/features/technical-visits/template-builder/queries/get-technical-visit-templates-admin";
import { requireCeeAdminAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function AdminTechnicalVisitTemplatesPage() {
  await requireCeeAdminAccess();
  const supabase = await createClient();
  const items = await getTechnicalVisitTemplatesAdminList(supabase);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <PageHeader
        title="Templates visite technique (builder)"
        description="Créez des gabarits sans code, publiez des versions, puis rattachez-les aux fiches CEE."
        actions={
          <Link
            href="/admin/technical-visit-templates/new"
            className={cn(buttonVariants({ variant: "default" }), "no-underline")}
          >
            Nouvelle template
          </Link>
        }
      />
      <TechnicalVisitTemplateList items={items} />
    </div>
  );
}
