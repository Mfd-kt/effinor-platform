export type RoleDigestTarget = "agent" | "confirmateur" | "closer" | "manager" | "direction";

export type RoleDigestPriority = "low" | "normal" | "high" | "critical";

export type RoleDigestActionType = "open" | "call" | "review" | "fix" | "assign" | "followup";

export type RoleDigestSection = {
  key: string;
  title: string;
  items: string[];
};

export type RoleDigestActionItem = {
  id: string;
  label: string;
  description: string;
  actionType: RoleDigestActionType;
  actionHref: string | null;
  phone: string | null;
  impactEuro: number | null;
  priority: RoleDigestPriority;
};

export type RoleDigest = {
  id: string;
  roleTarget: RoleDigestTarget;
  targetUserId: string | null;
  title: string;
  summary: string;
  priority: RoleDigestPriority;
  sections: RoleDigestSection[];
  actionItems: RoleDigestActionItem[];
  generatedAt: string;
};

export type RoleDigestComputeResult = {
  digest: RoleDigest | null;
  /** Raison si digest absent (discipline). */
  skipReason?: "no_role" | "empty" | "duplicate_suppressed" | "error";
  /** Digest affichable même si non persisté (doublon récent). */
  displayDigest?: RoleDigest | null;
  persisted: boolean;
  dedupeKey?: string;
};
