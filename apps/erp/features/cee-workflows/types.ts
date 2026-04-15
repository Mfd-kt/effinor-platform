import type { Database, Json } from "@/types/database.types";
import type { CeeTeamRole, CeeWorkflowStatus } from "@/features/cee-workflows/domain/constants";

export type CeeSheetWorkflowRow = Database["public"]["Tables"]["lead_sheet_workflows"]["Row"];
export type CeeSheetWorkflowInsert = Database["public"]["Tables"]["lead_sheet_workflows"]["Insert"];
export type CeeSheetWorkflowUpdate = Database["public"]["Tables"]["lead_sheet_workflows"]["Update"];

export type CeeSheetWorkflowEventRow = Database["public"]["Tables"]["lead_sheet_workflow_events"]["Row"];
export type CeeSheetTeamRow = Database["public"]["Tables"]["cee_sheet_teams"]["Row"];
export type CeeSheetTeamMemberRow = Database["public"]["Tables"]["cee_sheet_team_members"]["Row"];
export type CeeSheetRow = Database["public"]["Tables"]["cee_sheets"]["Row"];
export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export type CeeSheetTeamMemberWithProfile = CeeSheetTeamMemberRow & {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
};

export type CeeSheetTeamWithMembers = CeeSheetTeamRow & {
  cee_sheet: Pick<CeeSheetRow, "id" | "code" | "label" | "workflow_key" | "simulator_key"> | null;
  members: CeeSheetTeamMemberWithProfile[];
};

export type WorkflowAssignmentPatch = {
  ceeSheetTeamId?: string | null;
  assignedAgentUserId?: string | null;
  assignedConfirmateurUserId?: string | null;
  assignedCloserUserId?: string | null;
};

export type WorkflowDocumentsPatch = {
  presentationDocumentId?: string | null;
  agreementDocumentId?: string | null;
  quoteDocumentId?: string | null;
};

export type WorkflowSimulationPayload = {
  simulationInputJson: Json;
  simulationResultJson: Json;
};

export type WorkflowQualificationPayload = {
  qualificationDataJson: Json;
  workflowStatus?: CeeWorkflowStatus;
};

export type WorkflowEventInput = {
  workflowId: string;
  eventType: string;
  eventLabel: string;
  payloadJson?: Json;
  createdByUserId?: string | null;
};

export type WorkflowScopedListRow = CeeSheetWorkflowRow & {
  lead: Pick<
    LeadRow,
    | "id"
    | "created_at"
    | "company_name"
    | "lead_status"
    | "cee_sheet_id"
    | "current_workflow_id"
    | "civility"
    | "first_name"
    | "last_name"
    | "contact_name"
    | "phone"
    | "email"
    | "worksite_address"
    | "worksite_city"
    | "worksite_postal_code"
    | "heating_type"
    | "recording_notes"
    | "lead_channel"
    | "lead_origin"
    | "callback_at"
    | "deleted_at"
  > | null;
  cee_sheet: Pick<
    CeeSheetRow,
    | "id"
    | "code"
    | "label"
    | "simulator_key"
    | "workflow_key"
    | "is_commercial_active"
    | "requires_technical_visit"
    | "technical_visit_template_key"
    | "technical_visit_template_version"
  > | null;
  assigned_agent: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  assigned_confirmateur: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  assigned_closer: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  /** Équipe CEE rattachée au workflow (pour affichage du manager). */
  cee_sheet_team?: {
    id: string;
    name: string;
    cee_sheet_team_members: Array<{
      role_in_team: string;
      is_active: boolean;
      user_id: string;
      profile: { id: string; full_name: string | null; email: string } | null;
    }> | null;
  } | null;
};

export type WorkflowRoleBucket = Record<CeeTeamRole, CeeSheetTeamMemberWithProfile[]>;
