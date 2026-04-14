import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DocumentsFilters } from "@/features/documents/components/documents-filters";
import { DocumentsTable } from "@/features/documents/components/documents-table";
import { getDocuments } from "@/features/documents/queries/get-documents";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessDocumentsModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { DocumentStatus, DocumentType } from "@/types/database.types";
import {
  DOCUMENT_STATUS_VALUES,
  DOCUMENT_TYPE_VALUES,
} from "@/features/documents/schemas/document.schema";
import { FileStack } from "lucide-react";

const VALID_TYPES: DocumentType[] = [...DOCUMENT_TYPE_VALUES];
const VALID_STATUSES: DocumentStatus[] = [...DOCUMENT_STATUS_VALUES];

function isDocumentType(v: string): v is DocumentType {
  return VALID_TYPES.includes(v as DocumentType);
}

function isDocumentStatus(v: string): v is DocumentStatus {
  return VALID_STATUSES.includes(v as DocumentStatus);
}

type PageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
  }>;
};

export default async function DocumentsPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessDocumentsModule(access)) {
    notFound();
  }
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rawType = typeof sp.type === "string" ? sp.type : "all";
  const rawStatus = typeof sp.status === "string" ? sp.status : "all";

  const typeFilter: DocumentType | undefined =
    rawType !== "all" && isDocumentType(rawType) ? rawType : undefined;

  const statusFilter: DocumentStatus | undefined =
    rawStatus !== "all" && isDocumentStatus(rawStatus) ? rawStatus : undefined;

  let documents;
  try {
    documents = await getDocuments({
      q: q || undefined,
      document_type: typeFilter,
      document_status: statusFilter,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur lors du chargement des documents.";
    return (
      <div>
        <PageHeader
          title="Documents"
          description="Référentiel central : types, statuts, conformité, versions et métadonnées fichier."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  const hasFilters = Boolean(q.trim()) || rawType !== "all" || rawStatus !== "all";

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Référentiel central : types, statuts, conformité, versions et métadonnées fichier (Storage à brancher plus tard)."
        actions={
          <Link href="/documents/new" className={cn(buttonVariants())}>
            Nouveau document
          </Link>
        }
      />

      <DocumentsFilters defaultQ={q} defaultType={rawType} defaultStatus={rawStatus} />

      {documents.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun résultat" : "Aucun document"}
          description={
            hasFilters
              ? "Modifiez les filtres ou créez une nouvelle entrée."
              : "Créez une pièce dans le référentiel documentaire."
          }
          icon={<FileStack className="size-10 opacity-50" />}
          action={
            <Link href="/documents/new" className={cn(buttonVariants())}>
              Nouveau document
            </Link>
          }
        />
      ) : (
        <DocumentsTable data={documents} />
      )}
    </div>
  );
}
