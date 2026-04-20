/**
 * Phase 2 — synthèse commerciale (sans web_search), à partir du JSON phase 1.
 */
export const LEAD_GENERATION_GPT_RESEARCH_PHASE2_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    lead_score: { type: "number", minimum: 0, maximum: 100 },
    lead_score_breakdown: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          line: { type: "string" },
        },
        required: ["line"],
      },
    },
    commercial_action_recommendation: { type: "string", enum: ["call", "review", "discard"] },
    commercial_action_reason: { type: "string" },
    commercial_priority: { type: "string", enum: ["high", "medium", "low"] },
    commercial_call_script: { type: "string" },
    commercial_call_angle: { type: "string" },
    commercial_contact_target: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        role: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        source: { type: "string" },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: ["name", "role", "email", "phone", "source", "confidence"],
    },
  },
  required: [
    "lead_score",
    "lead_score_breakdown",
    "commercial_action_recommendation",
    "commercial_action_reason",
    "commercial_priority",
    "commercial_call_script",
    "commercial_call_angle",
    "commercial_contact_target",
  ],
} as const;
