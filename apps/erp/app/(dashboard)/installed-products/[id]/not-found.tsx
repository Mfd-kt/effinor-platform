import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function InstalledProductNotFound() {
  return (
    <div>
      <PageHeader
        title="Ligne introuvable"
        description="Ce produit installé n’existe pas ou a été supprimé."
      />
      <Link href="/installed-products" className={cn(buttonVariants())}>
        Retour aux produits installés
      </Link>
    </div>
  );
}
