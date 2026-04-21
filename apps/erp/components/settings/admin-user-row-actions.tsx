"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  deleteUserAsAdmin,
  disableUserPermanentlyAsAdmin,
  setUserPausedAsAdmin,
  type AdminAccountLifecycleStatus,
} from "@/server/actions/admin-users";
import { cn } from "@/lib/utils";

type AdminUserRowActionsProps = {
  userId: string;
  email: string;
  status: AdminAccountLifecycleStatus;
  isSelf: boolean;
  /** Faux pour les managers d’équipe (pas de profil / pause / suppression). */
  showPrivilegedActions?: boolean;
};

export function AdminUserRowActions({
  userId,
  email,
  status,
  isSelf,
  showPrivilegedActions = true,
}: AdminUserRowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const isActive = status === "active";
  const isPaused = status === "paused";
  const isTerminal = status === "disabled" || status === "deleted";

  async function onPauseToggle() {
    const msg = isActive
      ? `Mettre en pause ${email} ? La connexion sera bloquée.`
      : `Réactiver le compte ${email} ?`;
    if (!window.confirm(msg)) {
      return;
    }
    setPending(true);
    const r = await setUserPausedAsAdmin(userId, isActive);
    setPending(false);
    if (r.ok) {
      router.refresh();
    } else {
      window.alert(r.error);
    }
  }

  async function onDisablePermanently() {
    if (
      !window.confirm(
        `Désactiver définitivement ${email} ?\n\nCette action est irréversible. Le portefeuille lead generation vivant sera libéré et redispatché.`,
      )
    ) {
      return;
    }
    setPending(true);
    const r = await disableUserPermanentlyAsAdmin(userId);
    setPending(false);
    if (r.ok) {
      router.refresh();
    } else {
      window.alert(r.error);
    }
  }

  async function onDelete() {
    if (
      !window.confirm(
        `Supprimer opérationnellement ${email} ?\n\nLe compte sera retiré des vues opérationnelles, non réactivable, et son portefeuille vivant sera libéré.`,
      )
    ) {
      return;
    }
    setPending(true);
    const r = await deleteUserAsAdmin(userId);
    setPending(false);
    if (r.ok) {
      router.refresh();
    } else {
      window.alert(r.error);
    }
  }

  if (!showPrivilegedActions) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Link
        href={`/settings/users/${userId}`}
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
      >
        Profil
      </Link>
      {isSelf ? null : (
        <>
          {isTerminal ? null : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => void onPauseToggle()}
            >
              {isPaused ? "Réactiver" : "Mettre en pause"}
            </Button>
          )}
          {isTerminal ? null : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => void onDisablePermanently()}
            >
              Désactiver définitivement
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() => void onDelete()}
          >
            Supprimer
          </Button>
        </>
      )}
    </div>
  );
}

/** Badge de statut dans le tableau. */
export function AdminUserStatusBadge({ status }: { status: AdminAccountLifecycleStatus }) {
  const styles =
    status === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      : status === "paused"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
        : status === "disabled"
          ? "border-orange-500/30 bg-orange-500/10 text-orange-900 dark:text-orange-100"
          : "border-destructive/30 bg-destructive/10 text-destructive";
  const label =
    status === "active"
      ? "Actif"
      : status === "paused"
        ? "En pause"
        : status === "disabled"
          ? "Désactivé"
          : "Supprimé";
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
        styles,
      )}
    >
      {label}
    </span>
  );
}
