"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { EffinorLogo } from "@/components/brand/effinor-logo";
import { NavLinks } from "@/components/layout/nav-links";
import { buttonVariants } from "@/components/ui/button-variants";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AppNotificationsBell } from "@/components/layout/app-notifications-bell";
import { ImpersonationPicker } from "@/components/layout/impersonation-picker";

type AppHeaderProps = {
  userId: string;
  allowedNavHrefs?: string[];
  /** JWT réel : super_admin peut ouvrir le sélecteur d’impersonation. */
  actorIsSuperAdmin: boolean;
  /** Impersonation active (masque le sélecteur « se connecter en tant que »). */
  isImpersonating: boolean;
  impersonationRoleOptions: { code: string; label: string }[];
};

export function AppHeader({
  userId,
  allowedNavHrefs,
  actorIsSuperAdmin,
  isImpersonating,
  impersonationRoleOptions,
}: AppHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:gap-4 lg:px-8">
      <EffinorLogo
        href="/"
        showWordmark={false}
        markSize={34}
        className="shrink-0 lg:hidden"
      />
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "lg:hidden",
          )}
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle className="sr-only">Menu Effinor ERP</SheetTitle>
            <EffinorLogo
              href="/"
              subtitle="ERP"
              markSize={30}
              linkOnClick={() => setMobileNavOpen(false)}
            />
          </SheetHeader>
          <div className="p-3">
            <NavLinks
              allowedNavHrefs={allowedNavHrefs}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1 lg:hidden" aria-hidden />

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {actorIsSuperAdmin && !isImpersonating ? (
          <ImpersonationPicker roleOptions={impersonationRoleOptions} />
        ) : null}
        <AppNotificationsBell userId={userId} />
      </div>
    </header>
  );
}
