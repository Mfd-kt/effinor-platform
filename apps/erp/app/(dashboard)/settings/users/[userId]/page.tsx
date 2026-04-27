import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { AdminUserProfileForm } from "@/components/settings/admin-user-profile-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { SalesAgentLeadGenActivityBlock } from "@/features/dashboard/components/sales-agent-lead-gen-activity-block";
import { getCockpitPeriodRange } from "@/features/dashboard/lib/cockpit-period";
import { getAgentLeadGenWorkSummary } from "@/features/lead-generation/queries/get-agent-lead-generation-work-summary";
import { getAccessContext } from "@/lib/auth/access-context";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { canViewAgentLeadGenWorkHistory } from "@/lib/auth/lead-generation-work-view";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { getAdminUserProfileById, listRolesForAdmin } from "@/server/actions/admin-users";

type PageProps = { params: Promise<{ userId: string }> };

/** Pilotage LGC (30 j. glissants) : visible par super admin côté fiche utilisateur. */
async function UserLeadGenActivitySection({ userId }: { userId: string }) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canViewAgentLeadGenWorkHistory(access, userId)) {
    return null;
  }
  const now = new Date();
  const range = getCockpitPeriodRange("days30", now);
  const supabase = await createClient();
  let summary: Awaited<ReturnType<typeof getAgentLeadGenWorkSummary>>;
  try {
    summary = await getAgentLeadGenWorkSummary(supabase, userId, range.startIso, range.endIso);
  } catch {
    return null;
  }
  return (
    <div className="mt-10">
      <SalesAgentLeadGenActivityBlock
        summary={summary}
        periodDescription="30 derniers jours (glissants) — aligné sur le module acquisition de leads."
        myQueueHref="/lead-generation/my-queue"
        variant="admin"
      />
    </div>
  );
}

export default async function SettingsUserProfilePage({ params }: PageProps) {
  const access = await requireSuperAdmin();
  const { userId } = await params;
  const [profile, roleCatalog] = await Promise.all([getAdminUserProfileById(userId), listRolesForAdmin()]);

  if (!profile) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/settings/users"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 inline-flex text-muted-foreground",
          )}
        >
          ← Utilisateurs
        </Link>
      </div>
      <PageHeader
        title={`Profil — ${profile.email}`}
        description={
          profile.account_lifecycle_status === "active"
            ? "Rôles métier, coordonnées et e-mail de connexion."
            : profile.account_lifecycle_status === "paused"
              ? "Compte en pause : connexion bloquée, portefeuille conservé."
              : profile.account_lifecycle_status === "disabled"
                ? "Compte désactivé définitivement : non réactivable, historique conservé."
                : "Compte supprimé opérationnellement : non réactivable, masqué des vues opérationnelles."
        }
      />
      <AdminUserProfileForm profile={profile} currentUserId={access.userId} roleCatalog={roleCatalog} />
      <UserLeadGenActivitySection userId={userId} />
    </div>
  );
}
