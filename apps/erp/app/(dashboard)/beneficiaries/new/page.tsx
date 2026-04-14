import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { BeneficiaryForm } from "@/features/beneficiaries/components/beneficiary-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessBeneficiariesModule } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export default async function NewBeneficiaryPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessBeneficiariesModule(access)) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="Nouveau bénéficiaire"
        description="Création d’une fiche entreprise. Les liaisons avec opérations et leads seront ajoutées ultérieurement."
        actions={
          <Link
            href="/beneficiaries"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Retour à la liste
          </Link>
        }
      />
      <BeneficiaryForm mode="create" className="max-w-4xl" />
    </div>
  );
}
