import { z } from "zod";

import { CEE_TEAM_ROLE_VALUES } from "@/features/cee-workflows/domain/constants";

const optionalUuid = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value.trim() === "") return undefined;
    return value.trim();
  })
  .pipe(z.union([z.string().uuid(), z.undefined()]));

export const AdminCeeSheetSchema = z.object({
  id: optionalUuid,
  code: z.string().min(1, "Code requis.").max(120),
  name: z.string().min(1, "Nom requis.").max(300),
  category: z.string().max(120).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(999999).optional(),
  is_commercial_active: z.boolean().optional(),
  simulator_key: z.string().min(1, "Simulator key requis.").max(120),
  presentation_template_key: z.string().min(1, "Template présentation requis.").max(200),
  agreement_template_key: z.string().min(1, "Template accord requis.").max(200),
  workflow_key: z.string().max(120).optional().nullable(),
  requires_technical_visit: z.boolean().optional(),
  requires_quote: z.boolean().optional(),
  description: z.string().max(5000).optional().nullable(),
  control_points: z.string().max(50000).optional().nullable(),
  internal_notes: z.string().max(10000).optional().nullable(),
});

export const AdminCeeSheetTeamSchema = z.object({
  sheetId: z.string().uuid(),
  teamName: z.string().min(1, "Nom équipe requis.").max(200),
});

export const AdminCeeSheetTeamMemberCreateSchema = z.object({
  sheetId: z.string().uuid(),
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  roleInTeam: z.enum(CEE_TEAM_ROLE_VALUES),
  isActive: z.boolean().optional(),
});

export const AdminCeeSheetTeamMemberUpdateSchema = z.object({
  memberId: z.string().uuid(),
  roleInTeam: z.enum(CEE_TEAM_ROLE_VALUES).optional(),
  isActive: z.boolean().optional(),
});

export const AdminCeeSheetToggleSchema = z.object({
  sheetId: z.string().uuid(),
  isCommercialActive: z.boolean(),
});
