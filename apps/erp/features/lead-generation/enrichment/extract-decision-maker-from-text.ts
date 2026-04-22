import type { LeadGenerationDecisionMakerConfidence, LeadGenerationDecisionMakerSource } from "../domain/statuses";

// TODO: Replace with the new public-search hit shape once a Firecrawl replacement is wired.
type SearchHitLike = {
  url: string;
  title?: string | null;
  description?: string | null;
  markdown?: string | null;
};

/** Mot-clés métier — uniquement pour repérer un segment de rôle déjà présent dans le texte. */
const ROLE_REGEX =
  /(directeur|directrice|gérant|gérante|président|présidente|\bpdg\b|\bceo\b|maintenance|technique|exploitation|entrep[oô]t|travaux|énergie|energie|responsable\s+maintenance|responsable\s+technique|directeur\s+de\s+site|directrice\s+de\s+site|directeur\s+d['']exploitation|chef\s+d['']entreprise|dirigeant|dirigeante)/i;

const PARTICLES = new Set([
  "de",
  "du",
  "des",
  "le",
  "la",
  "von",
  "van",
  "st",
  "ben",
]);

export type DecisionMakerCandidate = {
  name: string | null;
  role: string | null;
  source: LeadGenerationDecisionMakerSource;
  confidence: LeadGenerationDecisionMakerConfidence;
};

function normalizeSpaces(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function stripNoise(s: string): string {
  return s
    .replace(/^[-–—•·|:\s]+|[-–—•·|:\s]+$/g, "")
    .replace(/^\(+|\)+$/g, "")
    .trim();
}

export function isLikelyPersonName(s: string): boolean {
  const t = stripNoise(s);
  if (t.length < 4 || t.length > 70) return false;
  if (/[@#]|\bwww\.|https?:\/\//i.test(t)) return false;
  if (/^\d[\d\s.-]*$/.test(t)) return false;
  if (/^(nous|notre|votre|l['’]équipe|équipe|contact|mentions|téléphone|email)\b/i.test(t)) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return false;
  for (const w of words) {
    const core = w.replace(/^[,;.'"(]+|[,;.)'"]+$/g, "");
    if (PARTICLES.has(core.toLowerCase())) continue;
    if (!/^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇŒÆÑ]/.test(core)) {
      return false;
    }
  }
  return true;
}

function extractRoleSegment(line: string): string | null {
  const m = line.match(ROLE_REGEX);
  if (!m || m.index === undefined) return null;
  const start = Math.max(0, m.index - 20);
  const end = Math.min(line.length, m.index + m[0].length + 35);
  const seg = normalizeSpaces(line.slice(start, end));
  if (!ROLE_REGEX.test(seg)) return null;
  return seg.slice(0, 120);
}

/**
 * Extrait nom + rôle d’une ligne si le rôle est explicitement présent dans le texte (pas d’inférence hors texte).
 */
export function extractDecisionMakerFromLine(line: string): { name: string; role: string } | null {
  const raw = line.trim();
  if (raw.length < 8 || raw.length > 400) return null;
  if (!ROLE_REGEX.test(raw)) return null;

  const role = extractRoleSegment(raw);
  if (!role) return null;

  const m = raw.match(ROLE_REGEX);
  if (!m || m.index === undefined) return null;
  const idx = m.index;
  const kwLen = m[0].length;
  const left = stripNoise(raw.slice(0, idx));
  const right = stripNoise(raw.slice(idx + kwLen));

  const tryName = (candidate: string): string | null => {
    const c = stripNoise(candidate);
    if (!c || !isLikelyPersonName(c)) return null;
    return normalizeSpaces(c);
  };

  let name: string | null = null;
  if (left.length > 0 && left.length <= right.length + 5) {
    name = tryName(left);
  }
  if (!name && right.length > 0) {
    name = tryName(right);
  }
  if (!name && left.length > 0) {
    name = tryName(left);
  }

  if (!name) return null;
  return { name, role: normalizeSpaces(role) };
}

export function extractDecisionMakerFromPlainText(
  text: string,
  source: LeadGenerationDecisionMakerSource,
  confidence: LeadGenerationDecisionMakerConfidence,
): DecisionMakerCandidate | null {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/^#+\s*/, "").trim());
  for (const line of lines) {
    if (line.startsWith("|") || line.startsWith("![")) continue;
    const hit = extractDecisionMakerFromLine(line);
    if (hit) {
      return { name: hit.name, role: hit.role, source, confidence };
    }
  }
  const para = text.replace(/\s+/g, " ");
  const hit = extractDecisionMakerFromLine(para);
  if (hit) {
    return { name: hit.name, role: hit.role, source, confidence };
  }
  return null;
}

/** Titres LinkedIn publics : « Prénom Nom - … » — on ne garde que ce qui est littéralement dans le titre. */
export function extractFromLinkedInTitle(title: string): { name: string; role: string | null } | null {
  const t = title.replace(/\s+/g, " ").trim();
  if (t.length < 4) return null;
  const beforeBar = t.split(/\s*\|\s*LinkedIn/i)[0]?.trim() ?? t;
  const parts = beforeBar.split(/\s*-\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const namePart = parts[0]!;
  if (!isLikelyPersonName(namePart)) return null;
  let role: string | null = null;
  if (parts.length >= 2) {
    const second = parts[1]!;
    if (ROLE_REGEX.test(second) && second.length <= 100) {
      role = second;
    }
  }
  return { name: normalizeSpaces(namePart), role: role ? normalizeSpaces(role) : null };
}

export function extractFromSearchHit(
  hit: SearchHitLike,
  source: LeadGenerationDecisionMakerSource,
  confidence: LeadGenerationDecisionMakerConfidence,
): DecisionMakerCandidate | null {
  const url = hit.url.toLowerCase();
  const isLi = url.includes("linkedin.com");

  const title = hit.title?.trim() ?? "";
  const desc = hit.description?.trim() ?? "";
  const md = hit.markdown?.trim() ?? "";

  if (isLi && title) {
    const li = extractFromLinkedInTitle(title);
    if (li) {
      return {
        name: li.name,
        role: li.role,
        source: "linkedin",
        confidence: "high",
      };
    }
  }

  const blob = [title, desc, md.slice(0, 2000)].filter(Boolean).join("\n");
  const fromText = extractDecisionMakerFromPlainText(blob, source, confidence);
  if (!fromText) return null;
  if (isLi) {
    return { ...fromText, source: "linkedin", confidence: "high" };
  }
  return fromText;
}

export function mergeDecisionMakerCandidates(
  website: DecisionMakerCandidate | null,
  google: DecisionMakerCandidate | null,
  linkedin: DecisionMakerCandidate | null,
): DecisionMakerCandidate | null {
  const name = linkedin?.name ?? website?.name ?? google?.name ?? null;
  const role = linkedin?.role ?? website?.role ?? google?.role ?? null;
  if (!name && !role) return null;

  const metaSource = name
    ? linkedin?.name
      ? linkedin
      : website?.name
        ? website
        : google ?? null
    : linkedin?.role
      ? linkedin
      : website?.role
        ? website
        : google ?? null;

  if (!metaSource) return null;

  return {
    name,
    role,
    source: metaSource.source,
    confidence: metaSource.confidence,
  };
}
