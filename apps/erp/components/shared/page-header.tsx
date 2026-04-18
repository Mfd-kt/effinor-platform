import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Classes appliquées au &lt;h1&gt; (ex. pages « hero »). */
  titleClassName?: string;
};

export function PageHeader({ title, description, actions, className, titleClassName }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className={cn("text-2xl font-semibold tracking-tight text-foreground", titleClassName)}>{title}</h1>
        {description ? (
          <div className="max-w-3xl text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
