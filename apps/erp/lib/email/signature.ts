type SignatureOptions = {
  signerName?: string;
  signerRole?: string;
  style?: "text" | "html";
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getEmailSignature(options?: SignatureOptions): string {
  const name = options?.signerName?.trim() || "L'équipe Effinor";
  const role = options?.signerRole?.trim() || "Performance énergétique";
  const style = options?.style ?? "text";

  if (style === "html") {
    return `<p style="font-size:13px;color:#94A3B8;margin:0 0 4px">Cordialement,</p>
<p style="font-size:15px;font-weight:700;color:#0F172A;margin:0">${escapeHtml(name)}</p>
<p style="font-size:12px;color:#64748B;margin:4px 0 0">${escapeHtml(role)}</p>`;
  }

  return `Cordialement,\n${name}\n${role}`;
}
