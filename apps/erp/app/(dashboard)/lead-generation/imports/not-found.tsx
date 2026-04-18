import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";

export default function LeadGenerationImportsNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 py-12">
      <h1 className="text-lg font-semibold">Import introuvable</h1>
      <p className="text-sm text-muted-foreground">Ce batch n’existe pas ou vous n’y avez pas accès.</p>
      <Link href="/lead-generation/imports" className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit" })}>
        Retour aux imports
      </Link>
    </div>
  );
}
