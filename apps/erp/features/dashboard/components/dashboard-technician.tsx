import Link from "next/link";
import { ClipboardCheck, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessInstallationsModule } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";

type Props = {
  access: AccessContext;
};

/**
 * Accueil terrain : pas de cockpit commercial, entrées directes vers les modules utiles au technicien.
 */
export function DashboardTechnician({ access }: Props) {
  const installations = access.kind === "authenticated" && canAccessInstallationsModule(access);

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Espace technicien — accès aux interventions et visites qui vous sont affectées."
      />
      <div className="grid max-w-xl gap-4 sm:max-w-2xl">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex flex-col gap-4 pt-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ouvrez la liste des visites techniques pour voir le planning, les fiches et le formulaire
              terrain (selon les règles d’accès J-24h).
            </p>
            <Link
              href="/technical-visits"
              className={cn(
                buttonVariants({ size: "lg" }),
                "inline-flex h-12 w-full items-center justify-center gap-2 font-semibold sm:w-auto",
              )}
            >
              <ClipboardCheck className="size-5 shrink-0" aria-hidden />
              Visites techniques
            </Link>
          </CardContent>
        </Card>

        {installations ? (
          <Card className="border-border/80 shadow-sm">
            <CardContent className="flex flex-col gap-4 pt-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Installations qui vous sont affectées (périmètre filtré côté serveur).
              </p>
              <Link
                href="/installations"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "inline-flex h-12 w-full items-center justify-center gap-2 font-semibold sm:w-auto",
                )}
              >
                <Wrench className="size-5 shrink-0" aria-hidden />
                Installations
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
