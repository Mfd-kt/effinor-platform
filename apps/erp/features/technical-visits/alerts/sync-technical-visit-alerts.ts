import type { SupabaseClient } from "@supabase/supabase-js";

import { isTechnicalVisitAlertsTableUnavailable } from "@/features/technical-visits/alerts/technical-visit-alerts-schema-error";
import { isTechnicalVisitGeoProofsTableUnavailable } from "@/features/technical-visits/geo/geo-proofs-schema-error";
import type { Database, Json, TechnicalVisitStatus } from "@/types/database.types";

import {
  TECHNICAL_VISIT_AUDIO_STALE_MS,
  TECHNICAL_VISIT_MIN_REPORT_CHARS,
  TECHNICAL_VISIT_SYNCED_ALERT_TYPES,
  type TechnicalVisitAlertDesired,
} from "./technical-visit-alert-types";

type Supabase = SupabaseClient<Database>;

const POST_FIELDWORK_STATUSES: ReadonlySet<TechnicalVisitStatus> = new Set([
  "performed",
  "report_pending",
  "validated",
]);

function hasExploitableDynamicContent(answers: unknown): boolean {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return false;
  }
  for (const v of Object.values(answers as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim().length >= TECHNICAL_VISIT_MIN_REPORT_CHARS) {
      return true;
    }
    if (v && typeof v === "object" && hasExploitableDynamicContent(v)) {
      return true;
    }
  }
  return false;
}

async function fetchLatestStartProofRow(
  supabase: Supabase,
  visitId: string,
): Promise<{
  coherence: Database["public"]["Tables"]["technical_visit_geo_proofs"]["Row"]["coherence"];
} | null> {
  const { data, error } = await supabase
    .from("technical_visit_geo_proofs")
    .select("coherence")
    .eq("technical_visit_id", visitId)
    .eq("kind", "visit_start")
    .order("server_recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isTechnicalVisitGeoProofsTableUnavailable(error)) {
      return null;
    }
    console.error("[syncTechnicalVisitAlerts] geo proof", error.message);
    return null;
  }
  return data;
}

async function upsertOpenAlert(supabase: Supabase, visitId: string, d: TechnicalVisitAlertDesired) {
  const { data: existing } = await supabase
    .from("technical_visit_alerts")
    .select("id")
    .eq("technical_visit_id", visitId)
    .eq("alert_type", d.alertType)
    .eq("status", "open")
    .maybeSingle();

  const payload = {
    severity: d.severity,
    title: d.title,
    message: d.message,
    metadata: (d.metadata ?? null) as Json | null,
  };

  if (existing?.id) {
    await supabase.from("technical_visit_alerts").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("technical_visit_alerts").insert({
      technical_visit_id: visitId,
      alert_type: d.alertType,
      ...payload,
      status: "open",
    });
  }
}

async function autoResolveOpenAlertsNotDesired(
  supabase: Supabase,
  visitId: string,
  desiredTypes: ReadonlySet<string>,
) {
  const { data: openRows, error } = await supabase
    .from("technical_visit_alerts")
    .select("id, alert_type")
    .eq("technical_visit_id", visitId)
    .eq("status", "open")
    .in("alert_type", [...TECHNICAL_VISIT_SYNCED_ALERT_TYPES]);

  if (error || !openRows?.length) {
    return;
  }

  const now = new Date().toISOString();
  for (const row of openRows) {
    if (!desiredTypes.has(row.alert_type)) {
      await supabase
        .from("technical_visit_alerts")
        .update({
          status: "resolved",
          resolved_at: now,
          resolved_by: null,
        })
        .eq("id", row.id);
    }
  }
}

/**
 * Recalcule les alertes « pilotage » à partir de l’état courant en base (V1, idempotent).
 * À appeler après signaux clés (démarrage, fin de visite, audio, sauvegarde fiche) et au chargement manager.
 */
export async function refreshTechnicalVisitAlerts(supabase: Supabase, visitId: string): Promise<void> {
  const { error: probeErr } = await supabase.from("technical_visit_alerts").select("id").limit(1);
  if (probeErr && isTechnicalVisitAlertsTableUnavailable(probeErr)) {
    return;
  }

  const { data: visit, error: vErr } = await supabase
    .from("technical_visits")
    .select("id, started_at, status, observations, technical_report, form_answers_json")
    .eq("id", visitId)
    .is("deleted_at", null)
    .maybeSingle();

  if (vErr || !visit) {
    if (vErr) {
      console.error("[refreshTechnicalVisitAlerts] visit", vErr.message);
    }
    return;
  }

  const desired: TechnicalVisitAlertDesired[] = [];
  const desiredTypes = new Set<string>();

  const push = (d: TechnicalVisitAlertDesired) => {
    desired.push(d);
    desiredTypes.add(d.alertType);
  };

  if (visit.started_at) {
    const proof = await fetchLatestStartProofRow(supabase, visitId);
    if (!proof) {
      push({
        alertType: "visit_missing_geo_proof",
        severity: "warning",
        title: "Démarrage sans preuve GPS",
        message:
          "La visite est démarrée mais aucune preuve de géolocalisation n’est enregistrée (table absente, erreur ou démarrage dégradé).",
        metadata: { source: "geo" },
      });
    } else {
      switch (proof.coherence) {
        case "far_from_site":
          push({
            alertType: "geo_far_from_site",
            severity: "warning",
            title: "Écart GPS au démarrage",
            message:
              "Position de démarrage éloignée de l’adresse chantier enregistrée — vérifier la présence terrain ou l’adresse de référence.",
            metadata: { source: "geo", coherence: proof.coherence },
          });
          break;
        case "geo_refused":
          push({
            alertType: "geo_refused",
            severity: "critical",
            title: "Géolocalisation refusée",
            message:
              "Le technicien a démarré la visite sans autoriser la localisation — absence de preuve de présence exploitable.",
            metadata: { source: "geo", coherence: proof.coherence },
          });
          break;
        case "geo_unavailable":
          push({
            alertType: "geo_unavailable",
            severity: "warning",
            title: "Géolocalisation indisponible",
            message:
              "La preuve GPS n’a pas pu être enregistrée au démarrage (indisponible, délai ou navigateur).",
            metadata: { source: "geo", coherence: proof.coherence },
          });
          break;
        case "site_coords_missing":
          push({
            alertType: "site_coords_missing",
            severity: "info",
            title: "Référence chantier sans coordonnées",
            message:
              "Position enregistrée mais le chantier n’a pas de coordonnées de référence pour contrôler la distance.",
            metadata: { source: "geo", coherence: proof.coherence },
          });
          break;
        default:
          break;
      }
    }
  }

  const { data: audioRows } = await supabase
    .from("technical_visit_audio_notes")
    .select("id, transcription_status, transcription_error, updated_at")
    .eq("technical_visit_id", visitId);

  const failedNotes = (audioRows ?? []).filter((r) => r.transcription_status === "failed");
  if (failedNotes.length > 0) {
    const sampleErr = failedNotes.find((n) => n.transcription_error)?.transcription_error ?? null;
    push({
      alertType: "audio_transcription_failed",
      severity: "warning",
      title: "Échec de transcription audio",
      message:
        failedNotes.length === 1
          ? `Une note vocale n’a pas pu être transcrite automatiquement.${sampleErr ? ` Détail : ${sampleErr}` : ""}`
          : `${failedNotes.length} notes vocales en échec de transcription.${sampleErr ? ` Exemple : ${sampleErr}` : ""}`,
      metadata: { source: "audio", failedCount: failedNotes.length, noteIds: failedNotes.map((n) => n.id) },
    });
  }

  const nowMs = Date.now();
  const staleNotes = (audioRows ?? []).filter((r) => {
    if (r.transcription_status !== "transcribing") return false;
    const t = new Date(r.updated_at).getTime();
    return Number.isFinite(t) && nowMs - t > TECHNICAL_VISIT_AUDIO_STALE_MS;
  });
  if (staleNotes.length > 0) {
    push({
      alertType: "audio_transcription_stale",
      severity: "warning",
      title: "Transcription audio bloquée ou lente",
      message: `${staleNotes.length} note(s) restée(s) en transcription au-delà du délai attendu — vérifier le service ou relancer.`,
      metadata: { source: "audio", staleCount: staleNotes.length, noteIds: staleNotes.map((n) => n.id) },
    });
  }

  if (POST_FIELDWORK_STATUSES.has(visit.status)) {
    const obs = visit.observations?.trim() ?? "";
    const rep = visit.technical_report?.trim() ?? "";
    const hasLegacy = obs.length >= TECHNICAL_VISIT_MIN_REPORT_CHARS || rep.length >= TECHNICAL_VISIT_MIN_REPORT_CHARS;
    const hasDyn = hasExploitableDynamicContent(visit.form_answers_json);
    if (!hasLegacy && !hasDyn) {
      push({
        alertType: "visit_sparse_field_report",
        severity: "info",
        title: "Compte-rendu terrain très léger",
        message:
          "Peu ou pas de texte dans les observations, le rapport technique ou le formulaire dynamique — vérifier la complétude avant validation.",
        metadata: { source: "visit", status: visit.status },
      });
    }
  }

  for (const d of desired) {
    await upsertOpenAlert(supabase, visitId, d);
  }

  await autoResolveOpenAlertsNotDesired(supabase, visitId, desiredTypes);
}
