"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserRoundSearch } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  startImpersonation,
  searchImpersonationTargets,
  type ImpersonationSearchRow,
} from "@/features/auth/impersonation/actions";
import { ROLE_LABEL_FR, type AppRoleCode } from "@/lib/auth/role-codes";

type ImpersonationPickerProps = {
  roleOptions: { code: string; label: string }[];
  /** Mode contrôlé : ouverture pilotée depuis l'extérieur (ex. dropdown profil). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Si vrai, masque le bouton trigger interne (utile en mode contrôlé). */
  hideTrigger?: boolean;
};

function roleLabel(code: string): string {
  if (code in ROLE_LABEL_FR) {
    return ROLE_LABEL_FR[code as AppRoleCode];
  }
  return code;
}

export function ImpersonationPicker({
  roleOptions,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: ImpersonationPickerProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    if (controlledOpen === undefined) setUncontrolledOpen(next);
  };
  const [q, setQ] = useState("");
  const [roleCode, setRoleCode] = useState<string>("");
  const [rows, setRows] = useState<ImpersonationSearchRow[]>([]);
  const [pending, startTransition] = useTransition();
  const [searchPending, setSearchPending] = useState(false);

  const runSearch = useCallback(
    async (query: string, role: string | null) => {
      setSearchPending(true);
      try {
        const res = await searchImpersonationTargets({
          q: query,
          roleCode: role && role !== "__all__" ? role : null,
        });
        if (!res.ok) {
          toast.error(res.error);
          setRows([]);
          return;
        }
        setRows(res.rows);
      } finally {
        setSearchPending(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      void runSearch(q, roleCode || null);
    }, 300);
    return () => window.clearTimeout(t);
  }, [open, q, roleCode, runSearch]);

  function pick(row: ImpersonationSearchRow) {
    startTransition(async () => {
      const res = await startImpersonation(row.id);
      if (!res.ok) {
        toast.error("Impersonation impossible", { description: res.error });
        return;
      }
      toast.success(`Vous naviguez maintenant en tant que ${row.email}.`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5">
            <UserRoundSearch className="size-4 shrink-0" />
            <span className="hidden sm:inline">Se connecter en tant que</span>
            <span className="sm:hidden">Impersonation</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Impersonation (super administrateur)</DialogTitle>
          <DialogDescription>
            Recherchez un utilisateur actif pour prévisualiser l’interface avec ses droits. Toutes les
            actions sont journalisées.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="imp-q">Nom ou e-mail</Label>
            <Input
              id="imp-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex. jean ou @effinor"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Rôle</Label>
            <Select
              value={roleCode || "__all__"}
              onValueChange={(v) => setRoleCode(!v || v === "__all__" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tous les rôles</SelectItem>
                {roleOptions.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            {searchPending ? "Recherche…" : `${rows.length} résultat(s)`}
          </p>
          <ul className="max-h-52 space-y-1 overflow-y-auto rounded-md border border-border p-1">
            {rows.length === 0 && !searchPending ? (
              <li className="px-2 py-4 text-center text-sm text-muted-foreground">
                Aucun utilisateur. Affinez la recherche.
              </li>
            ) : (
              rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={pending}
                    className="flex w-full flex-col items-start rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => pick(r)}
                  >
                    <span className="font-medium">{r.full_name?.trim() || r.email}</span>
                    <span className="truncate text-xs text-muted-foreground">{r.email}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {r.role_codes.length > 0
                        ? r.role_codes.map((c) => roleLabel(c)).join(" · ")
                        : "Sans rôle"}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
