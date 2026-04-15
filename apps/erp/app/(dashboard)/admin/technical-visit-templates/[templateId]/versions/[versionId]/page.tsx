import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { TechnicalVisitTemplateArchiveButton } from "@/features/technical-visits/template-builder/components/admin/technical-visit-template-archive-button";
import { TechnicalVisitTemplateCreateDraftForEditButton } from "@/features/technical-visits/template-builder/components/admin/technical-visit-template-create-draft-for-edit-button";
import { TechnicalVisitTemplateVersionEditor } from "@/features/technical-visits/template-builder/components/admin/technical-visit-template-version-editor";
import {
  getTechnicalVisitTemplateDraftEligibility,
  getTechnicalVisitTemplateVersionForEditor,
} from "@/features/technical-visits/template-builder/queries/get-technical-visit-templates-admin";
import { parseVisitTemplateBuilderJson } from "@/features/technical-visits/template-builder/schemas/visit-template-builder.schema";
import { requireCeeAdminAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ templateId: string; versionId: string }> };

export default async function TechnicalVisitTemplateVersionEditorPage({ params }: PageProps) {
  await requireCeeAdminAccess();
  const { templateId, versionId } = await params;
  const supabase = await createClient();
  const bundle = await getTechnicalVisitTemplateVersionForEditor(supabase, versionId);
  if (!bundle || bundle.master.id !== templateId) {
    notFound();
  }

  const { version, master } = bundle;
  let schema;
  try {
    schema = parseVisitTemplateBuilderJson(version.schema_json);
  } catch {
    notFound();
  }

  const readOnly = version.status !== "draft";

  const draftEligibility =
    readOnly && version.status === "published"
      ? await getTechnicalVisitTemplateDraftEligibility(supabase, templateId)
      : null;

  const canCreateDraftForEdit =
    draftEligibility != null &&
    !draftEligibility.draftExists &&
    draftEligibility.latestPublished != null;
  const draftBlockedReason = draftEligibility?.draftExists
    ? "Un brouillon existe déjà : ouvrez-le depuis la fiche template ou la liste des versions, puis publiez-le avant d’en créer un autre."
    : draftEligibility != null && !draftEligibility.latestPublished
      ? "Aucune version publiée à dupliquer."
      : undefined;
  const notLatestPublished =
    draftEligibility?.latestPublished != null &&
    draftEligibility.latestPublished.id !== version.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <PageHeader
        title={`Builder — v${version.version_number}`}
        description={
          readOnly
            ? "Version publiée ou archivée : lecture seule."
            : "Modifiez les sections et champs, enregistrez le brouillon, puis publiez."
        }
        actions={
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/technical-visit-templates/${templateId}`}
                className={cn(buttonVariants({ variant: "outline" }), "no-underline")}
              >
                Fiche template
              </Link>
              {readOnly && version.status === "published" ? (
                <TechnicalVisitTemplateArchiveButton versionId={version.id} templateId={templateId} />
              ) : null}
            </div>
            {readOnly && version.status === "published" ? (
              <TechnicalVisitTemplateCreateDraftForEditButton
                templateId={templateId}
                disabled={!canCreateDraftForEdit}
                disabledReason={draftBlockedReason}
              />
            ) : null}
          </div>
        }
      />

      {readOnly && version.status === "published" && notLatestPublished && draftEligibility?.latestPublished ? (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          Le prochain brouillon sera une copie de la <strong>v{draftEligibility.latestPublished.version_number}</strong>{" "}
          (dernière version publiée), pas de la v{version.version_number}. Ouvrez la v
          {draftEligibility.latestPublished.version_number} pour prévisualiser exactement ce qui sera repris.
        </div>
      ) : null}

      {readOnly && version.status === "published" && !notLatestPublished ? (
        <div className="mb-6 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Pour changer ce formulaire sans créer une nouvelle fiche template : créez un <strong>brouillon</strong> (même
          clé <code className="rounded bg-muted px-1">{master.template_key}</code>), modifiez-le, puis publiez. Ensuite,
          sur la fiche CEE, passez la <strong>version</strong> à la nouvelle (ex. v2) si besoin.
        </div>
      ) : null}

      <TechnicalVisitTemplateVersionEditor
        versionId={version.id}
        templateId={templateId}
        initialSchema={schema}
        readOnly={readOnly}
        masterLabel={master.label}
      />
    </div>
  );
}
