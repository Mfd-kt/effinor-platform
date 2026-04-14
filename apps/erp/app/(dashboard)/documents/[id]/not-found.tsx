import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function DocumentNotFound() {
  return (
    <div>
      <PageHeader
        title="Document introuvable"
        description="Ce document n’existe pas ou a été supprimé."
      />
      <Link href="/documents" className={cn(buttonVariants())}>
        Retour aux documents
      </Link>
    </div>
  );
}
