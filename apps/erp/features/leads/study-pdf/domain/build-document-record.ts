import type { Database } from "@/types/database.types";
import type { StudyPdfViewModel } from "@/features/leads/study-pdf/domain/types";

type LeadDocumentInsert = Database["public"]["Tables"]["lead_documents"]["Insert"];

export function buildLeadStudyDocumentInsert(args: {
  leadId: string;
  createdBy: string;
  fileUrl: string;
  storageBucket: string;
  storagePath: string;
  title: string;
  viewModel: StudyPdfViewModel;
  documentType?: string;
}): LeadDocumentInsert {
  const { leadId, createdBy, fileUrl, storageBucket, storagePath, title, viewModel, documentType } = args;
  return {
    lead_id: leadId,
    document_type: documentType ?? "study_pdf",
    title,
    file_url: fileUrl,
    storage_bucket: storageBucket,
    storage_path: storagePath,
    status: "generated",
    template_version: viewModel.templateVersion,
    metadata: {
      generated_at: viewModel.generatedAtIso,
      generated_by: viewModel.generatedByLabel,
      company_name: viewModel.client.companyName,
    },
    created_by: createdBy,
  };
}
