"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, LogOut, UserRound } from "lucide-react";

import { EffinorLogo } from "@/components/brand/effinor-logo";
import { NavLinks } from "@/components/layout/nav-links";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AiOpsAgentHeaderButton } from "@/components/layout/ai-ops-agent-header-button";
import { AppNotificationsBell } from "@/components/layout/app-notifications-bell";
import { ImpersonationPicker } from "@/components/layout/impersonation-picker";
import { signOut } from "@/server/actions/auth";
import { profileInitials } from "@/lib/user-display";
import { Badge } from "@/components/ui/badge";

type AppHeaderProps = {
  userId: string;
  userEmail: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  allowedNavHrefs?: string[];
  /** JWT réel : super_admin peut ouvrir le sélecteur d’impersonation. */
  actorIsSuperAdmin: boolean;
  /** Impersonation active (masque le sélecteur « se connecter en tant que »). */
  isImpersonating: boolean;
  impersonationRoleOptions: { code: string; label: string }[];
};

export function AppHeader({
  userId,
  userEmail,
  displayName,
  avatarUrl,
  allowedNavHrefs,
  actorIsSuperAdmin,
  isImpersonating,
  impersonationRoleOptions,
}: AppHeaderProps) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const initials = profileInitials(displayName, userEmail);

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

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-muted-foreground lg:hidden">Navigation</p>
      </div>

      <AiOpsAgentHeaderButton userId={userId} />
      <AppNotificationsBell userId={userId} />

      {actorIsSuperAdmin && !isImpersonating ? (
        <ImpersonationPicker roleOptions={impersonationRoleOptions} />
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost", size: "default" }),
            "relative h-9 gap-2 rounded-full px-2",
          )}
          aria-label="Compte utilisateur"
        >
          <Avatar className="size-8">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-muted text-xs font-medium">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[200px] truncate text-sm font-medium md:inline">
            {userEmail}
          </span>
          {isImpersonating ? (
            <Badge variant="secondary" className="hidden shrink-0 text-[10px] md:inline-flex">
              Impersonation
            </Badge>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <UserRound className="size-4" />
                  Compte
                </span>
                <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/account")}>
              Mon compte
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
