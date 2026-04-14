import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function BeneficiaryNotFound() {
  return (
    <div>
      <PageHeader
        title="Bénéficiaire introuvable"
        description="Ce bénéficiaire n’existe pas ou a été retiré."
      />
      <Link href="/beneficiaries" className={cn(buttonVariants())}>
        Retour à la liste des bénéficiaires
      </Link>
    </div>
  );
}
