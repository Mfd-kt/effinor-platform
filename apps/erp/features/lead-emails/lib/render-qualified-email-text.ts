import { QUALIFIED_EMAIL_SIGNATURE_LINES } from "../templates/qualified-lead-email-template";

export function renderQualifiedEmailPlainText(emailBody: string): string {
  const sig = QUALIFIED_EMAIL_SIGNATURE_LINES.join("\n");
  return `${emailBody.trim()}\n\n--\n${sig}\n`;
}
