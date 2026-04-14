import { EffinorLogo } from "@/components/brand/effinor-logo";
import { NavLinks } from "@/components/layout/nav-links";

type AppSidebarProps = {
  allowedNavHrefs?: string[];
};

export function AppSidebar({ allowedNavHrefs }: AppSidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <EffinorLogo href="/" subtitle="ERP" markSize={30} className="min-w-0" />
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <NavLinks allowedNavHrefs={allowedNavHrefs} />
      </div>
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          CEE · dossiers · pilotage
        </p>
      </div>
    </aside>
  );
}
