import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button-variants";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/features/documents/constants";
import {
  DOCUMENT_STATUS_VALUES,
  DOCUMENT_TYPE_VALUES,
} from "@/features/documents/schemas/document.schema";
import type { DocumentStatus, DocumentType } from "@/types/database.types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

const VALID_TYPES: DocumentType[] = [...DOCUMENT_TYPE_VALUES];
const VALID_STATUSES: DocumentStatus[] = [...DOCUMENT_STATUS_VALUES];

function isDocumentType(v: string): v is DocumentType {
  return VALID_TYPES.includes(v as DocumentType);
}

function isDocumentStatus(v: string): v is DocumentStatus {
  return VALID_STATUSES.includes(v as DocumentStatus);
}

type DocumentsFiltersProps = {
  defaultQ: string;
  defaultType: string;
  defaultStatus: string;
};

export function DocumentsFilters({ defaultQ, defaultType, defaultStatus }: DocumentsFiltersProps) {
  return (
    <form
      method="get"
      action="/documents"
      className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="min-w-[200px] flex-1 space-y-2">
        <Label htmlFor="filter-doc-q">Recherche</Label>
        <Input
          id="filter-doc-q"
          name="q"
          defaultValue={defaultQ}
          placeholder="Sous-type, n°, commentaire, type MIME…"
        />
      </div>
      <div className="w-full min-w-[160px] sm:w-44">
        <div className="space-y-2">
          <Label htmlFor="filter-doc-type">Type</Label>
          <select
            id="filter-doc-type"
            name="type"
            defaultValue={defaultType}
            className={selectClassName}
          >
            <option value="all">Tous les types</option>
            {DOCUMENT_TYPE_VALUES.filter(isDocumentType).map((value) => (
              <option key={value} value={value}>
                {DOCUMENT_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full min-w-[160px] sm:w-44">
        <div className="space-y-2">
          <Label htmlFor="filter-doc-status">Statut</Label>
          <select
            id="filter-doc-status"
            name="status"
            defaultValue={defaultStatus}
            className={selectClassName}
          >
            <option value="all">Tous les statuts</option>
            {DOCUMENT_STATUS_VALUES.filter(isDocumentStatus).map((value) => (
              <option key={value} value={value}>
                {DOCUMENT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className={cn(buttonVariants())}>
        Filtrer
      </button>
    </form>
  );
}
