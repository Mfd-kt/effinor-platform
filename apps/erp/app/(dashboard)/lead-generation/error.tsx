"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <h1 className="text-lg font-semibold text-destructive">Erreur Lead Generation</h1>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button type="button" variant="outline" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
