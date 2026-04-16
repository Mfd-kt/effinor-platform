"use server";

import { createClient } from "@/lib/supabase/server";
import { getAccessContext } from "@/lib/auth/access-context";
import {
  runApplyRecommendedTechnician,
  type ApplyRecommendedTechnicianInput,
} from "@/features/technical-visits/services/apply-recommended-technician.service";
import type { ApplyRecommendedTechnicianResult } from "@/features/technical-visits/lib/apply-recommended-technician-resolve";

export async function applyRecommendedTechnicianAction(
  input: ApplyRecommendedTechnicianInput,
): Promise<ApplyRecommendedTechnicianResult> {
  const supabase = await createClient();
  const access = await getAccessContext();
  return runApplyRecommendedTechnician(supabase, access, input);
}
