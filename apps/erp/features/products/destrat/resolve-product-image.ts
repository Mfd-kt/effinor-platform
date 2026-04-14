import type { DestratProduct } from "./types";

/**
 * Résout l’URL d’image à utiliser dans le PDF : primaire, puis secours, sinon null (placeholder).
 */
export function resolveProductImageUrl(product: DestratProduct): string | null {
  const primary = product.imageUrl?.trim();
  if (primary) return primary;
  const fallback = product.fallbackImageUrl?.trim();
  if (fallback) return fallback;
  return null;
}
