import { cn } from "@/lib/utils"

import type { TestimonialStatus } from "../schemas/testimonial.schema"

const LABEL: Record<TestimonialStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
}

const TONE: Record<TestimonialStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-primary/10 text-primary",
  archived: "bg-amber-500/10 text-amber-800 dark:text-amber-200",
}

export function TestimonialStatusBadge({ status }: { status: TestimonialStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        TONE[status]
      )}
    >
      {LABEL[status]}
    </span>
  )
}
