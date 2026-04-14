import type { AccessContext } from "@/lib/auth/access-context";
import { getAgentAvailableSheets } from "@/features/cee-workflows/queries/get-agent-available-sheets";

export async function getConfirmateurAvailableSheets(access: AccessContext) {
  const sheets = await getAgentAvailableSheets(access);
  return sheets.filter((sheet) => sheet.roles.includes("confirmateur") || sheet.roles.includes("manager"));
}
