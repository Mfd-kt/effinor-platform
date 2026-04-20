/**
 * Retry ciblé — décideur + sources additionnelles uniquement.
 */
export const LEAD_GENERATION_GPT_RESEARCH_DECISION_MAKER_RETRY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    decision_maker: {
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
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          url: { type: "string" },
          title: { type: "string" },
          note: { type: "string" },
        },
        required: ["url", "title", "note"],
      },
    },
  },
  required: ["decision_maker", "sources"],
} as const;
