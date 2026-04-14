import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function TechnicalVisitNotFound() {
  return (
    <div>
      <PageHeader
        title="Visite technique introuvable"
        description="Cette visite n’existe pas ou a été retirée."
      />
      <Link href="/technical-visits" className={cn(buttonVariants())}>
        Retour à la liste des visites techniques
      </Link>
    </div>
  );
}
