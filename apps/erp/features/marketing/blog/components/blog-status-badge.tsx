import { cn } from "@/lib/utils"

import type { BlogStatus } from "../schemas/blog-article.schema"

const CONFIG: Record<BlogStatus, { label: string; className: string }> = {
  draft: {
    label: "Brouillon",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  published: {
    label: "Publié",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  archived: {
    label: "Archivé",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
}

export function BlogStatusBadge({ status }: { status: BlogStatus }) {
  const config = CONFIG[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}
