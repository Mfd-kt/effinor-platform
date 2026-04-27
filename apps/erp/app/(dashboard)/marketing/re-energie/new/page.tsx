import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { buttonVariants } from "@/components/ui/button-variants"
import { ReEnergieArticleForm } from "@/features/marketing/re-energie/components/re-energie-article-form"
import { getReEnergieCategories } from "@/features/marketing/re-energie/queries/get-re-energie"
import { requireMarketingStaff } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"

export const metadata = { title: "Nouvelle fiche — Rénovation énergétique" }

export default async function NewReEnergieArticlePage() {
  await requireMarketingStaff()
  const categories = await getReEnergieCategories()
  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Aucune catégorie (pilier) en base. Exécutez la migration
          20260426220000_re_energie_categories_articles.sql
          puis revenez ici.
        </p>
        <Link href="/marketing/re-energie" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft className="size-3.5" data-icon="inline-start" />
          Retour
        </Link>
      </div>
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
      <ReEnergieArticleForm categories={categories} />
    </div>
  )
}
