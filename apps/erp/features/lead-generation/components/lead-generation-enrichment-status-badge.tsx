import { Badge } from "@/components/ui/badge";

const EMOJI: Record<string, string> = {
  completed: "🟢",
  in_progress: "🟡",
  not_started: "⚪",
  failed: "🔴",
};

export function LeadGenerationEnrichmentStatusBadge({ status }: { status: string }) {
  const icon = EMOJI[status] ?? "⚪";
  const label =
    status === "completed"
      ? "Suggestion enregistrée"
      : status === "in_progress"
        ? "En cours"
        : status === "failed"
          ? "Échec"
          : status === "not_started"
            ? "Pas démarré"
            : status;

  return (
    <Badge variant="outline" className="gap-1 font-normal">
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </Badge>
  );
}
