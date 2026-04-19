import { Phone } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";
import type { LeadGenerationAssignmentActivityListItem } from "@/features/lead-generation/queries/get-lead-generation-assignment-activities";
import { leadPhoneToTelHref } from "@/features/leads/lib/lead-phone-tel";
import { cn } from "@/lib/utils";

import { LeadGenAircallCallLink } from "./lead-gen-aircall-call-link";
import { MyLeadQueueAnalysisSummary } from "./my-lead-queue-next-steps-card";

type Props = {
  assignmentId: string;
  stock: LeadGenerationStockRow;
  activities: LeadGenerationAssignmentActivityListItem[];
  phone: string | null;
  readOnly: boolean;
};

/**
 * En-tête de fiche agent : synthèse + bouton d’appel (sans dupliquer le bloc dans le formulaire).
 */
export function MyLeadQueueTopActionBar({ assignmentId, stock, activities, phone, readOnly }: Props) {
  const phoneDisplay = phone?.trim() || null;
  const telHref = leadPhoneToTelHref(phoneDisplay);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Synthèse & appel</CardTitle>
        <p className="text-xs text-muted-foreground">
          Le bouton vert enregistre automatiquement un appel (il ne reste plus qu’à compléter le compte rendu
          ci-dessous). Aircall ou téléphone du poste — pas de connexion automatique à Aircall.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1 border-border lg:border-r lg:pr-8">
          <MyLeadQueueAnalysisSummary stock={stock} activities={activities} phoneDisplay={phoneDisplay} />
        </div>
        <div className="flex shrink-0 flex-col justify-center gap-2 lg:w-[220px]">
          {telHref ? (
            readOnly ? (
              <Link
                href={telHref}
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "inline-flex w-full justify-center gap-2 shadow-sm",
                )}
              >
                <Phone className="size-4 shrink-0" aria-hidden />
                Appeler avec Aircall
              </Link>
            ) : (
              <LeadGenAircallCallLink
                assignmentId={assignmentId}
                telHref={telHref}
                className="inline-flex w-full justify-center gap-2 shadow-sm"
              >
                <Phone className="size-4 shrink-0" aria-hidden />
                Appeler avec Aircall
              </LeadGenAircallCallLink>
            )
          ) : (
            <p className="text-center text-xs text-muted-foreground">Ajoutez un numéro sur la fiche pour appeler.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
