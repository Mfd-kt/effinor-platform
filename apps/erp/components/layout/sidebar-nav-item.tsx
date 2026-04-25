"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/layout/sidebar-context";
import { isNavItemActive, type NavBadgeMap, type NavBadgeTone, type NavItem } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

type SidebarNavItemProps = {
  item: NavItem;
  badges?: NavBadgeMap;
};

const TONE_CLASSES: Record<NavBadgeTone, string> = {
  urgent: "bg-destructive text-destructive-foreground",
  warning: "bg-amber-500 text-white",
  info: "bg-blue-500 text-white",
  neutral: "bg-muted text-muted-foreground",
};

export function SidebarNavItem({ item, badges }: SidebarNavItemProps) {
  const pathname = usePathname() ?? "/";
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const Icon = item.icon;
  const active = isNavItemActive(item.href, item.matchPrefixes, pathname);
  const badge = item.badgeKey ? badges?.[item.badgeKey] : undefined;
  const showBadge = badge && badge.count > 0;

  const link = (
    <Link
      href={item.href}
      onClick={mobileOpen ? () => setMobileOpen(false) : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/sidebar-item relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium leading-none transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          "size-[18px] shrink-0",
          active ? "text-primary" : "text-sidebar-foreground/70 group-hover/sidebar-item:text-sidebar-foreground",
        )}
      />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {showBadge ? (
            <span
              className={cn(
                "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                TONE_CLASSES[badge.tone],
              )}
            >
              {badge.count > 99 ? "99+" : badge.count}
            </span>
          ) : null}
        </>
      ) : null}
      {collapsed && showBadge ? (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 inline-flex size-2.5 items-center justify-center rounded-full ring-2 ring-sidebar",
            TONE_CLASSES[badge.tone],
          )}
          aria-hidden
        />
      ) : null}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        <span>{item.label}</span>
        {showBadge ? (
          <span className={cn("inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold", TONE_CLASSES[badge.tone])}>
            {badge.count > 99 ? "99+" : badge.count}
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
