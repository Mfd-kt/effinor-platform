import { describe, expect, it } from "vitest";

import {
  formatCallbackDateFr,
  generateInitialCallbackEmail,
} from "@/features/commercial-callbacks/lib/generate-initial-callback-email";

describe("formatCallbackDateFr", () => {
  it("formate une date YYYY-MM-DD en français (calendaire)", () => {
    expect(formatCallbackDateFr("2026-04-15")).toMatch(/avril.*2026/);
  });
});

describe("generateInitialCallbackEmail", () => {
  it("produit un sujet et un corps HTML structurés (CTA + signature)", () => {
    const landing =
      "https://destratificateurs.groupe-effinor.fr/?source=callback_email";
    const { subject, html, text } = generateInitialCallbackEmail({
      callback: { contact_name: "Marie", callback_date: "2026-05-01" },
      agentDisplayName: "Alex Dupont",
      simulatorLandingUrl: landing,
      openPixelSrc: "https://app.example/api/open/uuid",
    });
    expect(subject.length).toBeGreaterThan(5);
    expect(html).toContain("Marie");
    expect(html).toContain("Alex Dupont");
    expect(html).toContain("TotalEnergies");
    expect(html).toContain("#116BAD");
    expect(html).toContain("Confirmation de notre échange");
    expect(html).toContain("Accéder au simulateur");
    expect(html).toContain("destratificateurs.groupe-effinor.fr");
    expect(html).toContain("source=callback_email");
    expect(html).not.toContain("/api/email/callback-sim");
    expect(html).toContain("contact@groupe-effinor.fr");
    expect(html).toContain("api/open/uuid");
    expect(text).toContain("Marie");
    expect(text).toContain("source=callback_email");
    expect(text).toContain("contact@groupe-effinor.fr");
  });
});
