import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicalVisitTemplateMetaForm } from "@/features/technical-visits/template-builder/components/admin/technical-visit-template-meta-form";
import { TechnicalVisitTemplateVersionsTable } from "@/features/technical-visits/template-builder/components/admin/technical-visit-template-versions-table";
import { getTechnicalVisitTemplateDetailForAdmin } from "@/features/technical-visits/template-builder/queries/get-technical-visit-templates-admin";
import { requireCeeAdminAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ templateId: string }> };

export default async function TechnicalVisitTemplateDetailPage({ params }: PageProps) {
  await requireCeeAdminAccess();
  const { templateId } = await params;
  const supabase = await createClient();
  const detail = await getTechnicalVisitTemplateDetailForAdmin(supabase, templateId);
  if (!detail) {
    notFound();
  }

  const ceeSheets: { id: string; label: string }[] = [];
  const draftExists = detail.versions.some((v) => v.status === "draft");
  const hasPublished = detail.versions.some((v) => v.status === "published");
  const canStartNewDraft = !draftExists && hasPublished;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <PageHeader
        title={detail.master.label}
        description={
          <>
            Clé technique{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-sm">{detail.master.template_key}</code>
          </>
        }
        actions={
          <Link
            href="/admin/technical-visit-templates"
            className={cn(buttonVariants({ variant: "outline" }), "no-underline")}
          >
            Liste
          </Link>
        }
      />

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métadonnées</CardTitle>
            <CardDescription>Libellé affiché, fiche CEE suggérée, activation.</CardDescription>
          </CardHeader>
          <CardContent>
            <TechnicalVisitTemplateMetaForm
              templateId={detail.master.id}
              initialLabel={detail.master.label}
              initialDescription={detail.master.description}
              initialCeeSheetId={detail.master.cee_sheet_id}
              initialIsActive={detail.master.is_active}
              ceeSheets={ceeSheets}
              canStartNewDraft={canStartNewDraft}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Versions</CardTitle>
            <CardDescription>
              Une version publiée ne s’édite pas : utilisez « Modifier le formulaire (brouillon) » pour cloner la
              dernière publication, puis publiez la nouvelle version (même clé template, numéro suivant).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TechnicalVisitTemplateVersionsTable templateId={detail.master.id} versions={detail.versions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
