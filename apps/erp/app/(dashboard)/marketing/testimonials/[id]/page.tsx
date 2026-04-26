import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { buttonVariants } from "@/components/ui/button-variants"
import { TestimonialForm } from "@/features/marketing/testimonials/components/testimonial-form"
import { getTestimonialById } from "@/features/marketing/testimonials/queries/get-testimonials"
import { requireMarketingStaff } from "@/lib/auth/guards"
import { cn } from "@/lib/utils"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const t = await getTestimonialById(id)
  return { title: t ? `Témoignage — ${t.author_name}` : "Témoignage" }
}

export default async function EditTestimonialPage({ params }: Props) {
  await requireMarketingStaff()
  const { id } = await params
  const testimonial = await getTestimonialById(id)
  if (!testimonial) notFound()

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

      <TestimonialForm testimonial={testimonial} />
    </div>
  )
}
