import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE_KIND_LABELS } from "@/features/operation-sites/constants";
import type { OperationSiteDetailRow } from "@/features/operation-sites/types";
import type { SiteKind } from "@/types/database.types";

type OperationSiteSummaryCardsProps = {
  site: OperationSiteDetailRow;
};

function formatNum(n: number | null | undefined, unit: string): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n)} ${unit}`;
}

export function OperationSiteSummaryCards({ site }: OperationSiteSummaryCardsProps) {
  const op = site.operations;
  const ben = op?.beneficiaries;

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Site</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-foreground">{site.label}</p>
          {site.is_primary ? (
            <p className="mt-1 text-xs font-medium text-primary">Site principal</p>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Opération</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-mono text-sm font-medium">{op?.operation_reference ?? "—"}</p>
          <p className="text-muted-foreground text-sm">{op?.title ?? "—"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Bénéficiaire</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium text-foreground">{ben?.company_name ?? "—"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Type de site</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">
            {site.site_kind ? SITE_KIND_LABELS[site.site_kind as SiteKind] : "—"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Surface & hauteur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Surface : </span>
            {formatNum(site.area_m2, "m²")}
          </p>
          <p>
            <span className="text-muted-foreground">Hauteur : </span>
            {formatNum(site.height_m, "m")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Chauffage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">{site.heating_system_type ?? "—"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
