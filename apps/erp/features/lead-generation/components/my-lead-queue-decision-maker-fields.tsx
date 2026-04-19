"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLeadGenerationStockDecisionMakerAction } from "@/features/lead-generation/actions/update-lead-generation-stock-decision-maker-action";
import { cn } from "@/lib/utils";

type Props = {
  stockId: string;
  initialName: string | null | undefined;
  initialRole: string | null | undefined;
  readOnly: boolean;
  className?: string;
};

export function MyLeadQueueDecisionMakerFields({
  stockId,
  initialName,
  initialRole,
  readOnly,
  className,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(initialName?.trim() ?? "");
  const [role, setRole] = useState(initialRole?.trim() ?? "");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  if (readOnly) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Nom du décideur</p>
          <p className="text-sm">{initialName?.trim() || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Rôle dans l&apos;entreprise</p>
          <p className="text-sm">{initialRole?.trim() || "—"}</p>
        </div>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await updateLeadGenerationStockDecisionMakerAction({
        stockId,
        decisionMakerName: name.trim() || null,
        decisionMakerRole: role.trim() || null,
      });
      if (!res.ok) {
        setMessage({ type: "err", text: res.error });
        return;
      }
      setMessage({ type: "ok", text: "Décideur enregistré." });
      router.refresh();
    });
  }

  return (
    <form className={cn("space-y-3", className)} onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lg-dm-name">Nom du décideur</Label>
          <Input
            id="lg-dm-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Jean Dupont"
            maxLength={300}
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lg-dm-role">Rôle dans l&apos;entreprise</Label>
          <Input
            id="lg-dm-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Ex. Directeur général, acheteur…"
            maxLength={300}
            autoComplete="organization-title"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer le décideur"}
        </Button>
        {message ? (
          <p
            className={cn("text-xs", message.type === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
