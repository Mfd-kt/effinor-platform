import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppShellProps = {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  /** Bannière globale au-dessus du header (ex. impersonation). */
  topBanner?: ReactNode;
  className?: string;
};

export function AppShell({ sidebar, header, topBanner, children, className }: AppShellProps) {
  return (
    <div className={cn("flex min-h-screen w-full bg-muted/30", className)}>
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {topBanner}
        {header}
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
