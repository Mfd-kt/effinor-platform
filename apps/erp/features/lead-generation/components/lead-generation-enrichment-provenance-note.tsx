import type { LeadGenerationStockRow } from "@/features/lead-generation/domain/stock-row";

/** Texte factuel selon origine et confiance (étapes 10 / 11). */
export function LeadGenerationEnrichmentProvenanceNote({ stock }: { stock: LeadGenerationStockRow }) {
  if (stock.enrichment_status !== "completed") {
    return null;
  }

  const src = stock.enrichment_source ?? "heuristic";

  if (src === "firecrawl") {
    if (stock.enrichment_confidence === "high") {
      return (
        <p className="text-xs text-muted-foreground">
          Email public vérifié sur le site (extrait du contenu analysé via Firecrawl).
        </p>
      );
    }
    if (stock.enrichment_confidence === "medium") {
      return (
        <p className="text-xs text-muted-foreground">
          Domaine confirmé sur le site public. Aucun email public identifié — indice utile, preuve forte réservée à
          l’email.
        </p>
      );
    }
  }

  if (src === "heuristic") {
    return (
      <p className="text-xs text-muted-foreground">
        Suggestion heuristique : non vérifiée sur le site ; à contrôler avant usage.
      </p>
    );
  }

  return null;
}
