import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function MyLeadGenerationQueueNotFound() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-lg font-semibold">Accès refusé ou page introuvable</h1>
      <p className="text-sm text-muted-foreground">
        Cette vue est réservée aux commerciaux avec une file Lead Gen, ou vous n’avez pas les droits nécessaires.
      </p>
      <Link href="/" className={cn(buttonVariants())}>
        Retour au tableau de bord
      </Link>
    </div>
  );
}
