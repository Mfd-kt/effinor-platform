export type EmailType =
  | "INTERNAL_CREDENTIALS"
  | "LEAD_FIRST_CONTACT"
  | "STUDY_SENT"
  | "SIGNATURE_REMINDER"
  | "CALLBACK_INITIAL"
  | "CALLBACK_FOLLOWUP"
  | "QUALIFIED_PROSPECT";

export type EmailSendStatus = "sent" | "failed";
