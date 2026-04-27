import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LgcToCrmConversionRow } from "@/features/lead-generation/queries/get-agent-lgc-to-crm-conversions";

function fmtShort(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
  } catch {
    return iso;
  }
}

type Props = {
  periodDescription: string;
  countInRange: number;
  recent: LgcToCrmConversionRow[];
};

/**
 * Fiches `leads` issues de la lead gen (lien `lead_generation_stock_id`) — sans KPI pipe (qualifié, signé, visites).
 */
export function SalesAgentLgcCrmProspectsBlock({ periodDescription, countInRange, recent }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Lead gen → prospect CRM</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Fiches créées à partir de votre stock (conversions) sur {periodDescription}. Accès ponctuel à la fiche CRM si
            besoin ; le travail quotidien reste sur les fiches lead gen.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Conversions sur la période</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{countInRange}</p>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune fiche prospect créée depuis le stock sur cette période.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">Créé le</TableHead>
                  <TableHead>Société</TableHead>
                  <TableHead className="w-[120px] text-right">Fiche</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
                      {fmtShort(r.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{r.companyName}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/leads/${r.id}`}
                        className="text-sm text-primary hover:underline"
                        prefetch={false}
                      >
                        Ouvrir
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
