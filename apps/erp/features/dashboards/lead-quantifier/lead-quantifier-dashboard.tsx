import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { LeadGenerationQuantifierDashboardView } from "@/features/lead-generation/components/lead-generation-quantifier-dashboard-view";
import { getLeadGenerationQuantifierPersonalDashboard } from "@/features/lead-generation/queries/get-lead-generation-quantifier-personal-dashboard";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
};

/**
 * Vue dédiée du quantifier (préservée) + CTA proéminent vers le module métier complet.
 * Le quantifier dispose d'une expérience riche dans /lead-generation : on l'oriente
 * sans pour autant masquer le récap personnel.
 */
export async function LeadQuantifierDashboard({ userId }: Props) {
  const data = await getLeadGenerationQuantifierPersonalDashboard(userId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Link
          href="/lead-generation"
          className={cn(buttonVariants({ variant: "default", size: "default" }))}
        >
          Aller à mon workspace Acquisition
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <LeadGenerationQuantifierDashboardView data={data} />
    </div>
  );
}
