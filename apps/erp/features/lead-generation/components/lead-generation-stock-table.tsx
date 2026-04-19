"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatLeadGenerationSourceLabel } from "@/features/lead-generation/lib/lead-generation-display";
import type { LeadGenerationStockListItem } from "@/features/lead-generation/queries/get-lead-generation-stock";
import { formatDateTimeFr } from "@/lib/format";
import { cn } from "@/lib/utils";

import { LeadGenerationCommercialPriorityBadge } from "./lead-generation-commercial-priority-badge";
import { LeadGenerationDispatchQueueBadge } from "./lead-generation-dispatch-queue-badge";
import { LeadGenerationEnrichmentConfidenceBadge } from "./lead-generation-enrichment-confidence-badge";
import { LeadGenerationEnrichmentStatusBadge } from "./lead-generation-enrichment-status-badge";
import {
  LeadGenerationClosingReadinessBadge,
  LeadGenerationLinkedInStockHint,
} from "./lead-generation-closing-readiness-badge";
import {
  LeadGenerationDecisionMakerConfidenceBadge,
  LeadGenerationDecisionMakerIdentifiedBadge,
  LeadGenerationPremiumLeadBadge,
  LeadGenerationTierOutlineBadge,
} from "./lead-generation-premium-badges";

type Props = {
  rows: LeadGenerationStockListItem[];
  /** Sélection pour enrichissement groupé (étape 10). */
  enrichmentSelection?: {
    selected: Set<string>;
    onToggle: (id: string, checked: boolean) => void;
    max: number;
  };
};

export function LeadGenerationStockTable({ rows, enrichmentSelection }: Props) {
  const sel = enrichmentSelection;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {sel ? (
            <TableHead className="w-[40px]">
              <span className="sr-only">Sélection</span>
            </TableHead>
          ) : null}
          <TableHead>Société</TableHead>
          <TableHead>Téléphone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Site</TableHead>
          <TableHead>Ville</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>File</TableHead>
          <TableHead>Closing</TableHead>
          <TableHead>Enrichissement</TableHead>
          <TableHead className="text-right">Score commercial</TableHead>
          <TableHead>Qualif.</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Assigné à</TableHead>
          <TableHead className="whitespace-nowrap">Recyclage</TableHead>
          <TableHead>Créé</TableHead>
          <TableHead className="w-[100px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            {sel ? (
              <TableCell className="align-middle">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={sel.selected.has(r.id)}
                  disabled={!sel.selected.has(r.id) && sel.selected.size >= sel.max}
                  onChange={(e) => sel.onToggle(r.id, e.target.checked)}
                  aria-label={`Sélectionner ${r.company_name}`}
                />
              </TableCell>
            ) : null}
            <TableCell className="max-w-[min(100%,20rem)] font-medium">
              <Link
                href={`/lead-generation/${r.id}`}
                className="text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {r.company_name}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <LeadGenerationTierOutlineBadge tier={r.lead_tier ?? "raw"} compact />
                <div className="flex flex-wrap gap-1">
                  <LeadGenerationPremiumLeadBadge tier={r.lead_tier} compact />
                  <LeadGenerationDecisionMakerIdentifiedBadge
                    compact
                    hasName={Boolean(r.decision_maker_name?.trim())}
                  />
                </div>
                {r.decision_maker_confidence ? (
                  <LeadGenerationDecisionMakerConfidenceBadge
                    compact
                    confidence={r.decision_maker_confidence}
                  />
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{r.normalized_phone ?? "—"}</TableCell>
            <TableCell className="max-w-[180px] truncate text-muted-foreground">{r.email ?? "—"}</TableCell>
            <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">{r.website ?? "—"}</TableCell>
            <TableCell>{r.city ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{formatLeadGenerationSourceLabel(r.source)}</TableCell>
            <TableCell className="max-w-[140px]">
              <LeadGenerationDispatchQueueBadge
                status={r.dispatch_queue_status ?? "review"}
                reason={r.dispatch_queue_reason}
                compact
              />
            </TableCell>
            <TableCell className="max-w-[120px]">
              <div className="flex flex-wrap items-center gap-1">
                <LeadGenerationClosingReadinessBadge
                  compact
                  status={(r.closing_readiness_status ?? "low") as "low" | "medium" | "high"}
                  score={r.closing_readiness_score}
                />
                <LeadGenerationLinkedInStockHint hasLinkedIn={Boolean(r.has_linkedin || r.linkedin_url)} />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <LeadGenerationEnrichmentStatusBadge status={r.enrichment_status ?? "not_started"} />
                {r.enrichment_status === "completed" ? (
                  <LeadGenerationEnrichmentConfidenceBadge compact level={r.enrichment_confidence ?? "low"} />
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex flex-col items-end gap-1">
                <span className="tabular-nums font-medium">{r.commercial_score ?? 0}</span>
                <LeadGenerationCommercialPriorityBadge compact priority={r.commercial_priority ?? "normal"} />
              </div>
            </TableCell>
            <TableCell className="text-xs">{r.qualification_status}</TableCell>
            <TableCell className="text-xs">{r.stock_status}</TableCell>
            <TableCell className="max-w-[180px] text-xs text-muted-foreground">
              {r.assigned_agent_display_name ?? "—"}
            </TableCell>
            <TableCell className="max-w-[100px] text-[11px] text-muted-foreground">
              {r.assignment_recycle_status === "eligible"
                ? "À recycler"
                : r.assignment_recycle_status === "active"
                  ? "—"
                  : r.assignment_recycle_status === "recycled"
                    ? "Recyclée"
                    : r.assignment_recycle_status === "closed"
                      ? "Clos"
                      : "—"}
            </TableCell>
            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
              {formatDateTimeFr(r.created_at)}
            </TableCell>
            <TableCell>
              <Link href={`/lead-generation/${r.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Voir
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
