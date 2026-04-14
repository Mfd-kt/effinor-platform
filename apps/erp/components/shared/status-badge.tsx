import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "neutral" | "success" | "warning" | "danger" | "info";

const variantStyles: Record<StatusVariant, string> = {
  neutral: "bg-muted text-muted-foreground border-transparent",
  success:
    "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-100 dark:border-emerald-800",
  warning:
    "bg-amber-50 text-amber-950 border-amber-200 dark:bg-amber-950/30 dark:text-amber-100 dark:border-amber-800",
  danger:
    "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/30 dark:text-red-100 dark:border-red-800",
  info: "bg-sky-50 text-sky-950 border-sky-200 dark:bg-sky-950/30 dark:text-sky-100 dark:border-sky-800",
};

type StatusBadgeProps = {
  children: ReactNode;
  variant?: StatusVariant;
  className?: string;
};

export function StatusBadge({ children, variant = "neutral", className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </Badge>
  );
}
