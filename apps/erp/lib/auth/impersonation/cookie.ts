import { createHmac, timingSafeEqual } from "node:crypto";

import { IMPERSONATION_COOKIE_PAYLOAD_VERSION } from "@/lib/auth/impersonation/constants";

export type ImpersonationCookiePayloadV1 = {
  v: typeof IMPERSONATION_COOKIE_PAYLOAD_VERSION;
  actorId: string;
  targetId: string;
  iat: number;
  exp: number;
};

function getSecret(): string {
  const s = process.env.IMPERSONATION_COOKIE_SECRET?.trim();
  if (!s || s.length < 32) {
    throw new Error(
      "IMPERSONATION_COOKIE_SECRET manquant ou trop court (min. 32 caractères). Générer : openssl rand -hex 32",
    );
  }
  return s;
}

function tryGetSecret(): string | null {
  const s = process.env.IMPERSONATION_COOKIE_SECRET?.trim();
  if (!s || s.length < 32) return null;
  return s;
}

function signBlob(blob: string, secret: string): string {
  return createHmac("sha256", secret).update(blob).digest("base64url");
}

/**
 * Sérialise et signe le payload (format : base64url(json).sig).
 */
export function serializeImpersonationCookie(
  payload: ImpersonationCookiePayloadV1,
  secret?: string,
): string {
  const sec = secret ?? getSecret();
  const json = JSON.stringify(payload);
  const blob = Buffer.from(json, "utf8").toString("base64url");
  const sig = signBlob(blob, sec);
  return `${blob}.${sig}`;
}

/**
 * Vérifie la signature et retourne le payload si valide (y compris exp).
 */
export function parseImpersonationCookie(
  raw: string | undefined,
  secret?: string,
): ImpersonationCookiePayloadV1 | null {
  if (!raw?.includes(".")) return null;
  const sec = secret ?? tryGetSecret();
  if (!sec) return null;

  const lastDot = raw.lastIndexOf(".");
  const blob = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  if (!blob || !sig) return null;

  const expected = signBlob(blob, sec);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(blob, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  if (p.v !== IMPERSONATION_COOKIE_PAYLOAD_VERSION) return null;
  if (typeof p.actorId !== "string" || typeof p.targetId !== "string") return null;
  if (typeof p.iat !== "number" || typeof p.exp !== "number") return null;
  if (p.exp <= Date.now()) return null;

  return {
    v: IMPERSONATION_COOKIE_PAYLOAD_VERSION,
    actorId: p.actorId,
    targetId: p.targetId,
    iat: p.iat,
    exp: p.exp,
  };
}
