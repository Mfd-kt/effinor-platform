import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { RolesPermissionsAdminPanel } from "@/components/settings/roles-permissions-admin-panel";
import { buttonVariants } from "@/components/ui/button-variants";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { MATRIX_PERMISSION_CODE_SET } from "@/lib/constants/permission-matrix";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsRolesPage() {
  await requireSuperAdmin();

  const supabase = await createClient();

  const { data: rolesWithId, error: rolesErr } = await supabase
    .from("roles")
    .select("id, code, label_fr")
    .order("label_fr", { ascending: true });

  const { data: permCatalog, error: permErr } = await supabase
    .from("permissions")
    .select("id, code, label_fr, description")
    .order("code", { ascending: true });

  const { data: rpRows, error: rpErr } = await supabase
    .from("role_permissions")
    .select("role_id, permission_id");

  const permById = new Map((permCatalog ?? []).map((p) => [p.id, p]));

  const selectedByRoleId: Record<string, string[]> = {};
  for (const r of rolesWithId ?? []) {
    selectedByRoleId[r.id] = [];
  }
  for (const rp of rpRows ?? []) {
    const list = selectedByRoleId[rp.role_id];
    if (list && permById.has(rp.permission_id)) {
      list.push(rp.permission_id);
    }
  }

  const loadError = rolesErr?.message ?? permErr?.message ?? rpErr?.message;

  const permissionsMatrixOnly = (permCatalog ?? []).filter((p) => MATRIX_PERMISSION_CODE_SET.has(p.code));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
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
        title="Rôles et permissions"
        description="Utilisez les onglets Rôles, Attributions et Référentiel pour libellés, matrice par table et textes des permissions. L’attribution des rôles aux comptes se fait dans Utilisateurs."
      />

      {loadError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </p>
      ) : (
        <RolesPermissionsAdminPanel
          roles={rolesWithId ?? []}
          permissions={permissionsMatrixOnly}
          selectedByRoleId={selectedByRoleId}
        />
      )}
    </div>
  );
}
