import { PageHeader } from "@/components/shared/page-header";
import { AdminUsersPanel } from "@/components/settings/admin-users-panel";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { listRolesForAdmin, listUsersForAdmin } from "@/server/actions/admin-users";

export default async function SettingsUsersPage() {
  const access = await requireSuperAdmin();
  const [users, roleCatalog] = await Promise.all([listUsersForAdmin(), listRolesForAdmin()]);

  return (
    <div>
      <PageHeader
        title="Réglages — Utilisateurs"
        description="Créer des comptes, ouvrir un profil pour modifier nom, e-mail et coordonnées ; mettre en pause ou supprimer un utilisateur (réservé au super administrateur)."
      />
      <AdminUsersPanel initialUsers={users} currentUserId={access.userId} roleCatalog={roleCatalog} />
    </div>
  );
}
