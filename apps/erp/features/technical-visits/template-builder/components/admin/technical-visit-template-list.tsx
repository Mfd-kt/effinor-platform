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
import { TechnicalVisitTemplateDeleteButton } from "@/features/technical-visits/template-builder/components/admin/technical-visit-template-delete-button";
import type { TechnicalVisitTemplateAdminListItem } from "@/features/technical-visits/template-builder/queries/get-technical-visit-templates-admin";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TechnicalVisitTemplateList({ items }: { items: TechnicalVisitTemplateAdminListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Aucune template builder. Créez-en une pour commencer.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Clé</TableHead>
            <TableHead>Fiche CEE</TableHead>
            <TableHead>Version publiée</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Mise à jour</TableHead>
            <TableHead className="min-w-[200px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.template_key}</code>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {row.cee_sheet_label ? (
                  <span>{row.cee_sheet_label}</span>
                ) : (
                  <span className="italic">—</span>
                )}
              </TableCell>
              <TableCell>
                {row.latest_published_version != null ? (
                  <span className="text-sm">
                    v{row.latest_published_version}
                    {row.latest_published_at ? (
                      <span className="ml-1 text-muted-foreground text-xs">
                        ({formatDateFr(row.latest_published_at)})
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm italic">Aucune</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {!row.is_active ? (
                    <Badge variant="secondary">Inactive</Badge>
                  ) : (
                    <Badge variant="default">Active</Badge>
                  )}
                  {row.draft_exists ? <Badge variant="outline">Brouillon</Badge> : null}
                </div>
              </TableCell>
              <TableCell className="text-right text-muted-foreground text-sm">
                {formatDateFr(row.updated_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link
                    href={`/admin/technical-visit-templates/${row.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-underline")}
                  >
                    Ouvrir
                  </Link>
                  <TechnicalVisitTemplateDeleteButton
                    templateId={row.id}
                    label={row.label}
                    templateKey={row.template_key}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
