import { describe, expect, it } from "vitest";

import type { QualifiedLeadEmailContext } from "../domain/types";
import type { OpenAiGeneratedQualifiedEmail } from "../domain/types";
import { validateGeneratedQualifiedEmail } from "./validate-generated-email";

const baseCtx: QualifiedLeadEmailContext = {
  company_name: "TestCo",
  activity: "Logistique",
  city: "Lyon",
  postal_code: "69000",
  contact_first_name: null,
  contact_last_name: null,
  contact_full_name: null,
  contact_role: null,
  email: "a@b.co",
  phone: null,
  building_signals: { large_volume: true },
  qualification_notes: null,
  source: "x",
  enrichment_hints: {},
};

describe("validateGeneratedQualifiedEmail", () => {
  it("accepte un e-mail personnalisé correct", () => {
    const gen: OpenAiGeneratedQualifiedEmail = {
      subject: "Lyon — efficacité énergétique (TestCo)",
      email_body: [
        "Bonjour,",
        "",
        "Je me permets de vous écrire concernant TestCo à Lyon et votre activité de logistique.",
        "",
        "Dans le cadre des programmes CEE auxquels participe TotalEnergies, nous accompagnons les sites sur des leviers de performance énergétique.",
        "",
        "Seriez-vous ouvert à un court échange pour préciser le profil de votre bâtiment ?",
        "",
        "Merci pour votre retour éventuel.",
        "",
        "Cordialement,",
      ].join("\n"),
      used_signals: ["company_name", "city", "activity"],
      confidence: "medium",
    };
    const r = validateGeneratedQualifiedEmail(gen, baseCtx);
    expect(r.ok).toBe(true);
  });

  it("refuse une formulation interdite", () => {
    const gen: OpenAiGeneratedQualifiedEmail = {
      subject: "Test",
      email_body: [
        "Bonjour,",
        "",
        "TotalEnergies nous a confié votre dossier pour Lyon.",
        "",
        "Dans le cadre des dispositifs CEE, pouvez-vous nous rappeler ?",
        "",
        "Merci,",
        "",
        "Signé",
      ].join("\n"),
      used_signals: ["city"],
      confidence: "high",
    };
    const r = validateGeneratedQualifiedEmail(gen, baseCtx);
    expect(r.ok).toBe(false);
  });
});
