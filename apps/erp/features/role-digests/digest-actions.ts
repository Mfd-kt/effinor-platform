import type { RoleDigestActionItem, RoleDigestActionType, RoleDigestPriority } from "./digest-types";

export function actionItem(input: {
  id: string;
  label: string;
  description: string;
  actionType: RoleDigestActionType;
  actionHref?: string | null;
  phone?: string | null;
  impactEuro?: number | null;
  priority?: RoleDigestPriority;
}): RoleDigestActionItem {
  return {
    id: input.id,
    label: input.label,
    description: input.description,
    actionType: input.actionType,
    actionHref: input.actionHref ?? null,
    phone: input.phone ?? null,
    impactEuro: input.impactEuro ?? null,
    priority: input.priority ?? "normal",
  };
}
