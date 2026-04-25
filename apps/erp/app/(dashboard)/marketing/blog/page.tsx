import Link from "next/link"
import { Eye, FileText, Plus } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { buttonVariants } from "@/components/ui/button-variants"
import { BlogStatusBadge } from "@/features/marketing/blog/components/blog-status-badge"
import { getBlogArticles } from "@/features/marketing/blog/queries/get-blog-articles"
import { requireMarketingStaff } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"

export const metadata = { title: "Articles de blog" }

export default async function BlogListPage() {
  await requireMarketingStaff()
  const articles = await getBlogArticles()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles de blog"
        description={
          articles.length === 0
            ? "Créez votre premier article pour publier sur effinor.fr/blog."
            : `${articles.length} article${articles.length > 1 ? "s" : ""} au total — brouillons, publiés et archivés.`
        }
        actions={
          <Link href="/marketing/blog/new" className={buttonVariants()}>
            <Plus className="size-4" data-icon="inline-start" />
            Nouvel article
          </Link>
        }
      />

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">
            Aucun article pour l&apos;instant
          </p>
          <p className="text-sm text-muted-foreground">
            Créez votre premier article de blog.
          </p>
          <Link
            href="/marketing/blog/new"
            className={cn(buttonVariants(), "mt-4")}
          >
            <Plus className="size-4" data-icon="inline-start" />
            Créer un article
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
                  Catégorie
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
                      <p className="line-clamp-1 font-medium">
                        {article.title}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        /{article.slug}
                      </p>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {article.category ?? "—"}
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
                          href={`https://effinor.fr/blog/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </a>
                      ) : null}
                      <Link
                        href={`/marketing/blog/${article.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
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
