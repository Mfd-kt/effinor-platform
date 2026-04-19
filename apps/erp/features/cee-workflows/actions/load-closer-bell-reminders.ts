"use server";

import {
  closerEffectiveRelanceAt,
  type CloserQueueItem,
} from "@/features/cee-workflows/lib/closer-workflow-activity";
import { getCloserDashboardData } from "@/features/cee-workflows/queries/get-closer-dashboard-data";
import { formatCivilityNamePair } from "@/features/leads/lib/contact-map";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessCloserWorkspace } from "@/lib/auth/module-access";

export type CloserBellReminderRow = {
  leadId: string;
  workflowId: string;
  companyName: string;
  contactLabel: string | null;
  relanceAt: string | null;
  sheetCode: string | null;
};

function toBellRow(item: CloserQueueItem): CloserBellReminderRow {
  return {
    leadId: item.leadId,
    workflowId: item.workflowId,
    companyName: item.companyName,
    contactLabel: formatCivilityNamePair(item.civility, item.contactName),
    relanceAt: closerEffectiveRelanceAt(item),
    sheetCode: item.sheetCode,
  };
}

/** File « Relances » closer pour le centre de notifications (même logique que le poste Closer). */
export async function loadCloserBellReminders(): Promise<CloserBellReminderRow[]> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessCloserWorkspace(access)) {
    return [];
  }
  const { queue } = await getCloserDashboardData(access);
  return queue.followUps.map(toBellRow);
}
