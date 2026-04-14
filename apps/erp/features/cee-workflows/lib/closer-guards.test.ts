import { describe, expect, it } from "vitest";

import { canMarkAgreementAsSigned, hasCommercialDocuments } from "@/features/cee-workflows/lib/closer-guards";

describe("closer guards", () => {
  it("requires agreement to be sent before manual signed state", () => {
    expect(canMarkAgreementAsSigned({ workflowStatus: "agreement_sent", agreementSentAt: null })).toBe(true);
    expect(canMarkAgreementAsSigned({ workflowStatus: "to_close", agreementSentAt: null })).toBe(false);
  });

  it("requires both presentation and agreement documents", () => {
    expect(hasCommercialDocuments({ presentationUrl: "https://a", agreementUrl: "https://b" })).toBe(true);
    expect(hasCommercialDocuments({ presentationUrl: "https://a", agreementUrl: null })).toBe(false);
  });
});
