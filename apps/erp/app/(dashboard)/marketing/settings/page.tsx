import { PageHeader } from "@/components/shared/page-header"
import { SiteSettingsForm } from "@/features/marketing/settings/components/site-settings-form"
import { getSiteSettingsForForm } from "@/features/marketing/settings/queries/get-site-settings"
import { requireMarketingStaff } from "@/lib/auth/guards"

export const metadata = { title: "Paramètres site" }

export default async function MarketingSiteSettingsPage() {
  await requireMarketingStaff()
  const settings = await getSiteSettingsForForm()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres du site"
        description={
          settings
            ? "Contact et statistiques du bandeau de confiance pour effinor.fr. Les pages légales restent éditées dans le code."
            : "Impossible de charger les paramètres. Vérifiez la migration `site_settings` et vos droits."
        }
      />

      {settings ? (
        <SiteSettingsForm initial={settings} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Exécutez la migration Supabase{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">20260425210000_create_site_settings.sql</code>{" "}
          puis rechargez la page.
        </p>
      )}
    </div>
  )
}
