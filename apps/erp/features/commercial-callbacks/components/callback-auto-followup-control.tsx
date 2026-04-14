"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { regenerateCallbackFollowupDraft } from "@/features/commercial-callbacks/actions/regenerate-callback-followup-draft";
import { sendCallbackAutoFollowupNow } from "@/features/commercial-callbacks/actions/send-callback-auto-followup-now";
import { toggleCallbackAutoFollowup } from "@/features/commercial-callbacks/actions/toggle-callback-auto-followup";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

export function CallbackAutoFollowupControl({ row }: { row: CommercialCallbackRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const enabled = row.auto_followup_enabled ?? true;
  const count = row.auto_followup_count ?? 0;
  const last = row.auto_followup_last_sent_at;
  const next = row.auto_followup_next_eligible_at;
  const status = row.auto_followup_status;

  function refresh() {
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 px-3 py-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Relance automatique (e-mail)
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Envoi prudent uniquement si le cas métier est autorisé (pas de spam). Le cron exige{" "}
        <code className="rounded bg-muted px-1 text-[10px]">COMMERCIAL_CALLBACK_AUTO_FOLLOWUP_ENABLED=true</code>.
      </p>
      <dl className="mt-3 space-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Activée</dt>
          <dd className="font-medium">{enabled ? "Oui" : "Non"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Relances auto envoyées</dt>
          <dd className="font-medium">{count}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Dernière relance auto</dt>
          <dd className="text-right font-medium">{fmt(last)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Prochain créneau éligible</dt>
          <dd className="text-right font-medium">{fmt(next)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Dernier statut</dt>
          <dd className="max-w-[12rem] truncate text-right font-mono text-[10px]">{status ?? "—"}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={enabled ? "outline" : "secondary"}
          className="h-8 text-xs"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await toggleCallbackAutoFollowup({ callbackId: row.id, enabled: !enabled });
              if (!res.ok) {
                toast.error(res.error);
                return;
              }
              toast.success(enabled ? "Relance auto désactivée." : "Relance auto activée.");
              refresh();
            })
          }
        >
          {enabled ? "Désactiver" : "Activer"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 text-xs"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await sendCallbackAutoFollowupNow(row.id);
              if (!res.ok) {
                toast.error(res.error);
                return;
              }
              toast[res.sent ? "success" : "message"](res.message ?? "");
              refresh();
            })
          }
        >
          Envoyer maintenant
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await regenerateCallbackFollowupDraft({ callbackId: row.id });
              if (!res.ok) {
                toast.error("Erreur", { description: res.error });
                return;
              }
              toast.success("Brouillon IA régénéré.");
              refresh();
            })
          }
        >
          Régénérer brouillon IA
        </Button>
      </div>
    </div>
  );
}
