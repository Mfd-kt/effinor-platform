import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { buttonVariants } from "@/components/ui/button-variants"
import { TestimonialForm } from "@/features/marketing/testimonials/components/testimonial-form"
import { requireMarketingStaff } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"

export const metadata = { title: "Nouveau témoignage" }

export default async function NewTestimonialPage() {
  await requireMarketingStaff()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/marketing/testimonials"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 inline-flex text-muted-foreground",
          )}
        >
          <ArrowLeft className="size-3.5" data-icon="inline-start" />
          Témoignages
        </Link>
      </div>

      <TestimonialForm />
    </div>
  )
}
