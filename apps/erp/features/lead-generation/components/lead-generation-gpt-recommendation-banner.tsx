import type { LeadGenerationGptResearchPayload } from "../domain/lead-generation-gpt-research";
import { cn } from "@/lib/utils";

export type GptVisualRecoLevel = "good" | "review" | "out_of_target";

const LEVEL_COPY: Record<GptVisualRecoLevel, { title: string; badgeClass: string; shellClass: string }> = {
  good: {
    title: "Bon potentiel",
    badgeClass:
      "border-emerald-500/50 bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-50",
    shellClass:
      "border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 via-card to-card dark:from-emerald-950/60 dark:via-card dark:to-card",
  },
  review: {
    title: "À vérifier",
    badgeClass:
      "border-amber-500/50 bg-amber-500/12 text-amber-100 ring-1 ring-amber-500/25 dark:bg-amber-950/45 dark:text-amber-50",
    shellClass:
      "border-amber-500/25 bg-gradient-to-br from-amber-950/35 via-card to-card dark:from-amber-950/55 dark:via-card dark:to-card",
  },
  out_of_target: {
    title: "Hors cible probable",
    badgeClass:
      "border-red-500/40 bg-red-950/35 text-red-100 ring-1 ring-red-500/20 dark:bg-red-950/50 dark:text-red-50",
    shellClass:
      "border-red-500/20 bg-gradient-to-br from-red-950/30 via-card to-card dark:from-red-950/45 dark:via-card dark:to-card",
  },
};

function mapRecommendationToLevel(rec: string): GptVisualRecoLevel | null {
  if (rec === "good") return "good";
  if (rec === "review") return "review";
  if (rec === "out_of_target") return "out_of_target";
  return null;
}

function truncateReason(text: string, max = 200): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function sectorShort(s: string): string {
  if (s === "industrial") return "Industriel";
  if (s === "tertiary") return "Tertiaire";
  if (s === "mixed") return "Mixte";
  if (s === "unknown") return "Secteur ?";
  return s;
}

function buildingShort(s: string): string {
  if (s === "industrial") return "Bât. industriel";
  if (s === "tertiary") return "Bât. tertiaire";
  if (s === "mixed") return "Bât. mixte";
  if (s === "unknown") return "Bâtiment ?";
  return s;
}

function confShort(c: string | undefined): string {
  if (c === "high") return "fort";
  if (c === "medium") return "moyen";
  if (c === "low") return "faible";
  return "";
}

type MiniSignal = { key: string; label: string };

function buildMiniSignals(payload: LeadGenerationGptResearchPayload): MiniSignal[] {
  const out: MiniSignal[] = [];

  if (payload.sector) {
    out.push({ key: "sector", label: `Secteur : ${sectorShort(payload.sector)}` });
  }
  if (payload.building_type) {
    out.push({ key: "building", label: `Bâtiment probable : ${buildingShort(payload.building_type)}` });
  }

  const dm = (payload.decision_maker?.name ?? "").trim();
  if (dm.length > 0) {
    out.push({ key: "dm", label: "Décideur identifié" });
  }

  const heat = payload.heating_signals?.filter((x) => x.trim().length > 0) ?? [];
  const surfConf = payload.surface_signal?.confidence;
  if (heat.length > 0) {
    out.push({ key: "heat", label: `Chauffage / clim : ${heat[0].slice(0, 48)}${heat[0].length > 48 ? "…" : ""}` });
  } else if (surfConf && surfConf !== "low") {
    out.push({
      key: "vol",
      label: `Volume / surface : signal ${confShort(surfConf)}`,
    });
  }

  const mc = payload.pappers_match?.match_confidence;
  if (mc === "high" || mc === "medium") {
    out.push({ key: "pappers", label: "Match Pappers fiable" });
  } else if (mc === "low") {
    out.push({ key: "pappers", label: "Pappers : faible" });
  }

  const hc = payload.height_signal?.confidence;
  if (hc && hc !== "low") {
    out.push({ key: "height", label: `Hauteur : signal ${confShort(hc)}` });
  } else if (hc === "low" && out.length < 5) {
    out.push({ key: "height", label: "Hauteur : signal faible" });
  }

  return out.slice(0, 5);
}

type Props = {
  payload: LeadGenerationGptResearchPayload;
  className?: string;
};

/**
 * Synthèse visuelle 2 s — indicatif uniquement, ne remplace pas la décision quantificateur.
 */
export function LeadGenerationGptRecommendationBanner({ payload, className }: Props) {
  const level = mapRecommendationToLevel(payload.qualification_recommendation);
  if (!level) {
    return null;
  }

  const cfg = LEVEL_COPY[level];
  const reason = truncateReason(payload.qualification_reason || "");
  const pills = buildMiniSignals(payload);

  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm",
        cfg.shellClass,
        className,
      )}
      role="region"
      aria-label={`Recommandation GPT : ${cfg.title}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                cfg.badgeClass,
              )}
            >
              {cfg.title}
            </span>
          </div>
          {reason ? (
            <p className="text-sm leading-relaxed text-foreground/95">{reason}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune justification détaillée renvoyée par le modèle.</p>
          )}
          <p className="text-[11px] leading-snug text-muted-foreground/90">
            Recommandation GPT indicative — validation finale humaine requise.
          </p>
        </div>
      </div>

      {pills.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/40 pt-3">
          {pills.map((p, i) => (
            <span
              key={`${p.key}-${i}`}
              className="inline-flex max-w-full items-center rounded-full border border-border/50 bg-background/50 px-2 py-0.5 text-[11px] font-medium text-foreground/85 backdrop-blur-sm dark:bg-background/30"
            >
              {p.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
