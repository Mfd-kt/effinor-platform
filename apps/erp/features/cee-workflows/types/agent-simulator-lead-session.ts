import type { AgentProspectFormValue } from "@/features/cee-workflows/components/agent-prospect-form";

/** Session pour ouvrir le simulateur : lead CRM existant ou fiche lead-generation (`lgStock`). */
export type AgentSimulatorLeadSession = {
  leadId?: string;
  leadGenerationStockId?: string;
} & AgentProspectFormValue;
