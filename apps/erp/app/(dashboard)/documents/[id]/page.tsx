import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { DocumentForm } from "@/features/documents/components/document-form";
import { DocumentRelationsSection } from "@/features/documents/components/document-relations-section";
import { DocumentSummaryCards } from "@/features/documents/components/document-summary-cards";
import { DOCUMENT_TYPE_LABELS } from "@/features/documents/constants";
import { DocumentStatusBadge } from "@/features/documents/components/document-status-badge";
import { documentRowToFormValues } from "@/features/documents/lib/form-defaults";
import { getDocumentById } from "@/features/documents/queries/get-document-by-id";
import { getDocumentFormOptions } from "@/features/documents/queries/get-document-form-options";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessDocumentsModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentDetailPage({ params }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessDocumentsModule(access)) {
    notFound();
  }
  const { id } = await params;
  const [row, options] = await Promise.all([getDocumentById(id), getDocumentFormOptions()]);

  if (!row) {
    notFound();
  }

  const typeLabel = DOCUMENT_TYPE_LABELS[row.document_type];

  return (
    <div>
      <PageHeader
        title={typeLabel}
        description={
          <span className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <span className="font-mono text-xs text-foreground/90">{row.document_number ?? "Sans n°"}</span>
            <span>Màj {formatDateFr(row.updated_at)}</span>
            <span className="font-mono text-xs text-foreground/80">{row.id}</span>
            <DocumentStatusBadge status={row.document_status} />
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/documents" className={cn(buttonVariants({ variant: "outline" }))}>
              Retour à la liste
            </Link>
          </div>
        }
      />

      <DocumentSummaryCards document={row} />

      <DocumentRelationsSection />

      <DocumentForm
        key={row.id}
        mode="edit"
        documentId={row.id}
        defaultValues={documentRowToFormValues(row)}
        options={options}
        className="max-w-4xl"
      />
    </div>
  );
}
