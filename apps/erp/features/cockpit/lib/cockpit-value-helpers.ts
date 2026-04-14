import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";

export function valueCentsCallback(cb: CommercialCallbackRow): number {
  if (cb.estimated_value_cents != null && cb.estimated_value_cents > 0) return cb.estimated_value_cents;
  if (cb.estimated_value_eur != null) return Math.round(cb.estimated_value_eur * 100);
  return 0;
}
