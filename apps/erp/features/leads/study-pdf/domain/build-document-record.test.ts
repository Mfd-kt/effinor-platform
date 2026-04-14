import { describe, expect, it } from "vitest";

import type { StudyPdfViewModel } from "./types";
import { buildLeadStudyDocumentInsert } from "./build-document-record";

describe("buildLeadStudyDocumentInsert", () => {
  it("builds persistence payload linked to lead", () => {
    const vm = {
      templateVersion: "v1",
      generatedAtIso: "2026-04-09T12:00:00.000Z",
      generatedByLabel: "Expert",
      client: { companyName: "Acme" },
    } as StudyPdfViewModel;

    const payload = buildLeadStudyDocumentInsert({
      leadId: "lead-1",
      createdBy: "user-1",
      fileUrl: "https://cdn.example.com/etude.pdf",
      storageBucket: "lead-studies",
      storagePath: "leads/lead-1/study-pdf/file.pdf",
      title: "Etude",
      viewModel: vm,
    });

    expect(payload.lead_id).toBe("lead-1");
    expect(payload.document_type).toBe("study_pdf");
    expect(payload.storage_bucket).toBe("lead-studies");
    expect(payload.created_by).toBe("user-1");
  });
});
