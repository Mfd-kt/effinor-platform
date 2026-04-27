import Link from "next/link"
import { Eye, LayoutGrid, Plus } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { buttonVariants } from "@/components/ui/button-variants"
import { BlogStatusBadge } from "@/features/marketing/blog/components/blog-status-badge"
import { getReEnergieArticles } from "@/features/marketing/re-energie/queries/get-re-energie"
import { requireMarketingStaff } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"

const PUBLIC_BASE = "https://effinor.fr"

function publicUrl(row: {
  slug: string
  external_href: string | null
  category: { slug: string } | null
}): string {
  if (row.external_href) {
    if (row.external_href.startsWith("http")) return row.external_href
    return `${PUBLIC_BASE.replace(/\/$/, "")}${row.external_href}`
  }
  return `${PUBLIC_BASE}/services/re/${row.category?.slug ?? "cat"}/${row.slug}`
}

export const metadata = { title: "Rénovation énergétique" }

export default async function ReEnergieListPage() {
  await requireMarketingStaff()
  const articles = await getReEnergieArticles()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fiches — Rénovation énergétique"
        description={
          articles.length === 0
            ? "Créez des fiches pour alimenter le hub effinor.fr/services (grille type effy)."
            : `${articles.length} fiche${articles.length > 1 ? "s" : ""} — brouillons, publiées et archivées.`
        }
        actions={
          <Link href="/marketing/re-energie/new" className={buttonVariants()}>
            <Plus className="size-4" data-icon="inline-start" />
            Nouvelle fiche
          </Link>
        }
      />

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <LayoutGrid className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">Aucune fiche</p>
          <p className="text-sm text-muted-foreground">
            Les fiches s&apos;affichent en colonnes (Isolation, Chauffage, …) sur
            le site public.
          </p>
          <Link
            href="/marketing/re-energie/new"
            className={cn(buttonVariants(), "mt-4")}
          >
            <Plus className="size-4" data-icon="inline-start" />
            Créer une fiche
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
                  Pilier
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
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="line-clamp-1 font-medium">{article.title}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        /{article.slug}
                      </p>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {article.category?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <BlogStatusBadge status={article.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {new Date(article.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {article.status === "published" ? (
                        <a
                          href={publicUrl(article)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </a>
                      ) : null}
                      <Link
                        href={`/marketing/re-energie/${article.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" })
                        )}
                      >
                        Modifier
                      </Link>
                    </div>
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
