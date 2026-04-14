"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ExistingHeatingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <PageHeader
        title="Chauffage existant"
        description="Une erreur est survenue lors du chargement de cette page."
      />
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm">
        <p className="text-destructive">{error.message}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => reset()}>
          Réessayer
        </Button>
      </div>
    </div>
  );
}
