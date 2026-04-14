import Link from "next/link";

import { getAccessContext } from "@/lib/auth/access-context";
import { getOperationById } from "@/features/operations/queries/get-operation-by-id";

type OperationContextBannerProps = {
  operationId: string;
};

/**
 * Bandeau discret lorsqu’une liste est ouverte avec `?operation_id=` (lien depuis la fiche dossier).
 */
export async function OperationContextBanner({ operationId }: OperationContextBannerProps) {
  const access = await getAccessContext();
  const op = await getOperationById(
    operationId.trim(),
    access.kind === "authenticated" ? access : undefined,
  );
  if (!op) {
    return (
      <div className="mb-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Filtre opération : identifiant inconnu ou dossier supprimé.
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
      <span className="text-muted-foreground">Contexte dossier : </span>
      <Link
        href={`/operations/${op.id}`}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        <span className="font-mono">{op.operation_reference}</span>
        <span className="text-muted-foreground"> · </span>
        {op.title}
      </Link>
    </div>
  );
}
