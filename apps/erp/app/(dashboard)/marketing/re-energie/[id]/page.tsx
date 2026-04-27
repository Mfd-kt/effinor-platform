import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { buttonVariants } from "@/components/ui/button-variants"
import { ReEnergieArticleForm } from "@/features/marketing/re-energie/components/re-energie-article-form"
import {
  getReEnergieArticleById,
  getReEnergieCategories,
} from "@/features/marketing/re-energie/queries/get-re-energie"
import { requireMarketingStaff } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const article = await getReEnergieArticleById(id)
  return {
    title: article
      ? `${article.title} — Rénovation énergétique`
      : "Fiche introuvable",
  }
}

export default async function EditReEnergieArticlePage({ params }: Props) {
  await requireMarketingStaff()
  const { id } = await params
  const [article, categories] = await Promise.all([
    getReEnergieArticleById(id),
    getReEnergieCategories(),
  ])
  if (!article) notFound()
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune catégorie en base — migration requise.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/marketing/re-energie"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 inline-flex text-muted-foreground"
          )}
        >
          <ArrowLeft className="size-3.5" data-icon="inline-start" />
          Fiches
        </Link>
      </div>
      <ReEnergieArticleForm article={article} categories={categories} />
    </div>
  )
}
