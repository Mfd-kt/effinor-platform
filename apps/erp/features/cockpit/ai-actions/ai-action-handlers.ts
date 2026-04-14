import { z } from "zod";

import { assignWorkflowUsers } from "@/features/cee-workflows/services/workflow-service";
import { convertCommercialCallbackToLead } from "@/features/commercial-callbacks/actions/convert-callback-to-lead";
import { computeQuickRescheduleParis } from "@/features/commercial-callbacks/lib/quick-reschedule-paris";
import type { CockpitAiActionType } from "@/features/cockpit/types";
import type { AccessContext } from "@/lib/auth/access-context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

const ALLOWED_REDIRECT_PREFIXES = [
  "/cockpit",
  "/commercial-callbacks",
  "/leads",
  "/admin/cee-sheets",
  "/confirmateur",
  "/closer",
] as const;

export function sanitizeInternalRedirect(path: string): string {
  if (!path.startsWith("/")) return "/cockpit";
  const ok = ALLOWED_REDIRECT_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`),
  );
  return ok ? path : "/cockpit";
}

export type AiHandlerResult =
  | { ok: true; resultJson?: Json; clientRedirect?: string; openTel?: string }
  | { ok: false; error: string };

export type AiActionHandlerCtx = {
  supabase: Supabase;
  access: AccessContext;
  actorUserId: string;
  /** Cron / orchestrateur : actions limitées (pas d’e-mail client, pas de conversion auto). */
  orchestratorMode?: boolean;
};

const callCallbackPayload = z.object({
  callback_id: z.string().uuid(),
  phone: z.string().min(3),
});

const openLeadPayload = z.object({
  lead_id: z.string().uuid(),
});

const convertCallbackPayload = z.object({
  callback_id: z.string().uuid(),
});

const assignWorkflowPayload = z.object({
  workflow_id: z.string().uuid(),
  assignee_user_id: z.string().uuid(),
  role: z.enum(["agent", "confirmateur", "closer"]),
});

const notifyUserPayload = z.object({
  title: z.string().min(1).transform((s) => s.trim()),
  body: z
    .string()
    .optional()
    .transform((s) => (s == null ? undefined : s.trim() || undefined)),
  target_user_id: z.string().uuid().nullable(),
});

const fixSheetPayload = z.object({
  sheet_id: z.string().uuid().optional(),
  label: z.string().optional(),
});

const viewAutomationPayload = z.object({
  redirect: z.string().min(1),
});

const rescheduleCallbackPayload = z.object({
  callback_id: z.string().uuid(),
  preset: z.enum([
    "plus_30m",
    "plus_1h",
    "plus_2h",
    "tomorrow_morning",
    "tomorrow_afternoon",
    "next_week",
  ]),
});

export async function runAiActionHandler(
  ctx: AiActionHandlerCtx,
  actionType: CockpitAiActionType,
  payload: Json,
): Promise<AiHandlerResult> {
  switch (actionType) {
    case "call_callback": {
      if (ctx.orchestratorMode) {
        return { ok: false, error: "Suggestion d’appel : réservé à l’interface (pas d’exécution serveur)." };
      }
      const p = callCallbackPayload.safeParse(payload);
      if (!p.success) return { ok: false, error: "Données d’appel invalides." };
      const digits = p.data.phone.replace(/\s/g, "");
      return { ok: true, openTel: `tel:${digits}`, resultJson: { callback_id: p.data.callback_id } };
    }
    case "open_lead": {
      if (ctx.orchestratorMode) {
        return { ok: false, error: "Ouverture de fiche lead non autorisée en orchestrateur." };
      }
      const p = openLeadPayload.safeParse(payload);
      if (!p.success) return { ok: false, error: "Lead invalide." };
      return { ok: true, clientRedirect: `/leads/${p.data.lead_id}`, resultJson: { lead_id: p.data.lead_id } };
    }
    case "convert_callback": {
      if (ctx.orchestratorMode) {
        return { ok: false, error: "Conversion rappel → lead interdite en automatique (sécurité V1)." };
      }
      const p = convertCallbackPayload.safeParse(payload);
      if (!p.success) return { ok: false, error: "Rappel invalide." };
      const r = await convertCommercialCallbackToLead({ callbackId: p.data.callback_id });
      if (!r.ok) return { ok: false, error: r.error };
      return { ok: true, clientRedirect: `/leads/${r.leadId}`, resultJson: { leadId: r.leadId } };
    }
    case "assign_workflow": {
      if (!ctx.orchestratorMode && ctx.access.kind !== "authenticated") return { ok: false, error: "Non authentifié." };
      const p = assignWorkflowPayload.safeParse(payload);
      if (!p.success) return { ok: false, error: "Affectation invalide." };

      const { data: wf, error: wfErr } = await ctx.supabase
        .from("lead_sheet_workflows")
        .select(
          "id, cee_sheet_team_id, assigned_agent_user_id, assigned_confirmateur_user_id, assigned_closer_user_id, workflow_status",
        )
        .eq("id", p.data.workflow_id)
        .maybeSingle();
      if (wfErr || !wf) return { ok: false, error: wfErr?.message ?? "Workflow introuvable." };
      if (wf.workflow_status === "lost") return { ok: false, error: "Workflow perdu." };
      if (!wf.cee_sheet_team_id) return { ok: false, error: "Workflow sans équipe." };

      const { data: member, error: memErr } = await ctx.supabase
        .from("cee_sheet_team_members")
        .select("user_id, role_in_team")
        .eq("cee_sheet_team_id", wf.cee_sheet_team_id)
        .eq("user_id", p.data.assignee_user_id)
        .eq("is_active", true)
        .maybeSingle();
      if (memErr || !member) return { ok: false, error: "Membre d’équipe introuvable." };
      if (member.role_in_team !== p.data.role) {
        return { ok: false, error: "Rôle incompatible avec l’équipe." };
      }

      const { assignee_user_id, role } = p.data;
      if (role === "agent" && wf.assigned_agent_user_id && wf.assigned_agent_user_id !== assignee_user_id) {
        return { ok: false, error: "Un agent est déjà assigné." };
      }
      if (
        role === "confirmateur" &&
        wf.assigned_confirmateur_user_id &&
        wf.assigned_confirmateur_user_id !== assignee_user_id
      ) {
        return { ok: false, error: "Un confirmateur est déjà assigné." };
      }
      if (role === "closer" && wf.assigned_closer_user_id && wf.assigned_closer_user_id !== assignee_user_id) {
        return { ok: false, error: "Un closer est déjà assigné." };
      }

      try {
        await assignWorkflowUsers(ctx.supabase, {
          workflowId: p.data.workflow_id,
          actorUserId: ctx.actorUserId,
          ...(role === "agent" ? { assignedAgentUserId: assignee_user_id } : {}),
          ...(role === "confirmateur" ? { assignedConfirmateurUserId: assignee_user_id } : {}),
          ...(role === "closer" ? { assignedCloserUserId: assignee_user_id } : {}),
        });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Échec affectation." };
      }

      return { ok: true, resultJson: { workflow_id: p.data.workflow_id, assignee_user_id, role } };
    }
    case "notify_user": {
      const p = notifyUserPayload.safeParse(payload);
      if (!p.success) return { ok: false, error: "Notification invalide." };
      const target = p.data.target_user_id ?? ctx.actorUserId;
      const admin = createAdminClient();
      const now = new Date().toISOString();
      const title = p.data.title.slice(0, 500) || "Recommandation cockpit";
      const { error } = await admin.from("app_notifications").insert({
        user_id: target,
        type: "cockpit_ai_recommendation",
        title,
        body: p.data.body?.slice(0, 4000) ?? null,
        severity: "info",
        entity_type: "cockpit_recommendation",
        entity_id: null,
        action_url: "/cockpit",
        is_read: false,
        is_dismissed: false,
        metadata_json: null,
        delivered_at: now,
        dedupe_key: null,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true, resultJson: { target_user_id: target } };
    }
    case "reschedule_callback": {
      if (!ctx.orchestratorMode) {
        return { ok: false, error: "Report automatique réservé à l’orchestrateur IA." };
      }
      const p = rescheduleCallbackPayload.safeParse(payload);
      if (!p.success) return { ok: false, error: "Report invalide." };
      const { data: row, error: fetchErr } = await ctx.supabase
        .from("commercial_callbacks")
        .select("callback_comment")
        .eq("id", p.data.callback_id)
        .is("deleted_at", null)
        .maybeSingle();
      if (fetchErr || !row) return { ok: false, error: fetchErr?.message ?? "Rappel introuvable." };

      const { callback_date, callback_time } = computeQuickRescheduleParis(p.data.preset);
      const stamp = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
      const label = p.data.preset;
      const noteLine = `\n\n[IA orchestrateur ${stamp}] Report auto : ${label} → ${callback_date}${callback_time ? ` ${callback_time}` : ""}`;

      const { error } = await ctx.supabase
        .from("commercial_callbacks")
        .update({
          callback_date,
          callback_time,
          callback_comment: `${row.callback_comment}${noteLine}`,
          status: "pending",
          call_started_at: null,
        })
        .eq("id", p.data.callback_id);

      if (error) return { ok: false, error: error.message };
      return {
        ok: true,
        resultJson: { callback_id: p.data.callback_id, callback_date, callback_time, preset: p.data.preset },
      };
    }
    case "fix_sheet": {
      if (ctx.orchestratorMode) {
        return { ok: false, error: "Modification fiche CEE non autorisée en orchestrateur." };
      }
      void fixSheetPayload.safeParse(payload);
      return {
        ok: true,
        clientRedirect: sanitizeInternalRedirect("/admin/cee-sheets"),
        resultJson: payload as Json,
      };
    }
    case "view_automation": {
      if (ctx.orchestratorMode) {
        return { ok: false, error: "Redirection UI non applicable en orchestrateur." };
      }
      const p = viewAutomationPayload.safeParse(payload);
      if (!p.success) return { ok: false, error: "Cible invalide." };
      return {
        ok: true,
        clientRedirect: sanitizeInternalRedirect(p.data.redirect),
        resultJson: { redirect: sanitizeInternalRedirect(p.data.redirect) },
      };
    }
    default: {
      const _exhaustive: never = actionType;
      void _exhaustive;
      return { ok: false, error: "Action non supportée." };
    }
  }
}
