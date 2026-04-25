"use client";

import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

type SidebarSectionLabelProps = {
  label: string;
  className?: string;
};

export function SidebarSectionLabel({ label, className }: SidebarSectionLabelProps) {
  const { collapsed } = useSidebar();

  if (collapsed) {
    return (
      <div
        role="separator"
        aria-label={label}
        className={cn("mx-2 my-2 h-px bg-sidebar-border/70", className)}
      />
    );
  }

  return (
    <p
      className={cn(
        "px-3 pt-4 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70 first:pt-1",
        className,
      )}
    >
      {label}
    </p>
  );
}
