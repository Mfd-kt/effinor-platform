"use client";

import { useEffect } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

import { INSTALLED_PRODUCT_MODULE_DESCRIPTION } from "@/features/installed-products/constants";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function InstalledProductsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <PageHeader title="Produits installés" description={INSTALLED_PRODUCT_MODULE_DESCRIPTION} />
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm">
        <p className="text-destructive">{error.message}</p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => reset()}>
          Réessayer
        </Button>
      </div>
    </div>
  );
}
