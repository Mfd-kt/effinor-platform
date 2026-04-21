import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { AdminUserProfileForm } from "@/components/settings/admin-user-profile-form";
import { buttonVariants } from "@/components/ui/button-variants";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import { getAdminUserProfileById, listRolesForAdmin } from "@/server/actions/admin-users";

type PageProps = { params: Promise<{ userId: string }> };

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
    </div>
  );
}
