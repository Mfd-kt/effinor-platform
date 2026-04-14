"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { deleteUserAsAdmin, setUserPausedAsAdmin } from "@/server/actions/admin-users";
import { cn } from "@/lib/utils";

type AdminUserRowActionsProps = {
  userId: string;
  email: string;
  isActive: boolean;
  isSelf: boolean;
};

export function AdminUserRowActions({ userId, email, isActive, isSelf }: AdminUserRowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

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

  async function onDelete() {
    if (
      !window.confirm(
        `Supprimer définitivement le compte ${email} ? Cette action est irréversible.`,
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void onPauseToggle()}
          >
            {isActive ? "Mettre en pause" : "Réactiver"}
          </Button>
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
export function AdminUserStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
        isActive
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100",
      )}
    >
      {isActive ? "Actif" : "En pause"}
    </span>
  );
}
