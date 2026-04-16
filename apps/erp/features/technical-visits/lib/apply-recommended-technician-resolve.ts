import type {
  ProfileOption,
  RecommendedTechnician,
  TechnicianRecommendationAvailabilityState,
} from "@/features/technical-visits/types";

export type ApplyRecommendedTechnicianStatus =
  | "applied"
  | "validated_for_form"
  | "rejected_stale"
  | "rejected_no_recommendation"
  | "rejected_not_eligible"
  | "rejected_invalid_context"
  | "rejected_already_recommended"
  | "rejected_form_technician_already_set"
  | "rejected_unauthorized";

export type ApplyRecommendedTechnicianResult = {
  ok: boolean;
  status: ApplyRecommendedTechnicianStatus;
  message: string;
  technician?: { id: string; fullName: string } | null;
  recommendation?: {
    technicianId: string;
    score: number | null;
    distanceKm: number | null;
    conflictingVisitDistanceKm: number | null;
    recommendationReason: string | null;
  } | null;
};

function recoPayload(rec: RecommendedTechnician): ApplyRecommendedTechnicianResult["recommendation"] {
  if (!rec) return null;
  return {
    technicianId: rec.technicianId,
    score: rec.score,
    distanceKm: rec.distanceKm,
    conflictingVisitDistanceKm: rec.conflictingVisitDistanceKm ?? null,
    recommendationReason: rec.recommendationReason,
  };
}

export type ResolveApplyRecommendedTechnicianInput = {
  mode: "create" | "edit";
  availabilityState: TechnicianRecommendationAvailabilityState;
  recommendedTechnician: RecommendedTechnician;
  profiles: ProfileOption[];
  /** Technicien affiché comme « recommandé » au dernier rendu (optionnel). Si fourni et différent du recalcul serveur → rejet « obsolète ». */
  uiDisplayedRecommendedTechnicianId?: string | null;
  /** Création : valeur courante du champ formulaire (ne pas écraser si déjà renseigné). */
  currentFormTechnicianId?: string | null;
  /** Édition : technicien persisté en base avant l’action. */
  persistedTechnicianId?: string | null;
};

export type ResolveApplyRecommendedTechnicianOutcome = {
  result: ApplyRecommendedTechnicianResult;
  actionType: "apply_recommended_assignment" | "replace_with_recommended_assignment";
  logValidationStatus: ApplyRecommendedTechnicianStatus;
};

export function resolveApplyRecommendedTechnician(
  input: ResolveApplyRecommendedTechnicianInput,
): ResolveApplyRecommendedTechnicianOutcome {
  const { mode, availabilityState, recommendedTechnician, profiles } = input;
  const expectedRaw = input.uiDisplayedRecommendedTechnicianId?.trim() ?? "";
  const hasExpected = Boolean(expectedRaw);

  const actionType =
    mode === "create" ? ("apply_recommended_assignment" as const) : ("replace_with_recommended_assignment" as const);

  if (availabilityState !== "ready") {
    return {
      actionType,
      logValidationStatus: "rejected_invalid_context",
      result: {
        ok: false,
        status: "rejected_invalid_context",
        message:
          "Contexte insuffisant : renseignez la date planifiée, le créneau et une localisation chantier exploitable.",
        technician: null,
        recommendation: null,
      },
    };
  }

  if (!recommendedTechnician) {
    const stale = hasExpected;
    const status = stale ? "rejected_stale" : "rejected_no_recommendation";
    return {
      actionType,
      logValidationStatus: status,
      result: {
        ok: false,
        status,
        message: stale
          ? "La recommandation a changé : aucun technicien n’est plus recommandé pour ce contexte. Actualisez la page ou vérifiez les données."
          : "Aucun technicien recommandé actuellement pour ce contexte.",
        technician: null,
        recommendation: null,
      },
    };
  }

  if (hasExpected && expectedRaw !== recommendedTechnician.technicianId) {
    return {
      actionType,
      logValidationStatus: "rejected_stale",
      result: {
        ok: false,
        status: "rejected_stale",
        message:
          "La recommandation a changé depuis l’affichage. Vérifiez les données du formulaire puis réessayez ou actualisez la page.",
        technician: null,
        recommendation: recoPayload(recommendedTechnician),
      },
    };
  }

  const topProfile = profiles.find((p) => p.id === recommendedTechnician.technicianId);
  if (!topProfile?.is_eligible) {
    return {
      actionType,
      logValidationStatus: "rejected_not_eligible",
      result: {
        ok: false,
        status: "rejected_not_eligible",
        message: "Le technicien recommandé n’est plus éligible au moment de l’action.",
        technician: null,
        recommendation: recoPayload(recommendedTechnician),
      },
    };
  }

  if (mode === "create") {
    const cur = input.currentFormTechnicianId?.trim() ?? "";
    if (cur) {
      return {
        actionType: "apply_recommended_assignment",
        logValidationStatus: "rejected_form_technician_already_set",
        result: {
          ok: false,
          status: "rejected_form_technician_already_set",
          message:
            "Un technicien est déjà sélectionné dans le formulaire. Videz le champ ou choisissez manuellement une autre affectation.",
          technician: { id: cur, fullName: topProfile.label },
          recommendation: recoPayload(recommendedTechnician),
        },
      };
    }
    return {
      actionType: "apply_recommended_assignment",
      logValidationStatus: "validated_for_form",
      result: {
        ok: true,
        status: "validated_for_form",
        message: "Technicien recommandé validé : vous pouvez l’appliquer au formulaire.",
        technician: { id: recommendedTechnician.technicianId, fullName: recommendedTechnician.fullName },
        recommendation: recoPayload(recommendedTechnician),
      },
    };
  }

  const persisted = input.persistedTechnicianId?.trim() ?? "";
  if (persisted && persisted === recommendedTechnician.technicianId) {
    return {
      actionType: "replace_with_recommended_assignment",
      logValidationStatus: "rejected_already_recommended",
      result: {
        ok: false,
        status: "rejected_already_recommended",
        message: "Le technicien enregistré est déjà le recommandé.",
        technician: { id: recommendedTechnician.technicianId, fullName: recommendedTechnician.fullName },
        recommendation: recoPayload(recommendedTechnician),
      },
    };
  }

  return {
    actionType: "replace_with_recommended_assignment",
    logValidationStatus: "applied",
    result: {
      ok: true,
      status: "applied",
      message: "Technicien mis à jour avec le recommandé validé.",
      technician: { id: recommendedTechnician.technicianId, fullName: recommendedTechnician.fullName },
      recommendation: recoPayload(recommendedTechnician),
    },
  };
}
