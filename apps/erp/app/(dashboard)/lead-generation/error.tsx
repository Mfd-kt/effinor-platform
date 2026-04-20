"use client";

import { useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";

function isStaleServerActionError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("server action") && m.includes("was not found");
}

export default function LeadGenerationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const staleAction = useMemo(() => isStaleServerActionError(error.message ?? ""), [error.message]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <h1 className="text-lg font-semibold text-destructive">Erreur Lead Generation</h1>
      {staleAction ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            La page utilise une <strong className="font-medium text-foreground">ancienne version</strong> du site par
            rapport au serveur (souvent juste après une mise en ligne, ou avec un onglet ouvert depuis longtemps). Les
            boutons comme <strong className="font-medium text-foreground">Qualifier</strong> ne peuvent pas joindre
            l’action serveur correspondante.
          </p>
          <p className="text-xs">
            Faites un <strong className="font-medium text-foreground">rechargement forcé</strong> du navigateur sur cette
            page (vidage de cache si besoin), ou fermez l’onglet et rouvrez l’URL. Réessayer seul ne suffit pas toujours.
          </p>
        </div>
      ) : null}
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={reset}>
          Réessayer
        </Button>
        {staleAction ? (
          <Button type="button" variant="default" onClick={() => window.location.reload()}>
            Recharger la page
          </Button>
        ) : null}
      </div>
    </div>
  );
}
