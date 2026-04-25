import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { buttonVariants } from "@/components/ui/button-variants"
import { BlogArticleForm } from "@/features/marketing/blog/components/blog-article-form"
import { getBlogArticleById } from "@/features/marketing/blog/queries/get-blog-articles"
import { requireMarketingStaff } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const article = await getBlogArticleById(id)
  return {
    title: article ? `${article.title} — Blog` : "Article introuvable",
  }
}

export default async function EditBlogArticlePage({ params }: Props) {
  await requireMarketingStaff()

  const { id } = await params
  const article = await getBlogArticleById(id)
  if (!article) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/marketing/blog"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 inline-flex text-muted-foreground",
          )}
        >
          <ArrowLeft className="size-3.5" data-icon="inline-start" />
          Articles de blog
        </Link>
      </div>

      <BlogArticleForm article={article} />
    </div>
  )
}
