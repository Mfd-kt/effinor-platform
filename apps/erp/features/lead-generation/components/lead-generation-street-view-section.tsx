import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
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
  if (!model.canShowSection) {
    return null;
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Vue rue (Street View)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {model.embedSrc ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
            <iframe
              title={`Street View — ${stock.company_name}`}
              src={model.embedSrc}
              className="absolute inset-0 size-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        ) : null}
        <Link
          href={model.openMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
        >
          Ouvrir dans Google Maps
        </Link>
      </CardContent>
    </Card>
  );
}
