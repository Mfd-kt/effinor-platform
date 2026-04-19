"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeFr } from "@/lib/format";

import { forceRefreshLeadGenerationDropcontactUiAction } from "../actions/force-refresh-lead-generation-dropcontact-ui-action";

export type LeadGenerationDropcontactDebugSnapshot = {
  dropcontact_status: string | null;
  dropcontact_request_id: string | null;
  dropcontact_requested_at: string | null;
  dropcontact_completed_at: string | null;
  dropcontact_last_error: string | null;
  enrichment_status: string | null;
  enrichment_error: string | null;
  updated_at: string | null;
};

type Props = {
  stockId: string;
  snapshot: LeadGenerationDropcontactDebugSnapshot;
};

function fmt(v: string | null): string {
  if (v == null || v === "") return "—";
  return v;
}

function fmtDt(v: string | null): string {
  if (v == null || v === "") return "—";
  try {
    return formatDateTimeFr(v);
  } catch {
    return v;
  }
}

export function LeadGenerationDropcontactAdminDebug({ stockId, snapshot }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  return (
    <Card className="border-dashed border-amber-600/35 bg-amber-500/[0.06] dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-amber-950 dark:text-amber-100">
          Debug Dropcontact (admin)
        </CardTitle>
        <CardDescription className="text-xs text-amber-900/85 dark:text-amber-100/85">
          Valeurs lues en base au rendu de la page. Comparez avec les logs serveur{" "}
          <span className="font-mono">[dropcontact:*]</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <dl className="grid gap-2 sm:grid-cols-2">
          <DebugRow label="dropcontact_status" value={fmt(snapshot.dropcontact_status)} />
          <DebugRow label="dropcontact_request_id" value={fmt(snapshot.dropcontact_request_id)} wide />
          <DebugRow label="dropcontact_requested_at" value={fmtDt(snapshot.dropcontact_requested_at)} />
          <DebugRow label="dropcontact_completed_at" value={fmtDt(snapshot.dropcontact_completed_at)} />
          <DebugRow label="dropcontact_last_error" value={fmt(snapshot.dropcontact_last_error)} wide />
          <DebugRow label="enrichment_status" value={fmt(snapshot.enrichment_status)} />
          <DebugRow label="enrichment_error" value={fmt(snapshot.enrichment_error)} wide />
          <DebugRow label="updated_at (fiche)" value={fmtDt(snapshot.updated_at)} />
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 border-amber-700/40 bg-background/80"
            disabled={pending}
            onClick={() => {
              setNote(null);
              startTransition(async () => {
                const res = await forceRefreshLeadGenerationDropcontactUiAction(stockId);
                setNote(res.message);
                router.refresh();
              });
            }}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Revalidation…
              </>
            ) : (
              "Forcer refresh état Dropcontact"
            )}
          </Button>
        </div>
        {note ? <p className="text-muted-foreground leading-relaxed">{note}</p> : null}
      </CardContent>
    </Card>
  );
}

function DebugRow({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="font-mono text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-all font-mono text-[11px]">{value}</dd>
    </div>
  );
}
