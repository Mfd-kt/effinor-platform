import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function OperationSiteNotFound() {
  return (
    <div>
      <PageHeader
        title="Site introuvable"
        description="Ce site technique n’existe pas ou a été supprimé."
      />
      <Link href="/operation-sites" className={cn(buttonVariants())}>
        Retour aux sites techniques
      </Link>
    </div>
  );
}
