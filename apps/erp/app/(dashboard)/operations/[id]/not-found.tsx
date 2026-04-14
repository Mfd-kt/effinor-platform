import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function OperationNotFound() {
  return (
    <div>
      <PageHeader
        title="Opération introuvable"
        description="Ce dossier n’existe pas ou a été retiré."
      />
      <Link href="/beneficiaries" className={cn(buttonVariants())}>
        Retour aux bénéficiaires
      </Link>
    </div>
  );
}
