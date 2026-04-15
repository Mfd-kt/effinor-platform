"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button-variants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/server/actions/auth";
import { profileInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";

type AppProfileDockProps = {
  userEmail: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  isImpersonating: boolean;
};

/** Menu compte fixé en bas à gauche (hors du header). */
export function AppProfileDock({
  userEmail,
  displayName,
  avatarUrl,
  isImpersonating,
}: AppProfileDockProps) {
  const router = useRouter();
  const initials = profileInitials(displayName, userEmail);

  return (
    <div
      className={cn(
        "fixed z-[45] flex flex-col items-start gap-2",
        "bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] lg:left-[calc(16rem+1rem)]",
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "relative size-auto rounded-full border border-border/80 bg-background/95 p-0.5 shadow-lg backdrop-blur-md ring-1 ring-black/[0.06] transition-[box-shadow,transform] hover:bg-background hover:shadow-xl active:scale-[0.97] dark:ring-white/[0.08]",
          )}
          aria-label="Compte utilisateur"
          title={userEmail}
        >
          <Avatar className="size-11">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-muted text-sm font-medium">{initials}</AvatarFallback>
          </Avatar>
          {isImpersonating ? (
            <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-background">
              i
            </span>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
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
          {isImpersonating ? (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <Badge variant="secondary" className="text-[10px]">
                  Impersonation
                </Badge>
              </div>
            </>
          ) : null}
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
    </div>
  );
}
