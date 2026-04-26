import Link from "next/link"
import { MessageSquareQuote, Plus, Star } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { buttonVariants } from "@/components/ui/button-variants"
import { TestimonialStatusBadge } from "@/features/marketing/testimonials/components/testimonial-status-badge"
import { getTestimonials } from "@/features/marketing/testimonials/queries/get-testimonials"
import { requireMarketingStaff } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"

export const metadata = { title: "Témoignages" }

export default async function TestimonialsListPage() {
  await requireMarketingStaff()
  const list = await getTestimonials()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Témoignages"
        description={
          list.length === 0
            ? "Publiez des avis clients sur la page d’accueil effinor.fr."
            : `${list.length} témoignage${list.length > 1 ? "s" : ""} — brouillons, publiés et archivés.`
        }
        actions={
          <Link href="/marketing/testimonials/new" className={buttonVariants()}>
            <Plus className="size-4" data-icon="inline-start" />
            Nouveau témoignage
          </Link>
        }
      />

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <MessageSquareQuote className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">Aucun témoignage</p>
          <p className="text-sm text-muted-foreground">
            Créez un premier témoignage ou importez-les via la migration de seed.
          </p>
          <Link
            href="/marketing/testimonials/new"
            className={cn(buttonVariants(), "mt-4")}
          >
            <Plus className="size-4" data-icon="inline-start" />
            Créer
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Auteur
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                  Ville
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Statut
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                  Créé le
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((t) => (
                <tr
                  key={t.id}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {t.featured ? (
                        <Star className="size-3.5 shrink-0 text-amber-500" aria-hidden />
                      ) : null}
                      <div>
                        <p className="line-clamp-1 font-medium">{t.author_name}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {t.service_type}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {t.author_city}
                  </td>
                  <td className="px-4 py-3">
                    <TestimonialStatusBadge status={t.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {new Date(t.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/marketing/testimonials/${t.id}`}
                      className={buttonVariants({ variant: "link", size: "sm" })}
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
