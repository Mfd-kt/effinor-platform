"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type Props = {
  /** Première fiche disponible dans la file triée, ou null si file vide */
  nextStockId: string | null;
  /** Valeur du paramètre `from` pour la navigation suivante */
  fromHref: string;
  convertedLeadId: string;
};

/**
 * État minimal lorsqu’on ouvre une fiche déjà convertie : message court puis redirection automatique.
 */
export function MyQueueConvertedAutoRedirect({ nextStockId, fromHref, convertedLeadId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (nextStockId) {
        const p = new URLSearchParams();
        p.set("from", fromHref);
        router.replace(`/lead-generation/my-queue/${nextStockId}?${p.toString()}`);
      } else {
        router.replace("/lead-generation/my-queue?queueEmpty=1");
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [nextStockId, fromHref, router]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 py-10">
      <div className="rounded-lg border border-border bg-card px-6 py-8 text-center shadow-sm">
        <p className="text-sm text-foreground">Cette fiche a déjà été transformée en fiche prospect CRM.</p>
        <p className="mt-2 text-xs text-muted-foreground">Passage à la suite de votre file…</p>
        <Link
          href={`/leads/${convertedLeadId}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-6 inline-flex")}
        >
          Ouvrir la fiche prospect
        </Link>
      </div>
    </div>
  );
}
