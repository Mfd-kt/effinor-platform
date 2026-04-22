import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { LeadForm } from "@/features/leads/components/lead-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function NewLeadPage() {
  return (
    <div>
      <PageHeader
        title="Nouveau lead"
        description="Saisie rapide (appel froid). Complétez la qualification sur la fiche lead après création."
        actions={
          <Link href="/leads" className={cn(buttonVariants({ variant: "outline" }))}>
            Retour à la liste
          </Link>
        }
      />
      <LeadForm mode="create" className="max-w-4xl" />
    </div>
  );
}
