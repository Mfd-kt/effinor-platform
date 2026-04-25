import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  /** Action affichée à droite du titre (ex. lien « Voir tout »). */
  action?: ReactNode;
  /** Hauteur fixe en px pour le conteneur de chart. */
  height?: number;
  children: ReactNode;
  className?: string;
};

/**
 * Conteneur standard pour un graphique ou widget visuel d'un dashboard.
 * Hauteur fixe par défaut pour éviter le « jump » lors du chargement de Recharts.
 */
export function ChartCard({
  title,
  description,
  action,
  height = 280,
  children,
  className,
}: Props) {
  return (
    <Card className={cn("gap-3", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className="px-4">
        <div className="w-full min-w-0" style={{ height }}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
