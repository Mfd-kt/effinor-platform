"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  sidebarNavigation,
  type NavGroupChild,
  type NavGroupSectionItem,
  type SidebarNavEntry,
} from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

const ACCORDION_LS_KEY = "erp-sidebar-accordion-v1";

type AccordionState = {
  collapsedGroups: string[];
  collapsedSections: string[];
};

function loadAccordionState(): AccordionState {
  if (typeof window === "undefined") {
    return { collapsedGroups: [], collapsedSections: [] };
  }
  try {
    const raw = localStorage.getItem(ACCORDION_LS_KEY);
    if (!raw) return { collapsedGroups: [], collapsedSections: [] };
    const p = JSON.parse(raw) as Partial<AccordionState>;
    return {
      collapsedGroups: Array.isArray(p.collapsedGroups) ? p.collapsedGroups : [],
      collapsedSections: Array.isArray(p.collapsedSections) ? p.collapsedSections : [],
    };
  } catch {
    return { collapsedGroups: [], collapsedSections: [] };
  }
}

function persistAccordionState(state: AccordionState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACCORDION_LS_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

function linkActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNavSection(item: NavGroupChild): item is NavGroupSectionItem {
  return "kind" in item && item.kind === "section";
}

function filterGroupChildren(items: NavGroupChild[], allowedNavHrefs: string[]): NavGroupChild[] {
  return items
    .map((item): NavGroupChild | null => {
      if (isNavSection(item)) {
        const sub = item.items.filter((s) => allowedNavHrefs.includes(s.href));
        if (sub.length === 0) return null;
        return { ...item, items: sub };
      }
      return allowedNavHrefs.includes(item.href) ? item : null;
    })
    .filter((x): x is NavGroupChild => x !== null);
}

function groupHasActiveChild(items: NavGroupChild[], pathname: string): boolean {
  for (const item of items) {
    if (isNavSection(item)) {
      if (item.items.some((s) => linkActive(s.href, pathname))) return true;
    } else if (linkActive(item.href, pathname)) {
      return true;
    }
  }
  return false;
}

function sectionHasActiveChild(section: NavGroupSectionItem, pathname: string): boolean {
  return section.items.some((s) => linkActive(s.href, pathname));
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
      const items = filterGroupChildren(entry.items, allowedNavHrefs);
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
  const entries = useMemo(() => filterNavigation(allowedNavHrefs), [allowedNavHrefs]);

  /** Même état au 1er rendu SSR et client — évite l’hydratation (localStorage lu après mount). */
  const [accordion, setAccordion] = useState<AccordionState>({
    collapsedGroups: [],
    collapsedSections: [],
  });

  const setCollapsedGroups = useCallback((updater: (prev: string[]) => string[]) => {
    setAccordion((a) => {
      const next = { ...a, collapsedGroups: updater(a.collapsedGroups) };
      persistAccordionState(next);
      return next;
    });
  }, []);

  const setCollapsedSections = useCallback((updater: (prev: string[]) => string[]) => {
    setAccordion((a) => {
      const next = { ...a, collapsedSections: updater(a.collapsedSections) };
      persistAccordionState(next);
      return next;
    });
  }, []);

  /**
   * Après mount : lit localStorage puis ouvre groupe / section contenant la route active.
   * Un seul effet évite une course entre « chargement LS » et « expansion pathname ».
   */
  useEffect(() => {
    const base = loadAccordionState();
    let g = [...base.collapsedGroups];
    let s = [...base.collapsedSections];
    let changed = false;

    for (const entry of entries) {
      if (entry.kind !== "group") continue;
      if (groupHasActiveChild(entry.items, pathname) && g.includes(entry.id)) {
        g = g.filter((id) => id !== entry.id);
        changed = true;
      }
      for (const item of entry.items) {
        if (!isNavSection(item)) continue;
        if (sectionHasActiveChild(item, pathname)) {
          if (g.includes(entry.id)) {
            g = g.filter((id) => id !== entry.id);
            changed = true;
          }
          if (s.includes(item.id)) {
            s = s.filter((id) => id !== item.id);
            changed = true;
          }
        }
      }
    }

    const next = { collapsedGroups: g, collapsedSections: s };
    queueMicrotask(() => {
      setAccordion(next);
      if (changed) persistAccordionState(next);
    });
  }, [pathname, entries]);

  function toggleGroup(id: string) {
    setCollapsedGroups((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSection(id: string) {
    setCollapsedSections((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const { collapsedGroups, collapsedSections } = accordion;

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
        const groupActive = groupHasActiveChild(entry.items, pathname);
        const groupOpen = !collapsedGroups.includes(entry.id);

        return (
          <div
            key={entry.id}
            className={cn("flex flex-col gap-0.5", showDivider && "mt-3 border-t border-sidebar-border/60 pt-3")}
          >
            <button
              type="button"
              onClick={() => toggleGroup(entry.id)}
              aria-expanded={groupOpen}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold tracking-tight transition-colors",
                groupActive
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40",
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <GroupIcon className="size-4 shrink-0 opacity-80" aria-hidden />
                <span className="truncate">{entry.label}</span>
              </span>
              <ChevronRight
                className={cn(
                  "size-4 shrink-0 opacity-70 transition-transform duration-200",
                  groupOpen && "rotate-90",
                )}
                aria-hidden
              />
            </button>

            {groupOpen ? (
              <ul className="flex flex-col gap-1 border-l-2 border-sidebar-border/70 pl-2.5 ml-1.5">
                {entry.items.map((item) => {
                  if (isNavSection(item)) {
                    const sectionActive = sectionHasActiveChild(item, pathname);
                    const sectionOpen = !collapsedSections.includes(item.id);
                    return (
                      <li key={item.id} className="list-none">
                        <button
                          type="button"
                          onClick={() => toggleSection(item.id)}
                          aria-expanded={sectionOpen}
                          className={cn(
                            "flex w-full items-center justify-between gap-1 rounded-md px-2 py-1.5 text-left text-xs font-semibold transition-colors",
                            sectionActive
                              ? "text-sidebar-accent-foreground/95"
                              : "text-sidebar-foreground/55 hover:text-sidebar-foreground/80",
                          )}
                        >
                          <span className="min-w-0 truncate pr-1">{item.label}</span>
                          <ChevronRight
                            className={cn(
                              "size-3.5 shrink-0 opacity-60 transition-transform duration-200",
                              sectionOpen && "rotate-90",
                            )}
                            aria-hidden
                          />
                        </button>
                        {sectionOpen ? (
                          <ul className="mt-0.5 flex flex-col gap-0.5 pb-1">
                            {item.items.map((sub) => {
                              const SubIcon = sub.icon;
                              const active = linkActive(sub.href, pathname);
                              return (
                                <li key={sub.href}>
                                  <Link
                                    href={sub.href}
                                    onClick={onNavigate}
                                    className={cn(
                                      linkRowClass,
                                      "py-2 pl-1.5 text-[13px]",
                                      active
                                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm"
                                        : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                                    )}
                                  >
                                    <SubIcon className="size-[17px] shrink-0 opacity-80" aria-hidden />
                                    {sub.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </li>
                    );
                  }
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
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
