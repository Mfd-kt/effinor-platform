"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronsUpDown, LogOut, UserCog, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImpersonationPicker } from "@/components/layout/impersonation-picker";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSidebar } from "@/components/layout/sidebar-context";
import { profileInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import { signOut } from "@/server/actions/auth";

export type SidebarUserProfileProps = {
  userEmail: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  roleLabel?: string | null;
  isImpersonating?: boolean;
  /** Si vrai et `impersonationRoleOptions` fourni, expose l'item « Se connecter en tant que… ». */
  canImpersonate?: boolean;
  impersonationRoleOptions?: { code: string; label: string }[];
};

export function SidebarUserProfile({
  userEmail,
  displayName,
  avatarUrl,
  roleLabel,
  isImpersonating = false,
  canImpersonate = false,
  impersonationRoleOptions,
}: SidebarUserProfileProps) {
  const router = useRouter();
  const { collapsed } = useSidebar();
  const [impersonationOpen, setImpersonationOpen] = useState(false);
  const initials = profileInitials(displayName, userEmail);
  const primaryName = displayName?.trim() || userEmail;
  const showImpersonation = canImpersonate && !isImpersonating && !!impersonationRoleOptions;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Compte utilisateur"
          className={cn(
            "group flex w-full items-center gap-2.5 rounded-md border border-transparent p-1.5 text-left outline-none transition-colors",
            "hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-ring/60",
            collapsed && "justify-center p-1",
          )}
        >
          <span className="relative shrink-0">
            <Avatar className="size-8">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="bg-muted text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
            {isImpersonating ? (
              <span
                className="absolute -right-0.5 -bottom-0.5 flex size-3 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white ring-2 ring-sidebar"
                aria-label="Mode impersonation"
              >
                i
              </span>
            ) : null}
          </span>
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-medium text-sidebar-foreground">{primaryName}</span>
                {roleLabel ? (
                  <span className="block truncate text-[11px] text-muted-foreground">{roleLabel}</span>
                ) : (
                  <span className="block truncate text-[11px] text-muted-foreground">{userEmail}</span>
                )}
              </span>
              <ChevronsUpDown className="size-4 text-muted-foreground/70 group-hover:text-foreground" aria-hidden />
            </>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <UserRound className="size-4" /> {primaryName}
                </span>
                <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          {isImpersonating ? (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <Badge variant="secondary" className="text-[10px]">Impersonation active</Badge>
              </div>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/account")}>
              <UserRound className="size-4" /> Mon compte
            </DropdownMenuItem>
            <div className="px-1">
              <ThemeToggle variant="labeled" />
            </div>
          </DropdownMenuGroup>
          {showImpersonation ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setImpersonationOpen(true)}
                >
                  <UserCog className="size-4" /> Se connecter en tant que…
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" /> Déconnexion
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {showImpersonation ? (
        <ImpersonationPicker
          roleOptions={impersonationRoleOptions ?? []}
          open={impersonationOpen}
          onOpenChange={setImpersonationOpen}
          hideTrigger
        />
      ) : null}
    </>
  );
}
