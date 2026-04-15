import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TechnicalVisitTemplateVersionRow } from "@/features/technical-visits/template-builder/queries/get-technical-visit-templates-admin";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TechnicalVisitTemplateVersionsTable({
  templateId,
  versions,
}: {
  templateId: string;
  versions: TechnicalVisitTemplateVersionRow[];
}) {
  if (versions.length === 0) {
    return <p className="text-muted-foreground text-sm">Aucune version.</p>;
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Publiée le</TableHead>
            <TableHead>Mise à jour</TableHead>
            <TableHead className="w-[120px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-mono font-medium">v{v.version_number}</TableCell>
              <TableCell>
                {v.status === "published" ? (
                  <Badge>Publiée</Badge>
                ) : v.status === "draft" ? (
                  <Badge variant="outline">Brouillon</Badge>
                ) : (
                  <Badge variant="secondary">Archivée</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {v.published_at ? formatDateFr(v.published_at) : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{formatDateFr(v.updated_at)}</TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/admin/technical-visit-templates/${templateId}/versions/${v.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-underline")}
                >
                  {v.status === "draft" ? "Éditer" : "Voir"}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
