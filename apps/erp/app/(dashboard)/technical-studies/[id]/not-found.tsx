import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function TechnicalStudyNotFound() {
  return (
    <div>
      <PageHeader
        title="Étude introuvable"
        description="Cette étude technique n’existe pas ou a été supprimée."
      />
      <Link href="/technical-studies" className={cn(buttonVariants())}>
        Retour aux études techniques
      </Link>
    </div>
  );
}
