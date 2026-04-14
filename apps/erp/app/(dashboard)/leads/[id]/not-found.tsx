import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadsDirectoryNav } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

export default async function LeadNotFound() {
  const access = await getAccessContext();
  const showLeadsList =
    access.kind === "authenticated" && canAccessLeadsDirectoryNav(access);
  const backHref = showLeadsList ? "/leads" : "/";
  const backLabel = showLeadsList ? "Retour à la liste des leads" : "Retour au tableau de bord";

  return (
    <div>
      <PageHeader
        title="Lead introuvable"
        description="Ce lead n’existe pas ou a été retiré."
      />
      <Link href={backHref} className={cn(buttonVariants())}>
        {backLabel}
      </Link>
    </div>
  );
}
