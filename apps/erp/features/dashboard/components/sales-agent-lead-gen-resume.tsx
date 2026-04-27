import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRelanceDisplay } from "@/features/lead-generation/lib/my-queue-follow-up";
import { getMyLeadGenerationQueue } from "@/features/lead-generation/queries/get-my-lead-generation-queue";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  /** Évite un second chargement de la file si déjà chargé côté page. */
  preloadedQueue?: Awaited<ReturnType<typeof getMyLeadGenerationQueue>>;
};

/**
 * Encart accueil agent : prochaine fiche LGC, relances, lien direct pour reprendre l’appel.
 */
export async function SalesAgentLeadGenResume({ userId, preloadedQueue }: Props) {
  let items: Awaited<ReturnType<typeof getMyLeadGenerationQueue>> = preloadedQueue ?? [];
  if (!preloadedQueue) {
    try {
      items = await getMyLeadGenerationQueue(userId);
    } catch {
      items = [];
    }
  }
  const overdue = items.filter((i) => i.hasOverdueFollowUp).length;
  const first = items[0] ?? null;
  const relance = first ? getRelanceDisplay(first) : null;
  const resumeHref = first ? `/lead-generation/my-queue/${first.stockId}` : "/lead-generation/my-queue";

  return (
    <Card className="border-primary/25 bg-primary/[0.04]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Acquisition de leads</CardTitle>
        <p className="text-sm text-muted-foreground">
          {items.length === 0
            ? "Aucune fiche en file pour l’instant : dès qu’on vous en assigne, elles s’affichent ici — suivi d’appels et relances."
            : `${items.length} fiche${items.length > 1 ? "s" : ""} à traiter${overdue > 0 ? ` — ${overdue} relance${overdue > 1 ? "s" : ""} en retard` : ""}.`}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {first ? (
          <div className="min-w-0 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">À traiter en priorité</p>
            <p className="truncate font-medium text-foreground">{first.companyName}</p>
            <p className="text-sm text-muted-foreground">
              Relance : {relance?.label ?? "—"}
              {first.attemptCount > 0
                ? ` · ${first.attemptCount} appel${first.attemptCount > 1 ? "s" : ""} enregistré${first.attemptCount > 1 ? "s" : ""}`
                : null}
            </p>
          </div>
        ) : null}
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={resumeHref} className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
            {first ? "Reprendre" : "Ouvrir ma file"}
            <ArrowRight className="ml-1 size-3.5" aria-hidden />
          </Link>
          <Link
            href="/lead-generation/my-queue"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Inbox className="size-3.5" aria-hidden />
            Toute la file
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
