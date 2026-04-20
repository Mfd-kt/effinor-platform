import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { LeadGenerationStockRow } from "../domain/stock-row";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="break-words text-sm text-foreground">{value}</p>
    </div>
  );
}

/** Bloc sobre : coordonnées utiles pour l’appel (données déjà présentes sur la fiche). */
export function LeadGenerationCallReadinessCard({ stock }: { stock: LeadGenerationStockRow }) {
  const phone = stock.phone?.trim() || stock.normalized_phone?.trim() || "—";
  const email = stock.email?.trim() || stock.enriched_email?.trim() || "—";
  const site = stock.website?.trim() || stock.enriched_website?.trim() || "—";
  const name = stock.decision_maker_name?.trim() || "—";
  const role = stock.decision_maker_role?.trim() || "—";
  const li = stock.linkedin_url?.trim() || "—";

  const hasAny =
    phone !== "—" ||
    email !== "—" ||
    site !== "—" ||
    name !== "—" ||
    role !== "—" ||
    li !== "—";

  if (!hasAny) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Contact pour l’appel</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <Row label="Téléphone" value={phone} />
        <Row label="E-mail" value={email} />
        <Row label="Site web" value={site} />
        <Row label="Responsable / contact" value={name} />
        <Row label="Rôle" value={role} />
        <Row label="LinkedIn" value={li} />
      </CardContent>
    </Card>
  );
}
