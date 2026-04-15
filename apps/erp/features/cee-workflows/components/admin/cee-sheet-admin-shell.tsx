"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { CeeNetworkOverview } from "@/features/cee-workflows/components/admin/cee-network-overview";
import { CeeSheetList } from "@/features/cee-workflows/components/admin/cee-sheet-list";
import {
  CeeSheetForm,
  DEFAULT_ADMIN_CEE_SHEET_FORM,
  formFromSheet,
} from "@/features/cee-workflows/components/admin/cee-sheet-form";
import { CeeSheetTechnicalVisitConfigPanel } from "@/features/cee-workflows/components/admin/cee-sheet-technical-visit-config-panel";
import { CeeSheetTeamPanel } from "@/features/cee-workflows/components/admin/cee-sheet-team-panel";
import type { AdminCeeSheetListItem } from "@/features/cee-workflows/queries/get-admin-cee-sheets";
import type { AdminCeeSheetTeamDetail } from "@/features/cee-workflows/queries/get-cee-sheet-team-with-members";
import type { AssignableProfileOption } from "@/features/cee-workflows/queries/list-assignable-profiles";
import type { AdminCeeNetworkOverviewData } from "@/features/cee-workflows/queries/get-admin-cee-network-overview";
import type { TechnicalVisitTemplateOption } from "@/features/technical-visits/templates/registry";
import { toggleCeeSheetActive } from "@/features/cee-workflows/actions/admin-cee-sheet-actions";
import { useRouter } from "next/navigation";

type Props = {
  sheets: AdminCeeSheetListItem[];
  teamsBySheetId: Record<string, AdminCeeSheetTeamDetail | null>;
  profiles: AssignableProfileOption[];
  networkOverview: AdminCeeNetworkOverviewData;
  technicalVisitTemplateOptions: TechnicalVisitTemplateOption[];
};

export function CeeSheetAdminShell({
  sheets,
  teamsBySheetId,
  profiles,
  networkOverview,
  technicalVisitTemplateOptions,
}: Props) {
  const router = useRouter();
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(sheets[0]?.id ?? null);
  const [creating, setCreating] = useState(false);

  const selectedSheet = useMemo(
    () => sheets.find((sheet) => sheet.id === selectedSheetId) ?? null,
    [selectedSheetId, sheets],
  );
  const selectedTeam = selectedSheetId ? teamsBySheetId[selectedSheetId] ?? null : null;

  async function handleToggle(sheet: AdminCeeSheetListItem) {
    const result = await toggleCeeSheetActive({
      sheetId: sheet.id,
      isCommercialActive: !sheet.isCommercialActive,
    });
    if (result.ok) {
      router.refresh();
    }
  }

  function handleSaved(sheetId: string) {
    setSelectedSheetId(sheetId);
    setCreating(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration fiches CEE"
        description="Créez les fiches CEE, configurez leurs paramètres métier et affectez les équipes agent / confirmateur / closer."
      />

      <CeeNetworkOverview initial={networkOverview} />

      <div className="grid gap-6 xl:grid-cols-[460px_minmax(0,1fr)]">
        <div className="space-y-5">
          <CeeSheetList
            sheets={sheets}
            selectedSheetId={creating ? null : selectedSheetId}
            onSelect={(sheetId) => {
              setCreating(false);
              setSelectedSheetId(sheetId);
            }}
            onCreate={() => {
              setCreating(true);
              setSelectedSheetId(null);
            }}
            onToggleActive={handleToggle}
          />
        </div>

        <div className="space-y-5">
          <CeeSheetForm
            sheet={creating ? null : selectedSheet}
            onSaved={handleSaved}
          />
          <CeeSheetTechnicalVisitConfigPanel
            sheet={creating ? null : selectedSheet}
            templateOptions={technicalVisitTemplateOptions}
          />
          <CeeSheetTeamPanel
            sheetId={creating ? null : selectedSheet?.id ?? null}
            sheetName={creating ? null : selectedSheet?.name ?? null}
            team={creating ? null : selectedTeam}
            profiles={profiles}
            onChanged={() => router.refresh()}
          />
        </div>
      </div>
    </div>
  );
}
