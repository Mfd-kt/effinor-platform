import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function ExistingHeatingNotFound() {
  return (
    <div>
      <PageHeader
        title="Fiche introuvable"
        description="Cette unité de chauffage existant n’existe pas."
      />
      <Link href="/existing-heating" className={cn(buttonVariants())}>
        Retour à la liste
      </Link>
    </div>
  );
}
