import { PageHeader } from "@/components/shared/page-header";
import { AdminUsersPanel } from "@/components/settings/admin-users-panel";
import { requireUsersSettingsAccess } from "@/lib/auth/guards";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { listRolesForAdmin, listUsersForAdmin } from "@/server/actions/admin-users";

export default async function SettingsUsersPage() {
  const access = await requireUsersSettingsAccess();
  const [users, roleCatalog] = await Promise.all([listUsersForAdmin(), listRolesForAdmin()]);
  const teamManagerOnly = !isSuperAdmin(access.roleCodes);

  return (
    <div>
      <PageHeader
        title="Réglages — Utilisateurs"
        description={
          teamManagerOnly
            ? "Créer des comptes pour votre équipe (rôles agent, confirmateur ou closer) et consulter les membres rattachés à vos équipes. Les actions sensibles restent réservées au super administrateur."
            : "Créer des comptes, ouvrir un profil pour modifier nom/e-mail/coordonnées et piloter le cycle de vie (pause, désactivation définitive, suppression opérationnelle)."
        }
      />
      <AdminUsersPanel
        initialUsers={users}
        currentUserId={access.userId}
        roleCatalog={roleCatalog}
        teamManagerOnly={teamManagerOnly}
      />
    </div>
  );
}
