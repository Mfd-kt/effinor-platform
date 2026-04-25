"use client";

import Link from "next/link";
import { ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { useEffect } from "react";

import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  navItemVisible,
  NAV_SECTIONS,
  type NavBadgeMap,
} from "@/components/layout/nav-config";
import { SidebarNavItem } from "@/components/layout/sidebar-nav-item";
import { SidebarSectionLabel } from "@/components/layout/sidebar-section-label";
import { SidebarUserProfile, type SidebarUserProfileProps } from "@/components/layout/sidebar-user-profile";
import { SidebarForceExpanded, useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

export type AppSidebarProps = {
  roleCodes: readonly string[];
  allowedNavHrefs?: readonly string[];
  badges?: NavBadgeMap;
  user: SidebarUserProfileProps;
};

function EffinorMark({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex h-9 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed && "justify-center",
      )}
      aria-label="Effinor — accueil"
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 text-sm font-bold text-white shadow-sm ring-1 ring-emerald-700/20"
        aria-hidden
      >
        E
      </span>
      {!collapsed ? (
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-heading text-sm font-bold tracking-tight text-foreground">EFFINOR</span>
          <span className="block truncate text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">ERP</span>
        </span>
      ) : null}
    </Link>
  );
}

function SidebarSearchTrigger() {
  const { collapsed, openCommandPalette } = useSidebar();

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="Rechercher (⌘K)"
            className="flex h-9 w-full items-center justify-center rounded-md border border-sidebar-border/70 bg-background/60 text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
          >
            <Search className="size-4" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Rechercher · ⌘K</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Ouvrir la recherche globale"
      className="flex h-9 w-full items-center gap-2 rounded-md border border-sidebar-border/70 bg-background/60 px-2.5 text-left text-[13px] text-muted-foreground transition-colors hover:border-sidebar-border hover:bg-sidebar-accent/40 hover:text-foreground"
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">Rechercher…</span>
      <kbd className="ml-auto flex h-5 items-center gap-0.5 rounded border border-border/80 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-[11px] leading-none">⌘</span>K
      </kbd>
    </button>
  );
}

function SidebarBody({ roleCodes, allowedNavHrefs, badges, user }: AppSidebarProps) {
  const { collapsed, toggleCollapsed } = useSidebar();

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((it) => navItemVisible(it, roleCodes, allowedNavHrefs)),
  })).filter((s) => s.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/70 px-3",
          collapsed && "justify-center px-2",
        )}
      >
        <div className="min-w-0 flex-1">
          <EffinorMark collapsed={collapsed} />
        </div>
        {!collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Replier la barre latérale"
                className="hidden size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground md:flex"
              >
                <ChevronsLeft className="size-4" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Replier · ⌘B</TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <div className={cn("shrink-0 px-2 py-2", collapsed && "px-2")}>
        <SidebarSearchTrigger />
      </div>

      <nav
        aria-label="Navigation principale"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2"
      >
        {visibleSections.map((section) => (
          <div key={section.id} className="flex flex-col gap-0.5">
            <SidebarSectionLabel label={section.label} />
            {section.items.map((item) => (
              <SidebarNavItem key={item.href} item={item} badges={badges} />
            ))}
          </div>
        ))}
      </nav>

      <div className={cn("shrink-0 border-t border-sidebar-border/70 px-2 py-2", collapsed && "px-2")}>
        <SidebarUserProfile {...user} />
        {collapsed ? (
          <div className="mt-1 flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Déplier la barre latérale"
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
                >
                  <ChevronsRight className="size-4" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Déplier · ⌘B</TooltipContent>
            </Tooltip>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AppSidebar(props: AppSidebarProps) {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  /** Désactive le scroll body quand le drawer mobile est ouvert (cohérence sheet). */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        aria-label="Barre latérale"
        className={cn(
          "sticky top-0 z-40 hidden h-[100dvh] shrink-0 border-r border-sidebar-border/70 bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out md:block",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <SidebarBody {...props} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="flex h-[100dvh] w-[min(18rem,calc(100vw-2.5rem))] flex-col gap-0 overflow-hidden border-r border-sidebar-border/70 bg-sidebar p-0 text-sidebar-foreground md:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu Effinor ERP</SheetTitle>
          </SheetHeader>
          <SidebarForceExpanded>
            <SidebarBody {...props} />
          </SidebarForceExpanded>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
