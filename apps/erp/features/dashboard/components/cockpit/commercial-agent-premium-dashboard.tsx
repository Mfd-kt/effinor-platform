import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import type { CommercialAgentCockpitData } from "@/features/dashboard/domain/commercial-agent-cockpit";
import { cn } from "@/lib/utils";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number | null) {
  if (n == null) {
    return "—";
  }
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

function fmtDate(iso: string) {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

type Props = {
  data: CommercialAgentCockpitData;
};

/**
 * Cockpit commercial individuel — hiérarchie cash → pipeline → qualité / efficacité → action → trajectoire.
 * Les KPI proviennent de {@link getCommercialAgentCockpitData} (non dupliqués ici).
 */
export function CommercialAgentPremiumDashboard({ data }: Props) {
  const { cash, pipeline, leadGenQuality, efficiency, priorities, signedRecent, lostRecent } = data;

  const funnelSteps = [
    { label: "Leads reçus", value: pipeline.leadsReceived },
    { label: "Contactés", value: pipeline.leadsContacted },
    { label: "RDV", value: pipeline.rdvScheduled },
    { label: "Envoyés", value: pipeline.quotesSent },
    { label: "Signés", value: pipeline.signed },
  ];

  const conv = [
    { label: "Contactés → reçus", v: pipeline.conversionContactedPct },
    { label: "RDV → contactés", v: pipeline.conversionRdvPct },
    { label: "Envoyés → RDV", v: pipeline.conversionQuotePct },
    { label: "Signés → envoyés", v: pipeline.conversionSignedPct },
  ];

  return (
    <div className="space-y-16 pb-8">
      {/* Niveau 1 — Hero cash */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.12] via-card to-card p-6 shadow-sm ring-1 ring-emerald-500/10 dark:from-emerald-500/[0.08] dark:ring-emerald-500/15 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/90 dark:text-emerald-400/90">
            Résultat
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Votre performance commerciale sur la période — uniquement vos dossiers.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1 lg:row-span-1">
              <div className="flex h-full min-h-[140px] flex-col justify-between rounded-xl border border-emerald-500/30 bg-background/80 px-5 py-5 shadow-inner dark:bg-background/40">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  CA signé
                </span>
                <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
                  {fmtMoney(cash.revenueHt)}
                </p>
                <span className="mt-2 text-[11px] text-muted-foreground">HT — dossiers gagnés sur la période</span>
              </div>
            </div>
            <HeroStat label="Signés" value={String(cash.signedCount)} sub="Dossiers gagnés" />
            <HeroStat label="Perdus" value={String(cash.lostCount)} sub="Clôturés perdus" />
            <HeroStat label="Taux de signature" value={fmtPct(cash.signatureRatePct)} sub="Signés ÷ (signés + perdus)" />
          </div>
        </div>
      </section>

      {/* Niveau 2 — Pipeline */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Pipeline réel</h2>
          <p className="mt-1 text-sm text-muted-foreground">Volumes sur la période et passage d’une étape à l’autre.</p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
          {funnelSteps.map((step, i) => (
            <div key={step.label} className="flex min-w-0 flex-1 items-center lg:flex-col">
              <div className="flex w-full flex-1 flex-col rounded-xl border border-border/90 bg-card px-4 py-4 text-center shadow-sm">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{step.label}</span>
                <span className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{step.value}</span>
              </div>
              {i < funnelSteps.length - 1 ? (
                <div
                  className="hidden shrink-0 items-center justify-center px-1 text-muted-foreground/70 lg:flex lg:py-0"
                  aria-hidden
                >
                  <ChevronRight className="size-5" strokeWidth={2} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
          {conv.map((c) => (
            <div key={c.label} className="text-sm">
              <span className="text-muted-foreground">{c.label} : </span>
              <span className="font-semibold tabular-nums text-foreground">{fmtPct(c.v)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Niveau 3 — Qualité + Efficacité */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Qualité des leads</h2>
            <p className="mt-1 text-sm text-muted-foreground">Prospection (recherche GPT sur vos fiches).</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CompactStat label="Score moyen" value={leadGenQuality.avgLeadScore != null ? String(leadGenQuality.avgLeadScore) : "—"} hint={`n = ${leadGenQuality.sampleSize}`} />
            <CompactStat label="Bon cible" value={fmtPct(leadGenQuality.pctGood)} />
            <CompactStat label="À revoir" value={fmtPct(leadGenQuality.pctReview)} />
            <CompactStat label="Hors cible" value={fmtPct(leadGenQuality.pctOutOfTarget)} />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Efficacité</h2>
            <p className="mt-1 text-sm text-muted-foreground">Activité et ratios sur la période.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CompactStat label="Tentatives d’appel" value={String(efficiency.lgCallAttempts)} />
            <CompactStat label="RDV" value={String(efficiency.rdvCount)} />
            <CompactStat label="Envoyés" value={String(efficiency.quotesSentCount)} />
            <CompactStat label="Signés" value={String(efficiency.signedCount)} />
          </div>
          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 px-4 py-3 text-sm">
            <p>
              <span className="text-muted-foreground">RDV / leads reçus : </span>
              <span className="font-semibold tabular-nums">{fmtPct(efficiency.rdvPerLeadPct)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Envoyés / RDV : </span>
              <span className="font-semibold tabular-nums">{fmtPct(efficiency.quotePerRdvPct)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Signés / envoyés : </span>
              <span className="font-semibold tabular-nums">{fmtPct(efficiency.signedPerQuotePct)}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Niveau 4a — À traiter */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">À traiter maintenant</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cliquez pour ouvrir la vue adaptée.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {priorities.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className={cn(
                "group flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/80 p-4 transition-all",
                "hover:border-primary/25 hover:bg-muted/25",
                "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{p.title}</p>
                {p.hint ? <p className="mt-1 text-xs text-muted-foreground">{p.hint}</p> : null}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-2xl font-bold tabular-nums text-foreground">{p.count}</span>
                <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Niveau 4b — Trajectoire */}
      <section className="grid gap-10 border-t border-border/50 pt-12 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Derniers signés</h2>
          <ul className="space-y-2">
            {signedRecent.length === 0 ? (
              <li className="text-sm text-muted-foreground">Aucun pour l’instant.</li>
            ) : (
              signedRecent.map((r) => (
                <li key={`${r.id}-${r.at}`}>
                  <Link
                    href={`/leads/${r.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-2 text-sm transition-colors hover:border-border hover:bg-muted/30"
                  >
                    <span className="font-medium text-foreground">{r.companyName}</span>
                    <span className="text-xs text-muted-foreground">{fmtDate(r.at)}</span>
                    <span className="w-full text-xs text-muted-foreground">
                      {r.amountHt != null ? fmtMoney(r.amountHt) : "—"}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link href="/agent" className={cn(buttonVariants({ variant: "link", size: "sm" }), "px-0 text-xs")}>
            Poste agent
          </Link>
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Derniers perdus</h2>
          <ul className="space-y-2">
            {lostRecent.length === 0 ? (
              <li className="text-sm text-muted-foreground">Aucun pour l’instant.</li>
            ) : (
              lostRecent.map((r) => (
                <li key={`${r.id}-${r.at}`}>
                  <Link
                    href={`/leads/${r.id}`}
                    className="block rounded-lg border border-transparent px-2 py-2 text-sm transition-colors hover:border-border hover:bg-muted/30"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{r.companyName}</span>
                      <span className="text-xs text-muted-foreground">{fmtDate(r.at)}</span>
                    </div>
                    {r.lossReason ? (
                      <p className="mt-1 text-xs text-muted-foreground">Perdu : {r.lossReason}</p>
                    ) : null}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function HeroStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-background/60 px-5 py-5 dark:bg-background/30">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{value}</p>
      <span className="mt-2 text-[11px] text-muted-foreground">{sub}</span>
    </div>
  );
}

function CompactStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardContent className="p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
        {hint ? <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
