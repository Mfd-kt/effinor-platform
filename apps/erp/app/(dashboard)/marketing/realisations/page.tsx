import Link from "next/link"
import { Eye, ImageIcon, Plus } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { buttonVariants } from "@/components/ui/button-variants"
import { RealisationStatusBadge } from "@/features/marketing/realisations/components/realisation-status-badge"
import { getRealisations } from "@/features/marketing/realisations/queries/get-realisations"
import { SERVICE_TYPE_LABELS } from "@/features/marketing/realisations/schemas/realisation.schema"
import { requireMarketingStaff } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"

export const metadata = { title: "Réalisations" }

export default async function RealisationsListPage() {
  await requireMarketingStaff()
  const realisations = await getRealisations()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réalisations"
        description={
          realisations.length === 0
            ? "Mettez en avant vos chantiers réalisés sur effinor.fr/realisations."
            : `${realisations.length} réalisation${realisations.length > 1 ? "s" : ""} au total — brouillons, publiées et archivées.`
        }
        actions={
          <Link
            href="/marketing/realisations/new"
            className={buttonVariants()}
          >
            <Plus className="size-4" data-icon="inline-start" />
            Nouvelle réalisation
          </Link>
        }
      />

      {realisations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">
            Aucune réalisation pour l&apos;instant
          </p>
          <p className="text-sm text-muted-foreground">
            Créez votre première réalisation pour la publier sur le site.
          </p>
          <Link
            href="/marketing/realisations/new"
            className={cn(buttonVariants(), "mt-4")}
          >
            <Plus className="size-4" data-icon="inline-start" />
            Créer une réalisation
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Titre
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                  Ville
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Service
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Statut
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground xl:table-cell">
                  Créée le
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {realisations.map((r) => {
                const serviceLabel =
                  SERVICE_TYPE_LABELS[
                    r.service_type as keyof typeof SERVICE_TYPE_LABELS
                  ] ?? r.service_type
                return (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="line-clamp-1 font-medium">{r.title}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          /{r.slug}
                        </p>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {r.city}
                      {r.postal_code ? ` (${r.postal_code})` : ""}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      <span className="line-clamp-1">{serviceLabel}</span>
                    </td>
                    <td className="px-4 py-3">
                      <RealisationStatusBadge status={r.status} />
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === "published" ? (
                          <a
                            href={`https://effinor.fr/realisations/${r.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Voir
                          </a>
                        ) : null}
                        <Link
                          href={`/marketing/realisations/${r.id}`}
                          className={cn(
                            buttonVariants({
                              variant: "outline",
                              size: "sm",
                            }),
                          )}
                        >
                          Modifier
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
