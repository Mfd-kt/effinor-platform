import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAP_SOURCE_CODE } from "@/features/lead-generation/apify/sources/pap/config";
import { PAP_REJECT_INSPECT_LIMIT, type PapRejectInspectEntry } from "@/features/lead-generation/apify/sources/pap/map-item";

function parseRejectRows(metadata: Record<string, unknown>): PapRejectInspectEntry[] {
  const raw = metadata.pap_rejected_inspection;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (row): row is PapRejectInspectEntry =>
      row &&
      typeof row === "object" &&
      (row as PapRejectInspectEntry).stage !== undefined &&
      typeof (row as PapRejectInspectEntry).reason === "string",
  ) as PapRejectInspectEntry[];
}

type Props = {
  source: string;
  rejectedCount: number;
  metadata: Record<string, unknown> | null;
};

/**
 * Tableau d’inspection des annonces PAP rejetées (Zod ou filtre CEE), persistées dans `metadata_json`.
 */
export function PapImportRejectedInspect({ source, rejectedCount, metadata }: Props) {
  if (source !== PAP_SOURCE_CODE) return null;

  const meta =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? metadata
      : ({} as Record<string, unknown>);
  const rows = parseRejectRows(meta);
  const total =
    typeof meta.pap_rejected_inspection_total === "number"
      ? meta.pap_rejected_inspection_total
      : rejectedCount;
  const capped = meta.pap_rejected_inspection_capped === true;

  if (rejectedCount <= 0) return null;

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Annonces rejetées (inspection)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Ce lot a <strong className="text-foreground">{rejectedCount}</strong> rejet(s), mais aucun détail
            n&apos;est encore enregistré. Depuis la <strong className="text-foreground">liste Imports</strong>, cliquez
            sur <strong className="text-foreground">Actualiser</strong> sur ce lot PAP : une nouvelle synchronisation
            remplit l&apos;échantillon inspectable (jusqu&apos;à {PAP_REJECT_INSPECT_LIMIT} lignes).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Annonces rejetées (inspection)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Échantillon de {rows.length} ligne{rows.length > 1 ? "s" : ""}
          {total > rows.length ? ` sur ${total} rejet(s) au total` : ""}
          {capped ? ` — plafonné à ${PAP_REJECT_INSPECT_LIMIT} pour la taille des métadonnées.` : "."}
        </p>
      </CardHeader>
      <CardContent className="max-h-[min(70vh,560px)] overflow-auto p-0 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Étape</TableHead>
              <TableHead className="w-[120px]">Id</TableHead>
              <TableHead className="min-w-[180px]">Titre</TableHead>
              <TableHead className="min-w-[200px]">Motif</TableHead>
              <TableHead className="w-[90px] text-right">Lien</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={`${row.external_id ?? i}-${i}`}>
                <TableCell className="align-top text-xs font-medium">
                  {row.stage === "zod" ? "Forme" : "Filtre CEE"}
                </TableCell>
                <TableCell className="align-top font-mono text-xs">{row.external_id ?? "—"}</TableCell>
                <TableCell className="align-top text-xs text-muted-foreground">
                  {row.titre ?? "—"}
                </TableCell>
                <TableCell className="align-top text-xs">{row.reason}</TableCell>
                <TableCell className="align-top text-right">
                  {row.url ? (
                    <Link
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      PAP
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
