"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ceeSheetVtConfigStatusLabel,
  resolveCeeSheetVtConfigStatus,
} from "@/features/cee-workflows/lib/cee-sheet-vt-config-status";
import type { AdminCeeSheetListItem } from "@/features/cee-workflows/queries/get-admin-cee-sheets";

export function CeeSheetList({
  sheets,
  selectedSheetId,
  onSelect,
  onCreate,
  onToggleActive,
}: {
  sheets: AdminCeeSheetListItem[];
  selectedSheetId: string | null;
  onSelect: (sheetId: string) => void;
  onCreate: () => void;
  onToggleActive: (sheet: AdminCeeSheetListItem) => void;
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Fiches CEE</CardTitle>
          <CardDescription>Référentiel métier et état de configuration des équipes.</CardDescription>
        </div>
        <Button onClick={onCreate}>Nouvelle fiche CEE</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {sheets.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">
            Aucune fiche CEE configurée.
          </div>
        ) : (
          sheets.map((sheet) => {
            const active = sheet.id === selectedSheetId;
            const vtStatus = resolveCeeSheetVtConfigStatus(sheet);
            return (
              <div
                key={sheet.id}
                className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  active ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(sheet.id)}
                  className={`min-w-0 flex-1 rounded-lg text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring ${
                    active ? "" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="font-medium text-foreground">{sheet.name}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="secondary">{sheet.code}</Badge>
                    {sheet.simulatorKey ? <Badge variant="outline">{sheet.simulatorKey}</Badge> : null}
                    <Badge variant={sheet.isCommercialActive ? "default" : "secondary"}>
                      {sheet.isCommercialActive ? "Active" : "Inactive"}
                    </Badge>
                    {sheet.teamConfigured ? (
                      <Badge variant="outline">{sheet.memberCount} membre(s)</Badge>
                    ) : (
                      <Badge variant="destructive">Sans équipe</Badge>
                    )}
                    <Badge
                      variant={
                        vtStatus === "not_required"
                          ? "secondary"
                          : vtStatus === "configured"
                            ? "default"
                            : "destructive"
                      }
                    >
                      {ceeSheetVtConfigStatusLabel(vtStatus)}
                    </Badge>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                    <div>Présentation: {sheet.presentationTemplateKey || "—"}</div>
                    <div>Accord: {sheet.agreementTemplateKey || "—"}</div>
                    <div>
                      VT:{" "}
                      {sheet.requiresTechnicalVisit
                        ? sheet.technicalVisitTemplateKey
                          ? `${sheet.technicalVisitTemplateKey} v${sheet.technicalVisitTemplateVersion ?? "—"}`
                          : "requis · template à choisir"
                        : "non requis"}
                    </div>
                    <div>Devis: {sheet.requiresQuote ? "Oui" : "Non"}</div>
                  </div>
                </button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => onToggleActive(sheet)}
                >
                  {sheet.isCommercialActive ? "Désactiver" : "Activer"}
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
