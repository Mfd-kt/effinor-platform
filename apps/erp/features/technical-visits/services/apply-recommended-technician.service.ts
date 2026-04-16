import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { revalidatePath } from "next/cache";

import type { AccessContext } from "@/lib/auth/access-context";
import type { Database, Json } from "@/types/database.types";
import { isTechnicianWithoutDeskVisitPrivileges } from "@/features/technical-visits/access";
import {
  assertTechnicalVisitNotTechnicianRestrictedForViewer,
  assertTechnicianFieldworkSaveAllowedIfApplicable,
} from "@/features/technical-visits/access/technician-mutation-guard";
import {
  resolveApplyRecommendedTechnician,
  type ApplyRecommendedTechnicianResult,
} from "@/features/technical-visits/lib/apply-recommended-technician-resolve";
import { loadTechnicianRecommendationBundle } from "@/features/technical-visits/lib/technical-visit-technician-recommendation-bundle";
import type { GetTechnicalVisitFormOptionsParams } from "@/features/technical-visits/queries/technical-visit-form-options-params";

const DraftSchedulingSchema = z.object({
  scheduled_at: z.string().nullish(),
  time_slot: z.string().nullish(),
  worksite_address: z.string().nullish(),
  worksite_postal_code: z.string().nullish(),
  worksite_city: z.string().nullish(),
  worksite_country: z.string().nullish(),
  targetWorksiteLatitude: z.number().finite().nullish(),
  targetWorksiteLongitude: z.number().finite().nullish(),
});

const ApplyRecommendedTechnicianInputSchema = z.discriminatedUnion("mode", [
  DraftSchedulingSchema.extend({
    mode: z.literal("create"),
    currentFormTechnicianId: z.string().optional().nullable(),
    uiDisplayedRecommendedTechnicianId: z.string().uuid().optional().nullable(),
  }).strict(),
  DraftSchedulingSchema.extend({
    mode: z.literal("edit"),
    visitId: z.string().uuid(),
    uiDisplayedRecommendedTechnicianId: z.string().uuid().optional().nullable(),
  }).strict(),
]);

export type ApplyRecommendedTechnicianInput = z.infer<typeof ApplyRecommendedTechnicianInputSchema>;

function paramsFromDraft(
  parsed: ApplyRecommendedTechnicianInput,
  visitTechnicianProfileId: string | null,
  visitId: string | null,
): GetTechnicalVisitFormOptionsParams {
  return {
    visitTechnicianProfileId,
    visitId,
    targetScheduledAt: parsed.scheduled_at ?? null,
    targetTimeSlot: parsed.time_slot ?? null,
    targetWorksiteLatitude: parsed.targetWorksiteLatitude ?? null,
    targetWorksiteLongitude: parsed.targetWorksiteLongitude ?? null,
    targetWorksiteAddress: parsed.worksite_address ?? null,
    targetWorksitePostalCode: parsed.worksite_postal_code ?? null,
    targetWorksiteCity: parsed.worksite_city ?? null,
    targetWorksiteCountry: parsed.worksite_country ?? null,
  };
}

async function insertAssignmentLog(
  supabase: SupabaseClient<Database>,
  row: Database["public"]["Tables"]["technical_visit_assignment_logs"]["Insert"],
): Promise<void> {
  const { error } = await supabase.from("technical_visit_assignment_logs").insert(row);
  if (error) {
    console.error("technical_visit_assignment_logs insert failed", error.message);
  }
}

export async function runApplyRecommendedTechnician(
  supabase: SupabaseClient<Database>,
  access: AccessContext,
  rawInput: unknown,
): Promise<ApplyRecommendedTechnicianResult> {
  const parsed = ApplyRecommendedTechnicianInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      status: "rejected_invalid_context",
      message: "Requête invalide.",
      technician: null,
      recommendation: null,
    };
  }

  if (access.kind !== "authenticated") {
    return {
      ok: false,
      status: "rejected_unauthorized",
      message: "Authentification requise.",
      technician: null,
      recommendation: null,
    };
  }

  if (isTechnicianWithoutDeskVisitPrivileges(access)) {
    return {
      ok: false,
      status: "rejected_unauthorized",
      message: "Action réservée au bureau.",
      technician: null,
      recommendation: null,
    };
  }

  const actorUserId = access.userId;

  if (parsed.data.mode === "edit") {
    const { data: visitRow, error: visitErr } = await supabase
      .from("technical_visits")
      .select("id, technician_id, status, scheduled_at, started_at")
      .eq("id", parsed.data.visitId)
      .is("deleted_at", null)
      .maybeSingle();

    if (visitErr || !visitRow) {
      return {
        ok: false,
        status: "rejected_invalid_context",
        message: "Visite technique introuvable.",
        technician: null,
        recommendation: null,
      };
    }

    const gate = await assertTechnicalVisitNotTechnicianRestrictedForViewer(access, visitRow);
    if (!gate.ok) {
      return {
        ok: false,
        status: "rejected_unauthorized",
        message: gate.message,
        technician: null,
        recommendation: null,
      };
    }
    const fieldworkGate = await assertTechnicianFieldworkSaveAllowedIfApplicable(access, visitRow);
    if (!fieldworkGate.ok) {
      return {
        ok: false,
        status: "rejected_unauthorized",
        message: fieldworkGate.message,
        technician: null,
        recommendation: null,
      };
    }

    const bundleParams = paramsFromDraft(parsed.data, visitRow.technician_id ?? null, visitRow.id);
    const bundle = await loadTechnicianRecommendationBundle(supabase, bundleParams);

    const resolved = resolveApplyRecommendedTechnician({
      mode: "edit",
      availabilityState: bundle.recommendation.availabilityState,
      recommendedTechnician: bundle.recommendation.recommendedTechnician,
      profiles: bundle.profiles,
      uiDisplayedRecommendedTechnicianId: parsed.data.uiDisplayedRecommendedTechnicianId ?? null,
      persistedTechnicianId: visitRow.technician_id,
    });

    const metadata: Json = {
      availability_state: bundle.recommendation.availabilityState,
      conflicting_visit_id:
        bundle.profiles.find((p) => p.id === bundle.recommendation.recommendedTechnician?.technicianId)
          ?.conflicting_visit_id ?? null,
    };

    const baseLog = {
      technical_visit_id: visitRow.id,
      action_type: resolved.actionType,
      context: "edit" as const,
      actor_user_id: actorUserId,
      previous_technician_id: visitRow.technician_id,
      recommended_technician_id: bundle.recommendation.recommendedTechnician?.technicianId ?? null,
      applied_technician_id:
        resolved.result.ok && resolved.result.status === "applied"
          ? bundle.recommendation.recommendedTechnician?.technicianId
          : null,
      recommendation_score: bundle.recommendation.recommendedTechnician?.score ?? null,
      home_distance_km: bundle.recommendation.recommendedTechnician?.distanceKm ?? null,
      same_day_distance_km:
        bundle.recommendation.recommendedTechnician?.conflictingVisitDistanceKm ?? null,
      recommendation_reason: bundle.recommendation.recommendedTechnician?.recommendationReason ?? null,
      validation_status: resolved.logValidationStatus,
      metadata,
    };

    if (!resolved.result.ok || resolved.result.status !== "applied") {
      void insertAssignmentLog(supabase, baseLog);
      return resolved.result;
    }

    const recommendedId = bundle.recommendation.recommendedTechnician!.technicianId;
    const { data: updated, error: updErr } = await supabase
      .from("technical_visits")
      .update({ technician_id: recommendedId })
      .eq("id", visitRow.id)
      .select("id")
      .maybeSingle();

    if (updErr || !updated) {
      const fail: ApplyRecommendedTechnicianResult = {
        ok: false,
        status: "rejected_invalid_context",
        message: updErr?.message ?? "Mise à jour impossible.",
        technician: null,
        recommendation: resolved.result.recommendation ?? null,
      };
      void insertAssignmentLog(supabase, {
        ...baseLog,
        validation_status: "rejected_invalid_context",
        applied_technician_id: null,
        metadata: { ...((metadata as object) ?? {}), update_error: updErr?.message ?? "no_row" },
      });
      return fail;
    }

    void insertAssignmentLog(supabase, baseLog);

    revalidatePath("/technical-visits");
    revalidatePath(`/technical-visits/${visitRow.id}`);

    return resolved.result;
  }

  /** Création : validation serveur uniquement (pas de persistance VT). */
  const bundleParams = paramsFromDraft(
    parsed.data,
    parsed.data.currentFormTechnicianId?.trim() || null,
    null,
  );
  const bundle = await loadTechnicianRecommendationBundle(supabase, bundleParams);

  const resolved = resolveApplyRecommendedTechnician({
    mode: "create",
    availabilityState: bundle.recommendation.availabilityState,
    recommendedTechnician: bundle.recommendation.recommendedTechnician,
    profiles: bundle.profiles,
    uiDisplayedRecommendedTechnicianId: parsed.data.uiDisplayedRecommendedTechnicianId ?? null,
    currentFormTechnicianId: parsed.data.currentFormTechnicianId,
  });

  const metadata: Json = {
    availability_state: bundle.recommendation.availabilityState,
    conflicting_visit_id:
      bundle.profiles.find((p) => p.id === bundle.recommendation.recommendedTechnician?.technicianId)
        ?.conflicting_visit_id ?? null,
  };

  void insertAssignmentLog(supabase, {
    technical_visit_id: null,
    action_type: resolved.actionType,
    context: "create",
    actor_user_id: actorUserId,
    previous_technician_id: null,
    recommended_technician_id: bundle.recommendation.recommendedTechnician?.technicianId ?? null,
    applied_technician_id:
      resolved.result.ok && resolved.result.status === "validated_for_form"
        ? bundle.recommendation.recommendedTechnician?.technicianId
        : null,
    recommendation_score: bundle.recommendation.recommendedTechnician?.score ?? null,
    home_distance_km: bundle.recommendation.recommendedTechnician?.distanceKm ?? null,
    same_day_distance_km: bundle.recommendation.recommendedTechnician?.conflictingVisitDistanceKm ?? null,
    recommendation_reason: bundle.recommendation.recommendedTechnician?.recommendationReason ?? null,
    validation_status: resolved.logValidationStatus,
    metadata,
  });

  return resolved.result;
}
