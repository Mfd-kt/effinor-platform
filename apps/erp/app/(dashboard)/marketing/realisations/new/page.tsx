import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { buttonVariants } from "@/components/ui/button-variants"
import { RealisationForm } from "@/features/marketing/realisations/components/realisation-form"
import { requireMarketingStaff } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"

export const metadata = { title: "Nouvelle réalisation" }

export default async function NewRealisationPage() {
  await requireMarketingStaff()

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

      <RealisationForm />
    </div>
  )
}
