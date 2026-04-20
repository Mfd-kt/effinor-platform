import OpenAI from "openai";

import type {
  LeadGenerationGptPappersEnrichment,
  LeadGenerationGptResearchDecisionMakerRetryPayload,
  LeadGenerationGptResearchInput,
  LeadGenerationGptResearchPhase1Payload,
  LeadGenerationGptResearchPhase2Payload,
} from "../domain/lead-generation-gpt-research";
import { LEAD_GENERATION_GPT_RESEARCH_DECISION_MAKER_RETRY_JSON_SCHEMA } from "./lead-generation-gpt-research-decision-maker-retry-json-schema";
import { LEAD_GENERATION_GPT_RESEARCH_PHASE1_JSON_SCHEMA } from "./lead-generation-gpt-research-phase1-json-schema";
import { LEAD_GENERATION_GPT_RESEARCH_PHASE2_JSON_SCHEMA } from "./lead-generation-gpt-research-phase2-json-schema";
import {
  buildLeadGenerationGptResearchDecisionMakerRetryUserPrompt,
  buildLeadGenerationGptResearchPhase1UserPrompt,
  buildLeadGenerationGptResearchPhase2UserPrompt,
  LEAD_GEN_GPT_DECISION_MAKER_RETRY_INSTRUCTIONS,
  LEAD_GEN_GPT_PHASE1_ANALYST_INSTRUCTIONS,
  LEAD_GEN_GPT_PHASE2_SYNTHESIS_INSTRUCTIONS,
} from "./lead-generation-gpt-research-prompts";

export function getLeadGenerationGptResearchOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const timeout = Math.max(10_000, parseInt(process.env.OPENAI_LEAD_GEN_GPT_RESEARCH_TIMEOUT_MS ?? "120000", 10) || 120_000);
  return new OpenAI({ apiKey, timeout });
}

export function getLeadGenerationGptResearchModel(): string {
  return (process.env.OPENAI_LEAD_GEN_GPT_RESEARCH_MODEL ?? "gpt-4.1").trim() || "gpt-4.1";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function extractLeadGenerationGptResearchOutputJson(response: unknown): unknown {
  if (!isRecord(response)) {
    throw new Error("Réponse OpenAI invalide.");
  }
  const output = response.output;
  if (!Array.isArray(output)) {
    throw new Error("Réponse OpenAI sans sortie structurée.");
  }
  for (const item of output) {
    if (!isRecord(item)) continue;
    if (item.type !== "message") continue;
    const content = item.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!isRecord(part)) continue;
      if (part.type === "output_text" && typeof part.text === "string") {
        return JSON.parse(part.text) as unknown;
      }
    }
  }
  throw new Error("Impossible d’extraire le JSON de la réponse OpenAI.");
}

function buildLeadJson(input: LeadGenerationGptResearchInput): string {
  return JSON.stringify(
    {
      lead: input,
      note:
        "Les données Pappers officielles sont fournies séparément ; reproduis-les dans `pappers_match` sans contradiction.",
    },
    null,
    2,
  );
}

function buildPappersJson(pappers: LeadGenerationGptPappersEnrichment): string {
  return JSON.stringify(
    {
      pappers_server_hint: pappers.match,
      note: "Bloc serveur (API Pappers) — à recopier dans `pappers_match` ; ne pas inventer de SIREN/SIRET.",
    },
    null,
    2,
  );
}

function maxOutputTokensPrimary(): number {
  return Math.min(
    16_384,
    Math.max(2_048, parseInt(process.env.OPENAI_LEAD_GEN_GPT_RESEARCH_MAX_OUTPUT_TOKENS ?? "8192", 10) || 8192),
  );
}

function maxOutputTokensPhase2(): number {
  return Math.min(4096, Math.max(1024, Math.floor(maxOutputTokensPrimary() / 2)));
}

/**
 * Phase 1 — web_search + JSON structuré (sans score / script).
 */
export async function runLeadGenerationGptResearchPhase1Structured(
  openai: OpenAI,
  input: LeadGenerationGptResearchInput,
  pappers: LeadGenerationGptPappersEnrichment,
): Promise<LeadGenerationGptResearchPhase1Payload> {
  const model = getLeadGenerationGptResearchModel();
  const leadJson = buildLeadJson(input);
  const pappersJson = buildPappersJson(pappers);
  const user = buildLeadGenerationGptResearchPhase1UserPrompt(leadJson, pappersJson);

  const response = await openai.responses.create({
    model,
    instructions: LEAD_GEN_GPT_PHASE1_ANALYST_INSTRUCTIONS,
    input: user,
    tools: [{ type: "web_search" }],
    tool_choice: "required",
    text: {
      format: {
        type: "json_schema",
        name: "lead_generation_gpt_research_phase1",
        strict: false,
        schema: LEAD_GENERATION_GPT_RESEARCH_PHASE1_JSON_SCHEMA as unknown as Record<string, unknown>,
        description: "Enquête terrain phase 1 — activité, bâtiment, décideur, sources, reco simple.",
      },
      verbosity: "medium",
    },
    max_output_tokens: maxOutputTokensPrimary(),
  });

  const parsed = extractLeadGenerationGptResearchOutputJson(response);
  if (!isRecord(parsed)) {
    throw new Error("JSON de recherche phase 1 invalide.");
  }
  return parsed as LeadGenerationGptResearchPhase1Payload;
}

/**
 * Retry — mission unique : décideur + sources (web_search).
 */
export async function runLeadGenerationGptResearchDecisionMakerRetryStructured(
  openai: OpenAI,
  input: LeadGenerationGptResearchInput,
  pappers: LeadGenerationGptPappersEnrichment,
  phase1: LeadGenerationGptResearchPhase1Payload,
): Promise<LeadGenerationGptResearchDecisionMakerRetryPayload> {
  const model = getLeadGenerationGptResearchModel();
  const leadJson = buildLeadJson(input);
  const pappersJson = buildPappersJson(pappers);
  const phase1Json = JSON.stringify(phase1, null, 2);
  const user = buildLeadGenerationGptResearchDecisionMakerRetryUserPrompt(leadJson, pappersJson, phase1Json);

  const response = await openai.responses.create({
    model,
    instructions: LEAD_GEN_GPT_DECISION_MAKER_RETRY_INSTRUCTIONS,
    input: user,
    tools: [{ type: "web_search" }],
    tool_choice: "required",
    text: {
      format: {
        type: "json_schema",
        name: "lead_generation_gpt_research_dm_retry",
        strict: false,
        schema: LEAD_GENERATION_GPT_RESEARCH_DECISION_MAKER_RETRY_JSON_SCHEMA as unknown as Record<string, unknown>,
        description: "Retry décideur + sources additionnelles.",
      },
      verbosity: "medium",
    },
    max_output_tokens: Math.min(8192, maxOutputTokensPrimary()),
  });

  const parsed = extractLeadGenerationGptResearchOutputJson(response);
  if (!isRecord(parsed)) {
    throw new Error("JSON de retry décideur invalide.");
  }
  return parsed as LeadGenerationGptResearchDecisionMakerRetryPayload;
}

/**
 * Phase 2 — synthèse commerciale sans outil web.
 */
export async function runLeadGenerationGptResearchPhase2Structured(
  openai: OpenAI,
  input: LeadGenerationGptResearchInput,
  phase1: LeadGenerationGptResearchPhase1Payload,
): Promise<LeadGenerationGptResearchPhase2Payload> {
  const model = getLeadGenerationGptResearchModel();
  const leadJson = buildLeadJson(input);
  const phase1Json = JSON.stringify(phase1, null, 2);
  const user = buildLeadGenerationGptResearchPhase2UserPrompt(leadJson, phase1Json);

  const response = await openai.responses.create({
    model,
    instructions: LEAD_GEN_GPT_PHASE2_SYNTHESIS_INSTRUCTIONS,
    input: user,
    text: {
      format: {
        type: "json_schema",
        name: "lead_generation_gpt_research_phase2",
        strict: false,
        schema: LEAD_GENERATION_GPT_RESEARCH_PHASE2_JSON_SCHEMA as unknown as Record<string, unknown>,
        description: "Synthèse commerciale — score, priorité, script d’appel.",
      },
      verbosity: "medium",
    },
    max_output_tokens: maxOutputTokensPhase2(),
  });

  const parsed = extractLeadGenerationGptResearchOutputJson(response);
  if (!isRecord(parsed)) {
    throw new Error("JSON de synthèse phase 2 invalide.");
  }
  return parsed as LeadGenerationGptResearchPhase2Payload;
}
