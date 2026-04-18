"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { evaluateLeadGenerationAssignmentRecycleStatusAction } from "@/features/lead-generation/actions/evaluate-lead-generation-assignment-recycle-status-action";
import { recycleLeadGenerationAssignmentAction } from "@/features/lead-generation/actions/recycle-lead-generation-assignment-action";
import {
  LEAD_GENERATION_RECYCLE_REASON_LABELS,
  type LeadGenerationRecycleReasonCode,
} from "@/features/lead-generation/domain/recycle-eligibility";
import type { LeadGenerationAssignmentRecycleSnapshot } from "@/features/lead-generation/queries/get-lead-generation-assignment-recycle-snapshot";
import { formatDateTimeFr } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  eligible: "Éligible au recyclage",
  recycled: "Recyclée",
  closed: "Clos (plus de suivi)",
};

type Props = {
  assignmentId: string | null;
  initialSnapshot: LeadGenerationAssignmentRecycleSnapshot | null;
};

export function LeadGenerationRecyclingSection({ assignmentId, initialSnapshot }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!assignmentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recyclage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune attribution active : le recyclage concerne les fiches distribuées à un commercial. Distribuez la fiche
            pour évaluer ou recycler l’assignation.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!initialSnapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recyclage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Impossible de charger le statut de recyclage pour cette attribution (vérifiez que la base est à jour).
          </p>
        </CardContent>
      </Card>
    );
  }

  const snap = initialSnapshot;
  const reasonLabel =
    snap.recycle_reason && snap.recycle_reason in LEAD_GENERATION_RECYCLE_REASON_LABELS
      ? LEAD_GENERATION_RECYCLE_REASON_LABELS[snap.recycle_reason as LeadGenerationRecycleReasonCode]
      : snap.recycle_reason;

  function runEvaluate() {
    setMessage(null);
    startTransition(async () => {
      const res = await evaluateLeadGenerationAssignmentRecycleStatusAction({ assignmentId });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const st = res.data.recycleStatus;
      setMessage(
        st === "eligible"
          ? "La fiche est éligible au recyclage. Vous pouvez la remettre en stock si vous le souhaitez."
          : st === "active"
            ? "Pas d’éligibilité au recyclage pour l’instant."
            : "Statut mis à jour.",
      );
      router.refresh();
    });
  }

  function runRecycle() {
    setMessage(null);
    startTransition(async () => {
      const res = await recycleLeadGenerationAssignmentAction({ assignmentId });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage("Fiche remise en stock et assignation retirée du circuit actif.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recyclage</CardTitle>
        <p className="text-xs text-muted-foreground">
          Détection des blocages (inactivité, relances dépassées, etc.) et remise en stock manuelle — sans automatisation
          globale.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Statut recyclage</dt>
            <dd>{STATUS_LABELS[snap.recycle_status] ?? snap.recycle_status}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Compteur de recyclages</dt>
            <dd>{snap.recycled_count}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-muted-foreground">Motif (éligibilité)</dt>
            <dd>{reasonLabel ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Éligible depuis</dt>
            <dd>{snap.recycle_eligible_at ? formatDateTimeFr(snap.recycle_eligible_at) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Dernier recyclage</dt>
            <dd>{snap.last_recycled_at ? formatDateTimeFr(snap.last_recycled_at) : "—"}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={runEvaluate} disabled={pending}>
            Évaluer le recyclage
          </Button>
          {snap.recycle_status === "eligible" ? (
            <Button type="button" size="sm" onClick={runRecycle} disabled={pending}>
              Recycler cette fiche
            </Button>
          ) : null}
        </div>
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
