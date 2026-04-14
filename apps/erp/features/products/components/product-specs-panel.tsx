"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/types/database.types";

type SpecRow = Database["public"]["Tables"]["product_specs"]["Row"];
type MetricRow = Database["public"]["Tables"]["product_key_metrics"]["Row"];

type Props = {
  specs: SpecRow[];
  keyMetrics: MetricRow[];
};

export function ProductSpecsPanel({ specs, keyMetrics }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-base font-semibold">Caractéristiques techniques</h3>
        {specs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune caractéristique enregistrée.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clé</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Groupe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {s.spec_key}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{s.spec_label}</TableCell>
                  <TableCell>{s.spec_value}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.spec_group ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-base font-semibold">Repères clés</h3>
        {keyMetrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun repère clé enregistré.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {keyMetrics.map((m) => (
              <Badge key={m.id} variant="outline" className="text-xs">
                {m.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
