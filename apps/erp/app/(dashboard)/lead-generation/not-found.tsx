import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function LeadGenerationNotFound() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-lg font-semibold">Introuvable</h1>
      <p className="text-sm text-muted-foreground">Cette ressource n’existe pas ou vous n’y avez pas accès.</p>
      <Link href="/lead-generation" className={cn(buttonVariants())}>
        Retour Lead Generation
      </Link>
    </div>
  );
}
