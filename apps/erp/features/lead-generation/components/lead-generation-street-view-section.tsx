import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import { buildLeadGenerationStreetViewModel } from "@/features/lead-generation/lib/lead-generation-street-view";
import { cn } from "@/lib/utils";

type Props = {
  stock: LeadGenerationStockRow;
  className?: string;
};

export function LeadGenerationStreetViewSection({ stock, className }: Props) {
  const model = buildLeadGenerationStreetViewModel(stock);
  if (!model.canShowSection || !model.embedSrc) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Vue dans la rue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <iframe
            title={`Vue dans la rue — ${stock.company_name}`}
            src={model.embedSrc}
            className="absolute inset-0 size-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </CardContent>
    </Card>
  );
}
