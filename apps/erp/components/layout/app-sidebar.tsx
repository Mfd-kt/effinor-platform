import { EffinorLogo } from "@/components/brand/effinor-logo";
import { NavLinks } from "@/components/layout/nav-links";

type AppSidebarProps = {
  allowedNavHrefs?: string[];
};

export function AppSidebar({ allowedNavHrefs }: AppSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-[100dvh] max-h-[100dvh] w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
        <EffinorLogo href="/" subtitle="ERP" markSize={30} className="min-w-0" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-3 [-webkit-overflow-scrolling:touch]">
        <NavLinks allowedNavHrefs={allowedNavHrefs} />
      </div>
      <div className="shrink-0 border-t border-sidebar-border bg-sidebar px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/90">
          Effinor ERP
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/80 leading-relaxed">CEE · dossiers · pilotage</p>
      </div>
    </aside>
  );
}
