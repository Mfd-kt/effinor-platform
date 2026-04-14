/** Libellés d’affichage pour modèles de chauffage (brand + model + puissance catalogue). */
export function formatHeatingModelLabel(parts: {
  brand: string;
  model: string;
  power_kw?: number | null;
}): string {
  const p =
    parts.power_kw != null && Number.isFinite(parts.power_kw)
      ? ` · ${parts.power_kw} kW (catalogue)`
      : "";
  return `${parts.brand} ${parts.model}${p}`;
}
