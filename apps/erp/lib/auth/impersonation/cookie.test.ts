import { describe, expect, it } from "vitest";

import { IMPERSONATION_COOKIE_PAYLOAD_VERSION } from "@/lib/auth/impersonation/constants";
import { parseImpersonationCookie, serializeImpersonationCookie } from "@/lib/auth/impersonation/cookie";

const SECRET = "01234567890123456789012345678901";

describe("impersonation cookie", () => {
  it("round-trip signe et parse un payload valide", () => {
    const now = Date.now();
    const payload = {
      v: IMPERSONATION_COOKIE_PAYLOAD_VERSION,
      actorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      targetId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      iat: now,
      exp: now + 60_000,
    };
    const raw = serializeImpersonationCookie(payload, SECRET);
    const parsed = parseImpersonationCookie(raw, SECRET);
    expect(parsed).toEqual(payload);
  });

  it("refuse une signature incorrecte", () => {
    const now = Date.now();
    const payload = {
      v: IMPERSONATION_COOKIE_PAYLOAD_VERSION,
      actorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      targetId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      iat: now,
      exp: now + 60_000,
    };
    const raw = serializeImpersonationCookie(payload, SECRET);
    const tampered = `${raw.slice(0, -4)}xxxx`;
    expect(parseImpersonationCookie(tampered, SECRET)).toBeNull();
  });

  it("refuse un jeton expiré", () => {
    const now = Date.now() - 120_000;
    const payload = {
      v: IMPERSONATION_COOKIE_PAYLOAD_VERSION,
      actorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      targetId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      iat: now,
      exp: now + 60_000,
    };
    const raw = serializeImpersonationCookie(payload, SECRET);
    expect(parseImpersonationCookie(raw, SECRET)).toBeNull();
  });
});
