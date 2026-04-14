"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { profileInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import type {
  AdminUserMutationResult,
  AdminUserProfileForEdit,
  RoleCatalogRow,
} from "@/server/actions/admin-users";
import {
  setUserPasswordAsAdmin,
  updateUserProfileAsAdmin,
  updateUserRolesAsAdmin,
  uploadUserAvatarAsAdmin,
} from "@/server/actions/admin-users";

export function AdminUserProfileForm({
  profile,
  currentUserId,
  roleCatalog,
}: {
  profile: AdminUserProfileForEdit;
  currentUserId: string;
  roleCatalog: RoleCatalogRow[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);
  const [avatarPending, setAvatarPending] = useState(false);
  /** Force le rechargement de l’aperçu après remplacement du fichier (URL publique identique). */
  const [avatarBust, setAvatarBust] = useState(0);

  const [email, setEmail] = useState(profile.email);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [jobTitle, setJobTitle] = useState(profile.job_title ?? "");
  const [roleSelection, setRoleSelection] = useState<string[]>(() => [...profile.role_codes]);

  const roleCheckboxes = useMemo(() => {
    const catalogByCode = new Map(roleCatalog.map((r) => [r.code, r]));
    const out: RoleCatalogRow[] = [...roleCatalog];
    for (const code of profile.role_codes) {
      if (!catalogByCode.has(code)) {
        out.push({ code, label_fr: code });
      }
    }
    return out;
  }, [roleCatalog, profile.role_codes]);

  const isSelf = profile.id === currentUserId;

  useEffect(() => {
    setEmail(profile.email);
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setJobTitle(profile.job_title ?? "");
    setRoleSelection([...profile.role_codes]);
  }, [profile.email, profile.full_name, profile.phone, profile.job_title, profile.role_codes]);

  const [result, formAction, pending] = useActionState(
    async (_prev: AdminUserMutationResult | null, formData: FormData) => {
      return updateUserProfileAsAdmin(profile.id, formData);
    },
    null as AdminUserMutationResult | null,
  );

  useEffect(() => {
    if (result?.ok) {
      router.refresh();
    }
  }, [result, router]);

  const [rolesResult, rolesFormAction, rolesPending] = useActionState(
    async (_prev: AdminUserMutationResult | null, formData: FormData) => {
      return updateUserRolesAsAdmin(profile.id, formData);
    },
    null as AdminUserMutationResult | null,
  );

  useEffect(() => {
    if (rolesResult?.ok) {
      router.refresh();
    }
  }, [rolesResult, router]);

  const [passwordFormKey, setPasswordFormKey] = useState(0);
  const [passwordResult, passwordFormAction, passwordPending] = useActionState(
    async (_prev: AdminUserMutationResult | null, formData: FormData) => {
      return setUserPasswordAsAdmin(profile.id, formData);
    },
    null as AdminUserMutationResult | null,
  );

  useEffect(() => {
    if (passwordResult?.ok) {
      setPasswordFormKey((k) => k + 1);
      router.refresh();
    }
  }, [passwordResult, router]);

  function toggleRole(code: string) {
    setRoleSelection((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  const initials = profileInitials(profile.full_name, profile.email);

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setAvatarMsg(null);
    setAvatarPending(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadUserAvatarAsAdmin(profile.id, fd);
    setAvatarPending(false);
    e.target.value = "";
    if (res.ok) {
      setAvatarMsg("Photo mise à jour.");
      setAvatarBust((n) => n + 1);
      router.refresh();
      return;
    }
    setAvatarMsg(res.error);
  }

  const avatarSrc =
    profile.avatar_url === null
      ? undefined
      : `${profile.avatar_url}${profile.avatar_url.includes("?") ? "&" : "?"}v=${avatarBust}`;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
          <CardDescription>JPEG, PNG ou WebP — maximum 2 Mo. Remplace la photo existante.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-20">
            {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(ev) => void onAvatarChange(ev)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={avatarPending}
              onClick={() => fileRef.current?.click()}
            >
              {avatarPending ? "Envoi…" : profile.avatar_url ? "Remplacer la photo" : "Ajouter une photo"}
            </Button>
            {avatarMsg ? (
              <p
                className={cn(
                  "text-sm",
                  avatarMsg.startsWith("Photo") ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                )}
              >
                {avatarMsg}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
          <CardDescription>Nom affiché, e-mail de connexion, téléphone et fonction.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                placeholder="Prénom Nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+33 …"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Fonction</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex. Chargé d’affaires"
              />
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
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
          <CardDescription>
            Définir un nouveau mot de passe de connexion pour {isSelf ? "votre compte" : "cet utilisateur"} (minimum 8
            caractères). La confirmation évite les fautes de frappe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form key={passwordFormKey} action={passwordFormAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Au moins 8 caractères"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            {passwordResult ? (
              <p
                className={cn(
                  "text-sm",
                  passwordResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                )}
                role="status"
              >
                {passwordResult.ok ? passwordResult.message : passwordResult.error}
              </p>
            ) : null}
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? "Enregistrement…" : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isSelf ? (
        <Card>
          <CardHeader>
            <CardTitle>Rôles</CardTitle>
            <CardDescription>
              Vous ne pouvez pas modifier vos propres rôles depuis cet écran. Demandez à un autre super
              administrateur si un changement est nécessaire.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Rôles</CardTitle>
            <CardDescription>
              Un ou plusieurs rôles métier (droits dans l’application). Au moins un rôle doit rester
              coché.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={rolesFormAction} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {roleCheckboxes.map((r) => (
                  <label
                    key={r.code}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors",
                      roleSelection.includes(r.code) ? "bg-muted/60" : "hover:bg-muted/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      name="roleCodes"
                      value={r.code}
                      checked={roleSelection.includes(r.code)}
                      onChange={() => toggleRole(r.code)}
                      className="size-4 rounded border-input accent-primary"
                    />
                    <span>{r.label_fr}</span>
                  </label>
                ))}
              </div>
              {rolesResult ? (
                <p
                  className={cn(
                    "text-sm",
                    rolesResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                  )}
                  role="status"
                >
                  {rolesResult.ok ? rolesResult.message : rolesResult.error}
                </p>
              ) : null}
              <Button type="submit" disabled={rolesPending || roleSelection.length === 0}>
                {rolesPending ? "Enregistrement…" : "Enregistrer les rôles"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
