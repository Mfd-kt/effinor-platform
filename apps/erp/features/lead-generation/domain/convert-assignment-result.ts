export type ConvertLeadGenerationAssignmentInput = {
  assignmentId: string;
  agentId: string;
};

export type ConvertLeadGenerationAssignmentSuccess = {
  status: "success";
  leadId: string;
};

export type ConvertLeadGenerationAssignmentFailure = {
  status:
    | "already_converted"
    | "invalid_assignment_state"
    | "forbidden"
    | "not_found"
    | "error";
  /** Présent pour `error` (exception Postgres / client). */
  message?: string;
};

export type ConvertLeadGenerationAssignmentResult =
  | ConvertLeadGenerationAssignmentSuccess
  | ConvertLeadGenerationAssignmentFailure;
