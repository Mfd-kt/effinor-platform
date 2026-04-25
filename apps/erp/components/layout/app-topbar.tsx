"use client";

import { Menu, Search } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSidebar } from "@/components/layout/sidebar-context";
import { AppNotificationsBell } from "@/components/layout/app-notifications-bell";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export type AppTopbarProps = {
  userId: string;
  /** Disponible pour brancher des hooks futurs sur le poste closer (cloche). */
  includeCloserLeadReminders?: boolean;
};

/**
 * Topbar épurée façon Linear/Attio : breadcrumbs à gauche, actions globales à droite.
 * L'identité utilisateur (avatar, impersonation, déconnexion) est gérée
 * exclusivement par le profil bas de la sidebar pour éviter le doublon.
 */
export function AppTopbar({ userId }: AppTopbarProps) {
  const { toggleMobile, openCommandPalette } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      <button
        type="button"
        onClick={toggleMobile}
        aria-label="Ouvrir le menu"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0 md:hidden")}
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Rechercher (⌘K)"
          title="Rechercher · ⌘K"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0")}
        >
          <Search className="size-5" aria-hidden />
        </button>
        <ThemeToggle />
        <AppNotificationsBell userId={userId} />
      </div>
    </header>
  );
}
