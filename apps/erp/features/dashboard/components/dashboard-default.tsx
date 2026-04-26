import Link from "next/link";
import { Inbox, User } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import type { AccessContext } from "@/lib/auth/access-context";
import { isAppRoleCode, ROLE_LABEL_FR } from "@/lib/auth/role-codes";
import { cn } from "@/lib/utils";

type Props = {
  access: Extract<AccessContext, { kind: "authenticated" }>;
};

/**
 * Accueil lorsqu’aucun écran rôle n’est routé, ou rôle seulement partiel côté matrice.
 */
export function DashboardDefault({ access }: Props) {
  const labels = access.roleCodes
    .filter((c) => isAppRoleCode(c))
    .map((c) => ROLE_LABEL_FR[c]);

  const roleLine = labels.length > 0 ? labels.join(" · ") : "compte actif";

  return (
    <div>
      <PageHeader
        title="Bienvenue"
        description={
          <>
            Espace de travail Effinor — rôles associés :{" "}
            <span className="font-medium text-foreground">{roleLine}</span>. Utilisez le menu
            de gauche ou la recherche <kbd className="rounded border border-border bg-muted px-1.5 text-xs">⌘K</kbd>{" "}
            pour accéder à vos tâches.
          </>
        }
      />

      <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
        <Card className="border-border/80">
          <CardContent className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-medium text-foreground">Notifications & résumé</h2>
            <p className="text-sm text-muted-foreground">
              Digest quotidien et alertes ciblées.
            </p>
            <Link
              href="/digests"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-fit")}
            >
              <Inbox className="size-3.5" data-icon="inline-start" />
              Ouvrir le digest
            </Link>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardContent className="flex flex-col gap-3 p-5">
            <h2 className="text-sm font-medium text-foreground">Profil</h2>
            <p className="text-sm text-muted-foreground">
              Identité, mot de passe et coordonnées.
            </p>
            <Link
              href="/account"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
            >
              <User className="size-3.5" data-icon="inline-start" />
              Mon compte
            </Link>
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
        Un module manque au menu ? Un administrateur peut vous attribuer un rôle adapté
        (CRM, terrain, lead gen, etc.) dans{" "}
        <span className="font-medium text-foreground">Paramètres → Utilisateurs</span>.
      </p>
    </div>
  );
}
