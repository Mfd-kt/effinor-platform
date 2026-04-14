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
      const items = entry.items.filter((item: { href: string }) =>
        allowedNavHrefs.includes(item.href),
      );
      if (items.length === 0) {
        return null;
      }
      return { ...entry, items };
    })
    .filter((e): e is SidebarNavEntry => e !== null);
}

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
    <nav className={cn("flex flex-col gap-0.5", className)}>
      {entries.map((entry) => {
        if (entry.kind === "link") {
          const Icon = entry.icon;
          const active = linkActive(entry.href, pathname);
          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
              {entry.label}
            </Link>
          );
        }

        const GroupIcon = entry.icon;
        const groupActive = entry.items.some((item: { href: string }) =>
          linkActive(item.href, pathname),
        );

        return (
          <div key={entry.id} className="flex flex-col gap-0.5">
            <div
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                groupActive
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70",
              )}
            >
              <GroupIcon className="size-4 shrink-0 opacity-80" aria-hidden />
              <span>{entry.label}</span>
            </div>
            <ul className="ml-2 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
              {entry.items.map((item: { href: string; label: string }) => {
                const active = linkActive(item.href, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex rounded-md px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
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
