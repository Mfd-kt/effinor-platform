import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export type OperationChildModuleCardProps = {
  title: string;
  description: string;
  count: number | null;
  href: string;
  hrefLabel: string;
};

export function OperationChildModuleCard({
  title,
  description,
  count,
  href,
  hrefLabel,
}: OperationChildModuleCardProps) {
  const countSuffix =
    count === null
      ? null
      : count === 1
        ? "élément lié au dossier"
        : "éléments liés au dossier";

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        {count !== null ? (
          <p className="pt-1 text-sm">
            <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
              {count}
            </span>
            <span className="text-muted-foreground"> {countSuffix}</span>
          </p>
        ) : (
          <p className="text-muted-foreground text-sm pt-1">—</p>
        )}
      </div>
      <div className="mt-4 pt-2">
        <Link href={href} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
          {hrefLabel}
        </Link>
      </div>
    </div>
  );
}
