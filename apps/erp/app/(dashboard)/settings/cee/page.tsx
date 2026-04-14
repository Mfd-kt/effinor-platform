import { PageHeader } from "@/components/shared/page-header";
import { CeeSettingsShell } from "@/features/cee-settings/components/cee-settings-shell";
import { getCeeReferenceData } from "@/features/cee-settings/queries/get-cee-reference-data";
import { requireSuperAdmin } from "@/lib/auth/guards";

export default async function SettingsCeePage() {
  await requireSuperAdmin();
  const initial = await getCeeReferenceData();

  return (
    <div>
      <PageHeader
        title="Réglages CEE"
        description="Référentiels internes : fiches CEE et délégataires. Réservé au super administrateur."
      />
      <CeeSettingsShell initial={initial} />
    </div>
  );
}
