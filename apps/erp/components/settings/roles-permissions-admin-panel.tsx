"use client";

import Link from "next/link";
import { Fragment, useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppRoleCode } from "@/lib/auth/role-codes";
import { cn } from "@/lib/utils";
import { PERMISSION_MATRIX_ROWS } from "@/lib/constants/permission-matrix";
import { ROLE_PERMISSIONS_SUMMARY_FR } from "@/lib/constants/role-permissions-summary";
import type { RolesPermissionsMutationResult } from "@/server/actions/roles-permissions-admin";
import {
  createRole,
  deleteRole,
  setRolePermissions,
  updatePermission,
  updateRoleLabel,
} from "@/server/actions/roles-permissions-admin";
import { ChevronDown } from "lucide-react";

export type RoleRow = { id: string; code: string; label_fr: string };
export type PermissionRow = { id: string; code: string; label_fr: string; description: string | null };

type Props = {
  roles: RoleRow[];
  permissions: PermissionRow[];
  /** Pour chaque rôle, les ids des permissions cochées */
  selectedByRoleId: Record<string, string[]>;
};

type SettingsRolesTab = "roles" | "attributions" | "referentiel";

function TabButton({
  id,
  active,
  onClick,
  children,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        "relative shrink-0 rounded-t-md border border-b-0 px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "z-[1] border-border bg-card text-foreground shadow-sm"
          : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function StatusMsg({ result }: { result: RolesPermissionsMutationResult | null }) {
  if (!result) {
    return null;
  }
  return (
    <p
      className={cn(
        "text-sm",
        result.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
      )}
      role="status"
    >
      {result.ok ? result.message : result.error}
    </p>
  );
}

export function RolesPermissionsAdminPanel({ roles, permissions, selectedByRoleId }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsRolesTab>("attributions");

  const [createRoleResult, createRoleAction, createRolePending] = useActionState(
    async (_p: RolesPermissionsMutationResult | null, fd: FormData) => createRole(fd),
    null as RolesPermissionsMutationResult | null,
  );

  useEffect(() => {
    if (createRoleResult?.ok) {
      router.refresh();
    }
  }, [createRoleResult, router]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 border-b border-border">
        <TabButton
          id="tab-roles"
          active={activeTab === "roles"}
          onClick={() => setActiveTab("roles")}
        >
          Rôles
        </TabButton>
        <TabButton
          id="tab-attributions"
          active={activeTab === "attributions"}
          onClick={() => setActiveTab("attributions")}
        >
          Attributions
        </TabButton>
        <TabButton
          id="tab-referentiel"
          active={activeTab === "referentiel"}
          onClick={() => setActiveTab("referentiel")}
        >
          Référentiel
        </TabButton>
      </div>

      <div
        role="tabpanel"
        aria-labelledby="tab-roles"
        className={cn(activeTab !== "roles" && "hidden")}
      >
        <div className="space-y-8">
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-medium">Ajouter un rôle</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Code unique en base (lettre minuscule puis minuscules, chiffres ou tiret bas). Le libellé est affiché
              dans l’interface et les listes Utilisateurs.
            </p>
            <form action={createRoleAction} className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-role-code">Code</Label>
                <Input
                  id="new-role-code"
                  name="code"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="ex. charge_affaires"
                  className="min-w-[12rem] font-mono text-sm"
                />
              </div>
              <div className="min-w-[12rem] flex-1 space-y-2">
                <Label htmlFor="new-role-label">Libellé affiché</Label>
                <Input id="new-role-label" name="label_fr" required placeholder="Libellé en français" />
              </div>
              <Button type="submit" disabled={createRolePending}>
                {createRolePending ? "Création…" : "Créer le rôle"}
              </Button>
              <StatusMsg result={createRoleResult} />
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium">Libellés des rôles</h2>
            <p className="text-sm text-muted-foreground">
              Modifiez le nom affiché et le résumé d’aide ; l’attribution des rôles aux comptes se fait dans{" "}
              <Link href="/settings/users" className="text-primary underline-offset-4 hover:underline">
                Utilisateurs
              </Link>
              .
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Libellé (modifiable)</TableHead>
                    <TableHead className="hidden md:table-cell">Résumé</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((r) => (
                    <RoleLabelRow key={r.id} role={r} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </div>

      <div
        role="tabpanel"
        aria-labelledby="tab-attributions"
        className={cn(activeTab !== "attributions" && "hidden")}
      >
        <section className="space-y-4">
          <h2 className="sr-only">Matrice des permissions par rôle</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Développez un rôle, cochez les cases, enregistrez puis rechargez. Domaines : leads, visites techniques,
            documents, installations.
          </p>
          <div className="space-y-6">
            {roles.map((r) => (
              <RolePermissionMatrix
                key={r.id}
                role={r}
                permissions={permissions}
                initialSelected={selectedByRoleId[r.id] ?? []}
              />
            ))}
          </div>
        </section>
      </div>

      <div
        role="tabpanel"
        aria-labelledby="tab-referentiel"
        className={cn(activeTab !== "referentiel" && "hidden")}
      >
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Textes des permissions</h2>
            <p className="text-sm text-muted-foreground">
              Les libellés des 13 permissions de la matrice (quatre domaines). Les codes sont figés ; le code technique
              est affiché pour l’accessibilité (lecteur d’écran).
            </p>
            <div className="space-y-6">
              {permissions.map((p) => (
                <PermissionEditCard key={p.id} permission={p} />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Rappel :</strong> l’attribution des rôles aux comptes se fait dans{" "}
              <Link href="/settings/users" className="text-primary underline-offset-4 hover:underline">
                Utilisateurs
              </Link>
              . Les permissions effectives viennent de la matrice (onglet Attributions) et du moteur de droits.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function RoleLabelRow({ role }: { role: RoleRow }) {
  const router = useRouter();
  const [result, action, pending] = useActionState(
    async (_p: RolesPermissionsMutationResult | null, fd: FormData) => updateRoleLabel(role.id, fd),
    null as RolesPermissionsMutationResult | null,
  );

  const [deleteResult, deleteAction, deletePending] = useActionState(
    async (_p: RolesPermissionsMutationResult | null, fd: FormData) => deleteRole(fd),
    null as RolesPermissionsMutationResult | null,
  );

  useEffect(() => {
    if (result?.ok) {
      router.refresh();
    }
  }, [result, router]);

  useEffect(() => {
    if (deleteResult?.ok) {
      router.refresh();
    }
  }, [deleteResult, router]);

  const summary =
    role.code in ROLE_PERMISSIONS_SUMMARY_FR
      ? ROLE_PERMISSIONS_SUMMARY_FR[role.code as AppRoleCode]
      : "—";

  const protectedRole = role.code === "super_admin";

  return (
    <TableRow>
      <TableCell className="align-top font-mono text-xs">{role.code}</TableCell>
      <TableCell className="align-top">
        <form action={action} className="flex flex-wrap items-end gap-2">
          <Input name="label_fr" defaultValue={role.label_fr} className="max-w-xs" required />
          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
            {pending ? "…" : "Enregistrer"}
          </Button>
          <StatusMsg result={result} />
        </form>
      </TableCell>
      <TableCell className="hidden align-top text-muted-foreground text-sm md:table-cell">{summary}</TableCell>
      <TableCell className="align-top text-right">
        {protectedRole ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <form action={deleteAction} className="inline-flex flex-col items-end gap-1">
            <input type="hidden" name="roleId" value={role.id} />
            <Button type="submit" size="sm" variant="ghost" className="text-destructive" disabled={deletePending}>
              {deletePending ? "…" : "Supprimer"}
            </Button>
            <StatusMsg result={deleteResult} />
          </form>
        )}
      </TableCell>
    </TableRow>
  );
}

function PermissionEditCard({ permission }: { permission: PermissionRow }) {
  const router = useRouter();
  const [result, action, pending] = useActionState(
    async (_p: RolesPermissionsMutationResult | null, fd: FormData) => updatePermission(permission.id, fd),
    null as RolesPermissionsMutationResult | null,
  );

  useEffect(() => {
    if (result?.ok) {
      router.refresh();
    }
  }, [result, router]);

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="sr-only">{permission.code}</p>
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`pl-${permission.id}`}>Libellé</Label>
          <Input id={`pl-${permission.id}`} name="label_fr" defaultValue={permission.label_fr} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`pd-${permission.id}`}>Description</Label>
          <Textarea
            id={`pd-${permission.id}`}
            name="description"
            rows={2}
            defaultValue={permission.description ?? ""}
            placeholder="—"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer la permission"}
          </Button>
          <div className="mt-2">
            <StatusMsg result={result} />
          </div>
        </div>
      </form>
    </div>
  );
}

/** Détail code / historique — uniquement infobulle (interface épurée). */
const PERMISSION_MATRIX_HINT_FR: Partial<Record<string, string>> = {
  "perm.leads.scope_creator_agent": "Ancien code « agent créateur », équivalent au périmètre créateur.",
  "perm.technical_visits.creator_only": "Ancien code « auteur VT uniquement », proche du périmètre créateur.",
};

function MatrixPermissionCheckbox({
  permission,
  checked,
  onToggle,
}: {
  permission: PermissionRow | undefined;
  checked: boolean;
  onToggle: () => void;
}) {
  if (!permission) {
    return <span className="text-muted-foreground/50">—</span>;
  }
  const extraHint = PERMISSION_MATRIX_HINT_FR[permission.code];
  const title = extraHint
    ? `${permission.label_fr} — ${permission.code}. ${extraHint}`
    : `${permission.label_fr} — ${permission.code}`;
  return (
    <label
      title={title}
      className={cn(
        "flex cursor-pointer items-center gap-3 py-1 text-sm leading-snug transition-colors",
        checked ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <input
        type="checkbox"
        name="permissionIds"
        value={permission.id}
        checked={checked}
        onChange={onToggle}
        className="size-4 shrink-0 rounded border-input accent-primary"
        aria-label={permission.label_fr}
      />
      <span className={cn("min-w-0", checked && "font-medium")}>{permission.label_fr}</span>
      <span className="sr-only">{permission.code}</span>
    </label>
  );
}

function RolePermissionMatrix({
  role,
  permissions,
  initialSelected,
}: {
  role: RoleRow;
  permissions: PermissionRow[];
  initialSelected: string[];
}) {
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(initialSelected), [initialSelected]);
  const [local, setLocal] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const p of permissions) {
      m[p.id] = selectedSet.has(p.id);
    }
    return m;
  });

  useEffect(() => {
    const m: Record<string, boolean> = {};
    for (const p of permissions) {
      m[p.id] = selectedSet.has(p.id);
    }
    setLocal(m);
  }, [permissions, selectedSet]);

  const permByCode = useMemo(() => {
    const m = new Map<string, PermissionRow>();
    for (const p of permissions) {
      m.set(p.code, p);
    }
    return m;
  }, [permissions]);

  const [result, action, pending] = useActionState(
    async (_p: RolesPermissionsMutationResult | null, fd: FormData) => setRolePermissions(role.id, fd),
    null as RolesPermissionsMutationResult | null,
  );

  useEffect(() => {
    if (result?.ok) {
      router.refresh();
    }
  }, [result, router]);

  function toggle(pid: string) {
    setLocal((prev) => ({ ...prev, [pid]: !prev[pid] }));
  }

  if (permissions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Aucune permission en base — exécutez la migration SQL du référentiel (matrice à quatre domaines).
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        aria-expanded={panelOpen}
        className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-3.5 text-left transition-colors hover:bg-muted/30"
      >
        <ChevronDown
          className={cn("size-5 shrink-0 text-muted-foreground transition-transform duration-200", panelOpen && "rotate-180")}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium leading-tight">{role.label_fr}</h3>
          <span className="font-mono text-xs text-muted-foreground">{role.code}</span>
        </div>
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {panelOpen ? "Réduire" : "Développer"}
        </span>
      </button>
      <div className={cn(!panelOpen && "hidden")}>
        <div className="space-y-5 p-5">
          <p className="text-xs text-muted-foreground/90">
            Survolez un libellé pour le code technique. Périmètre complet et créateur sont indépendants.
          </p>
          <form action={action} className="space-y-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/80">
                    <th scope="col" className="w-[30%] pb-3 pr-4 align-bottom font-medium text-foreground">
                      Navigation
                    </th>
                    <th scope="col" className="w-[32%] pb-3 pr-4 align-bottom font-medium text-foreground">
                      Tout le périmètre
                    </th>
                    <th scope="col" className="w-[38%] pb-3 align-bottom font-medium text-foreground">
                      Créateur
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_MATRIX_ROWS.map((row, domainIndex) => {
                    const accessP = row.accessCode ? permByCode.get(row.accessCode) : undefined;
                    const scopeAllP = permByCode.get(row.scopeAllCode);
                    return (
                      <Fragment key={row.id}>
                        <tr>
                          <td
                            colSpan={3}
                            className={cn(
                              domainIndex > 0 && "border-t border-border/50 pt-6",
                              domainIndex === 0 && "pt-1",
                            )}
                          >
                            <span className="text-sm font-medium text-foreground">{row.label}</span>
                          </td>
                        </tr>
                        <tr className="align-top">
                          <td className="pr-4 pb-5 pt-3 align-top">
                            {row.accessCode ? (
                              <MatrixPermissionCheckbox
                                permission={accessP}
                                checked={accessP ? (local[accessP.id] ?? false) : false}
                                onToggle={() => {
                                  if (accessP) {
                                    toggle(accessP.id);
                                  }
                                }}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground/80" title="Pas de permission d’écran dédiée pour ce domaine">
                                —
                              </span>
                            )}
                          </td>
                          <td className="pr-4 pb-5 pt-3 align-top">
                            <MatrixPermissionCheckbox
                              permission={scopeAllP}
                              checked={scopeAllP ? (local[scopeAllP.id] ?? false) : false}
                              onToggle={() => {
                                if (scopeAllP) {
                                  toggle(scopeAllP.id);
                                }
                              }}
                            />
                          </td>
                          <td className="pb-5 pt-3 align-top">
                            <div className="flex flex-col gap-3">
                              {row.creatorCodes.map((code) => {
                                const creatorP = permByCode.get(code);
                                return (
                                  <MatrixPermissionCheckbox
                                    key={code}
                                    permission={creatorP}
                                    checked={creatorP ? (local[creatorP.id] ?? false) : false}
                                    onToggle={() => {
                                      if (creatorP) {
                                        toggle(creatorP.id);
                                      }
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Enregistrement…" : `Enregistrer — ${role.label_fr}`}
            </Button>
            <StatusMsg result={result} />
          </form>
        </div>
      </div>
    </div>
  );
}
