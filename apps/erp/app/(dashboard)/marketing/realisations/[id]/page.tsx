import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { buttonVariants } from "@/components/ui/button-variants"
import { RealisationForm } from "@/features/marketing/realisations/components/realisation-form"
import { getRealisationById } from "@/features/marketing/realisations/queries/get-realisations"
import { requireMarketingStaff } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const realisation = await getRealisationById(id)
  return {
    title: realisation
      ? `${realisation.title} — Réalisations`
      : "Réalisation introuvable",
  }
}

export default async function EditRealisationPage({ params }: Props) {
  await requireMarketingStaff()

  const { id } = await params
  const realisation = await getRealisationById(id)
  if (!realisation) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/marketing/realisations"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 inline-flex text-muted-foreground",
          )}
        >
          <ArrowLeft className="size-3.5" data-icon="inline-start" />
          Réalisations
        </Link>
      </div>

      <RealisationForm realisation={realisation} />
    </div>
  )
}
