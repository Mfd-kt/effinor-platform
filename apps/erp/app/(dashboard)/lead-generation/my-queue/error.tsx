"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function MyLeadGenerationQueueError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <h1 className="text-lg font-semibold text-destructive">Impossible de charger votre file</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button type="button" variant="outline" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
