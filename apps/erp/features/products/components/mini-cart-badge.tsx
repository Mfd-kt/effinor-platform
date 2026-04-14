"use client";

import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  totalItems: number;
  className?: string;
};

export function MiniCartBadge({ totalItems, className }: Props) {
  if (totalItems <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
        className,
      )}
    >
      <ShoppingCart className="size-3" />
      {totalItems}
    </span>
  );
}
