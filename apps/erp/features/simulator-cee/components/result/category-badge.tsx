"use client";

import type { TrancheRevenu } from "@/features/simulator-cee/domain/types";
import { CATEGORIES } from "@/features/simulator-cee/domain/plafonds";
import { Badge } from "@/components/ui/badge";

export function CategoryBadge({ tranche }: { tranche: TrancheRevenu }) {
  return (
    <Badge variant="secondary" className="rounded-full bg-violet-100 text-violet-900 hover:bg-violet-100">
      {CATEGORIES[tranche]}
    </Badge>
  );
}
