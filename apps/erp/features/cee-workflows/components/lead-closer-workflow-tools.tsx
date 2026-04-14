"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Signature, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CloserDocumentsSignaturePanel } from "@/features/cee-workflows/components/closer-documents-signature-panel";
import { CloserSalesForm, DEFAULT_CLOSER_FORM } from "@/features/cee-workflows/components/closer-sales-form";
import {
  markCloserAgreementSigned,
  markCloserWorkflowLost,
  saveCloserNotes,
} from "@/features/cee-workflows/actions/closer-actions";
import { closerNotesDefaultsFromDetail } from "@/features/cee-workflows/lib/closer-notes-defaults";
import type { CloserWorkflowDetail as CloserWorkflowDetailData } from "@/features/cee-workflows/queries/get-closer-workflow-detail";
import type { SaveCloserNotesInput } from "@/features/cee-workflows/schemas/closer-workspace.schema";

export function LeadCloserWorkflowTools({ detail }: { detail: CloserWorkflowDetailData }) {
  const router = useRouter();
  const [form, setForm] = useState<Omit<SaveCloserNotesInput, "workflowId">>(DEFAULT_CLOSER_FORM);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm(closerNotesDefaultsFromDetail(detail));
  }, [detail]);

  function runAction(mode: "save" | "signed" | "lost") {
    setFeedback(null);
    startTransition(async () => {
      const result =
        mode === "save"
          ? await saveCloserNotes({ workflowId: detail.workflow.id, ...form })
          : mode === "signed"
            ? await markCloserAgreementSigned({ workflowId: detail.workflow.id })
            : await markCloserWorkflowLost({
                workflowId: detail.workflow.id,
                lossReason: form.loss_reason,
              });

      if (!result.ok) {
        setFeedback({ type: "err", text: result.message });
        return;
      }

      setFeedback({
        type: "ok",
        text:
          mode === "save"
            ? "Notes closer enregistrées."
            : mode === "signed"
              ? "Dossier marqué signé."
              : "Dossier marqué perdu.",
      });
      router.refresh();
    });
  }

  return (
    <div className="max-w-4xl space-y-5">
      <CloserSalesForm value={form} onChange={setForm} />
      <CloserDocumentsSignaturePanel detail={detail} onUpdated={() => router.refresh()} />

      {feedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.type === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      <Card className="border-border/80 shadow-sm">
        <CardContent className="flex flex-wrap gap-3 py-4">
          <Button variant="outline" onClick={() => runAction("save")} disabled={isPending}>
            <Save className="mr-2 size-4" />
            Sauvegarder notes
          </Button>
          <Button variant="secondary" onClick={() => runAction("signed")} disabled={isPending}>
            <Signature className="mr-2 size-4" />
            Marquer signé
          </Button>
          <Button variant="destructive" onClick={() => runAction("lost")} disabled={isPending}>
            <XCircle className="mr-2 size-4" />
            Marquer perdu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
