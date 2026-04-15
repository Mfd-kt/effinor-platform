"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { sidebarNavigation, type SidebarNavEntry } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

function linkActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function filterNavigation(allowedNavHrefs: string[] | undefined): SidebarNavEntry[] {
  if (!allowedNavHrefs || allowedNavHrefs.length === 0) {
    return sidebarNavigation;
  }
  return sidebarNavigation
    .map((entry) => {
      if (entry.kind === "link") {
        return allowedNavHrefs.includes(entry.href) ? entry : null;
      }
      const items = entry.items.filter((item) => allowedNavHrefs.includes(item.href));
      if (items.length === 0) {
        return null;
      }
      return { ...entry, items };
    })
    .filter((e): e is SidebarNavEntry => e !== null);
}

const linkRowClass =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation";

type NavLinksProps = {
  onNavigate?: () => void;
  className?: string;
  /** Si défini, seuls ces href sont affichés (RBAC). */
  allowedNavHrefs?: string[];
};

export function NavLinks({ onNavigate, className, allowedNavHrefs }: NavLinksProps) {
  const pathname = usePathname();
  const entries = filterNavigation(allowedNavHrefs);

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {entries.map((entry, index) => {
        const showDivider = index > 0;

        if (entry.kind === "link") {
          const Icon = entry.icon;
          const active = linkActive(entry.href, pathname);
          return (
            <div key={entry.href} className={cn(showDivider && "mt-3 border-t border-sidebar-border/60 pt-3")}>
              <Link
                href={entry.href}
                onClick={onNavigate}
                className={cn(
                  linkRowClass,
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-[18px] shrink-0 opacity-90" aria-hidden />
                {entry.label}
              </Link>
            </div>
          );
        }

        const GroupIcon = entry.icon;
        const groupActive = entry.items.some((item) => linkActive(item.href, pathname));

        return (
          <div
            key={entry.id}
            className={cn("flex flex-col gap-1", showDivider && "mt-3 border-t border-sidebar-border/60 pt-3")}
          >
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold tracking-tight",
                groupActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/65",
              )}
            >
              <GroupIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
              <span>{entry.label}</span>
            </div>
            <ul className="flex flex-col gap-0.5 border-l-2 border-sidebar-border/70 pl-2.5 ml-1.5">
              {entry.items.map((item) => {
                const ItemIcon = item.icon;
                const active = linkActive(item.href, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        linkRowClass,
                        "py-2 pl-1.5",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <ItemIcon className="size-[18px] shrink-0 opacity-80" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
