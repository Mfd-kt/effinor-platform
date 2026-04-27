import type { ReactNode } from "react";

import { MarketingShell } from "@/features/marketing/components/marketing-shell";
import { requireMarketingStaff } from "@/lib/auth/guards";

/**
 * Toutes les routes /marketing/* : bandeau + onglets (comme l’acquisition de leads).
 */
export default async function MarketingLayout({ children }: { children: ReactNode }) {
  await requireMarketingStaff();
  return <MarketingShell>{children}</MarketingShell>;
}
