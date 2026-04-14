import Link from "next/link";
import { Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import type { RoleDigest, RoleDigestPriority } from "../digest-types";

function priorityClasses(p: RoleDigestPriority): string {
  if (p === "critical") return "bg-destructive/15 text-destructive border-destructive/30";
  if (p === "high") return "bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/35";
  if (p === "normal") return "bg-sky-500/10 text-sky-900 dark:text-sky-200 border-sky-500/25";
  return "bg-muted text-muted-foreground border-border";
}

function priorityLabel(p: RoleDigestPriority): string {
  if (p === "critical") return "Critique";
  if (p === "high") return "Élevée";
  if (p === "normal") return "Normale";
  return "Basse";
}

type Props = {
  digest: RoleDigest;
  /** Affiché si le digest n’a pas été re-persisté (fenêtre dédup). */
  duplicateNotice?: boolean;
};

export function RoleDigestCard({ digest, duplicateNotice }: Props) {
  return (
    <Card className="ring-1 ring-border/80">
      <CardHeader className="space-y-1 border-b border-border pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">{digest.title}</CardTitle>
            <CardDescription className="text-xs">
              Généré le{" "}
              {new Date(digest.generatedAt).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </CardDescription>
          </div>
          <Badge variant="outline" className={cn("shrink-0 border", priorityClasses(digest.priority))}>
            {priorityLabel(digest.priority)}
          </Badge>
        </div>
        {duplicateNotice ? (
          <p className="text-[11px] text-muted-foreground">
            Même synthèse que récemment — affichage sans nouvel enregistrement.
          </p>
        ) : null}
        <p className="text-sm font-medium leading-snug text-foreground">{digest.summary}</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {digest.sections.map((sec) => (
          <div key={sec.key} className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{sec.title}</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-foreground/90">
              {sec.items.map((it, i) => (
                <li key={i} className="leading-snug">
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {digest.actionItems.length > 0 ? (
          <div className="space-y-2 border-t border-border pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Actions rapides</h3>
            <div className="flex flex-col gap-2">
              {digest.actionItems.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-1.5 rounded-md border border-border/80 bg-muted/30 p-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium leading-snug">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                    {a.impactEuro != null ? (
                      <p className="text-[11px] text-muted-foreground">
                        Impact estimé :{" "}
                        {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
                          a.impactEuro,
                        )}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {a.phone ? (
                      <a
                        href={`tel:${a.phone.replace(/\s/g, "")}`}
                        className={cn(buttonVariants({ variant: "outline", size: "xs" }), "gap-1")}
                      >
                        <Phone className="size-3.5" />
                        Appeler
                      </a>
                    ) : null}
                    {a.actionHref ? (
                      <Link href={a.actionHref} className={buttonVariants({ variant: "default", size: "xs" })}>
                        Ouvrir
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
