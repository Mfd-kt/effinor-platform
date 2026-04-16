import Link from "next/link";
import { CalendarClock, ClipboardCheck, MapPinned, Route, TriangleAlert, Wrench } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicalVisitStatusBadge } from "@/features/technical-visits/components/technical-visit-status-badge";
import { isTechnicalVisitScheduledTodayParis } from "@/features/technical-visits/lib/technical-visit-list-bucket";
import { isTechnicalVisitInProgress } from "@/features/technical-visits/lib/visit-in-progress";
import { getTechnicalVisits } from "@/features/technical-visits/queries/get-technical-visits";
import type { AccessContext } from "@/lib/auth/access-context";
import { canAccessInstallationsModule } from "@/lib/auth/module-access";
import { createClient } from "@/lib/supabase/server";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  access: AccessContext;
};

/**
 * Accueil terrain : pas de cockpit commercial, entrées directes vers les modules utiles au technicien.
 */
export async function DashboardTechnician({ access }: Props) {
  const installations = access.kind === "authenticated" && canAccessInstallationsModule(access);
  const supabase = await createClient();

  const [visits, profile] = await Promise.all([
    getTechnicalVisits(undefined, access),
    access.kind === "authenticated"
      ? supabase
          .from("profiles")
          .select("address_line_1, postal_code, city, latitude, longitude")
          .eq("id", access.userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const now = new Date();
  const totalVisits = visits.length;
  const todayVisits = visits.filter((v) => isTechnicalVisitScheduledTodayParis(v, now)).length;
  const inProgressVisits = visits.filter((v) => isTechnicalVisitInProgress(v)).length;
  const reportPending = visits.filter((v) => v.status === "performed" || v.status === "report_pending").length;
  const withDistance = visits.filter((v) => v.distance_km != null).length;
  const distanceCoverage = totalVisits > 0 ? Math.round((withDistance / totalVisits) * 100) : 0;

  const nextVisits = [...visits]
    .filter((v) => v.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
    .slice(0, 5);

  const profileAddressComplete = Boolean(profile.data?.address_line_1 && profile.data?.postal_code && profile.data?.city);
  const profileCoordsReady = profile.data?.latitude != null && profile.data?.longitude != null;

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Centre de pilotage terrain — style dispatch (planning, actions rapides, progression)."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Visites assignées</p>
              <p className="text-3xl font-semibold">{totalVisits}</p>
            </div>
            <ClipboardCheck className="size-6 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Aujourd’hui</p>
              <p className="text-3xl font-semibold">{todayVisits}</p>
            </div>
            <CalendarClock className="size-6 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">En cours</p>
              <p className="text-3xl font-semibold">{inProgressVisits}</p>
            </div>
            <Route className="size-6 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Rapport à finaliser</p>
              <p className="text-3xl font-semibold">{reportPending}</p>
            </div>
            <TriangleAlert className="size-6 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="border-border/80 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Prochaines visites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextVisits.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune visite planifiée pour le moment.</p>
            ) : (
              nextVisits.map((visit) => (
                <Link
                  key={visit.id}
                  href={`/technical-visits/${visit.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-muted-foreground">{visit.vt_reference}</p>
                    <p className="truncate text-sm font-medium">
                      {formatDateFr(visit.scheduled_at)}
                      {visit.time_slot ? ` · ${visit.time_slot}` : ""}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {visit.region || "Région non renseignée"}
                      {visit.formatted_distance ? ` · ${visit.formatted_distance}` : ""}
                    </p>
                  </div>
                  <TechnicalVisitStatusBadge status={visit.status} />
                </Link>
              ))
            )}
            <Link
              href="/technical-visits"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-2 inline-flex h-11 w-full items-center justify-center gap-2 font-semibold sm:w-auto",
              )}
            >
              <ClipboardCheck className="size-5 shrink-0" aria-hidden />
              Ouvrir les visites techniques
            </Link>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Distance & GPS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Couverture actuelle des distances calculées sur vos visites.
              </p>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.max(4, distanceCoverage)}%` }}
                />
              </div>
              <p className="text-sm font-medium">{distanceCoverage}% de visites avec distance disponible</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profil technicien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Votre adresse sert de point de départ pour calculer la distance terrain.
              </p>
              <div className="rounded-lg border border-border/70 p-3 text-sm">
                <p>
                  Adresse:{" "}
                  <span className="font-medium">
                    {profileAddressComplete ? "Renseignée" : "À compléter"}
                  </span>
                </p>
                <p>
                  Coordonnées GPS:{" "}
                  <span className="font-medium">
                    {profileCoordsReady ? "Prêtes" : "Non géolocalisées"}
                  </span>
                </p>
              </div>
              <Link
                href="/account"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "inline-flex h-10 w-full items-center justify-center gap-2 sm:w-auto",
                )}
              >
                <MapPinned className="size-4" />
                Mettre à jour mon adresse
              </Link>
            </CardContent>
          </Card>

          {installations ? (
            <Link
              href="/installations"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "inline-flex h-11 w-full items-center justify-center gap-2 font-semibold",
              )}
            >
              <Wrench className="size-5 shrink-0" aria-hidden />
              Installations assignées
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
