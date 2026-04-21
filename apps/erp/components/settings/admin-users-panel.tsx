"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AdminUserRowActions, AdminUserStatusBadge } from "@/components/settings/admin-user-row-actions";
import type { AdminUserRow, CreateUserWithRoleResult, RoleCatalogRow } from "@/server/actions/admin-users";
import { createUserWithRole } from "@/server/actions/admin-users";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Création…" : "Créer l’utilisateur"}
    </Button>
  );
}

function roleLabel(catalog: RoleCatalogRow[], code: string): string {
  return catalog.find((r) => r.code === code)?.label_fr ?? code;
}

export function AdminUsersPanel({
  initialUsers,
  currentUserId,
  roleCatalog,
  teamManagerOnly = false,
}: {
  initialUsers: AdminUserRow[];
  currentUserId: string;
  roleCatalog: RoleCatalogRow[];
  /** Manager d’équipe CEE : pas d’édition profil / pause / suppression. */
  teamManagerOnly?: boolean;
}) {
  const router = useRouter();
  const [result, formAction] = useActionState(
    async (_prev: CreateUserWithRoleResult | null, formData: FormData) => {
      return createUserWithRole(formData);
    },
    null as CreateUserWithRoleResult | null,
  );

  useEffect(() => {
    if (result?.ok) {
      router.refresh();
    }
  }, [result, router]);

  return (
    <div className="space-y-10">
      <section className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-medium">Nouvel utilisateur</h2>
        <p className="text-sm text-muted-foreground">
          Création du compte (e-mail confirmé) et attribution d’un rôle métier.
        </p>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="prenom.nom@exemple.fr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Au moins 8 caractères"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom affiché (optionnel)</Label>
            <Input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="Jean Dupont" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roleCode">Rôle</Label>
            <select
              id="roleCode"
              name="roleCode"
              required
              className={cn(
                "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
              )}
              defaultValue={roleCatalog.find((r) => r.code === "sales_agent")?.code ?? roleCatalog[0]?.code ?? ""}
            >
              {roleCatalog.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label_fr}
                </option>
              ))}
            </select>
          </div>
          {result ? (
            <p
              className={cn(
                "text-sm",
                result.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
              )}
              role="status"
            >
              {result.ok ? result.message : result.error}
            </p>
          ) : null}
          <SubmitButton />
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Utilisateurs</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Rôles</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                    Aucun utilisateur ou accès refusé.
                  </td>
                </tr>
              ) : (
                initialUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      {teamManagerOnly ? (
                        <span className="text-foreground">{u.email}</span>
                      ) : (
                        <Link
                          href={`/settings/users/${u.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {u.email}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.full_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <AdminUserStatusBadge status={u.account_lifecycle_status} />
                    </td>
                    <td className="px-4 py-3">
                      {u.role_codes.length === 0
                        ? "—"
                        : u.role_codes.map((c) => roleLabel(roleCatalog, c)).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AdminUserRowActions
                        userId={u.id}
                        email={u.email}
                        status={u.account_lifecycle_status}
                        isSelf={u.id === currentUserId}
                        showPrivilegedActions={!teamManagerOnly}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
