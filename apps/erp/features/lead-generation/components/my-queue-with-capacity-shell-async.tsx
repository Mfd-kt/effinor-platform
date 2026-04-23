import { MyLeadGenerationQueueAgentShell } from "@/features/lead-generation/components/my-lead-generation-queue-agent-shell";
import { MyQueueCapacityBanner } from "@/features/lead-generation/components/my-queue-capacity-banner";
import {
  type AgentCommercialCapacityViewModel,
  computeAgentCommercialCapacity,
} from "@/features/lead-generation/lib/agent-commercial-capacity";
import { getLeadGenerationDispatchPolicy } from "@/features/lead-generation/lib/agent-dispatch-policy";
import type { LeadGenerationMyQueueCeeSheetOption } from "@/features/lead-generation/lib/my-queue-cee-sheet-option";
import type { MyLeadGenerationQueueItem } from "@/features/lead-generation/queries/get-my-lead-generation-queue";
import { createClient } from "@/lib/supabase/server";

type Props = {
  userId: string;
  items: MyLeadGenerationQueueItem[];
  ceeSheetOptions: LeadGenerationMyQueueCeeSheetOption[];
};

/**
 * Chargement capacité + shell file : requêtes lourdes (policy, snapshot) séparées
 * du reste de la page pour un premier rendu (header + toasts) plus rapide.
 */
export async function MyQueueWithCapacityShellAsync({ userId, items, ceeSheetOptions }: Props) {
  let effectiveStockCap = 15;
  let commercialCapacity: AgentCommercialCapacityViewModel = { ok: false };
  const supabase = await createClient();
  try {
    const dispatchPolicy = await getLeadGenerationDispatchPolicy(supabase, userId);
    effectiveStockCap = dispatchPolicy.effectiveStockCap;
  } catch {
    effectiveStockCap = 15;
  }
  try {
    commercialCapacity = { ok: true, snapshot: await computeAgentCommercialCapacity(supabase, userId) };
  } catch {
    commercialCapacity = { ok: false };
  }

  return (
    <>
      <MyQueueCapacityBanner
        commercialCapacity={commercialCapacity}
        effectiveStockCap={effectiveStockCap}
        queueLength={items.length}
      />
      <MyLeadGenerationQueueAgentShell
        items={items}
        ceeSheetOptions={ceeSheetOptions}
        viewerUserId={userId}
        effectiveStockCap={effectiveStockCap}
        commercialCapacity={commercialCapacity}
      />
    </>
  );
}
