"use client";

import Link from "next/link";
import { useEffect } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function OperationsError({
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
    <div>
      <PageHeader
        title="Opérations"
        description="Dossiers CEE centraux : statuts, délégataire, échéances et pilotage financier."
      />
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error.message}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => reset()}>
            Réessayer
          </Button>
          <Link href="/beneficiaries" className={cn(buttonVariants({ variant: "ghost" }))}>
            Retour aux bénéficiaires
          </Link>
        </div>
      </div>
    </div>
  );
}
