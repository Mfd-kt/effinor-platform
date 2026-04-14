import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveCallbackInitialEmailSimulatorUrl } from "@/features/commercial-callbacks/lib/callback-initial-email-simulator-url";

describe("resolveCallbackInitialEmailSimulatorUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ajoute source=callback_email à l’URL par défaut", () => {
    vi.stubEnv("CALLBACK_INITIAL_EMAIL_SIMULATOR_URL", undefined);
    const u = resolveCallbackInitialEmailSimulatorUrl();
    expect(u).toContain("destratificateurs.groupe-effinor.fr");
    expect(u).toContain("source=callback_email");
  });

  it("fusionne avec des paramètres existants", () => {
    vi.stubEnv(
      "CALLBACK_INITIAL_EMAIL_SIMULATOR_URL",
      "https://destratificateurs.groupe-effinor.fr/?foo=1",
    );
    const u = new URL(resolveCallbackInitialEmailSimulatorUrl());
    expect(u.searchParams.get("foo")).toBe("1");
    expect(u.searchParams.get("source")).toBe("callback_email");
  });
});
