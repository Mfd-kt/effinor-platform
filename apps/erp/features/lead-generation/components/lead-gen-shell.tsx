"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Inbox, Package, Settings, Target, type LucideIcon } from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type LeadGenTabKey = "stock" | "imports" | "my-queue" | "management" | "settings";

export type LeadGenTabsAccess = Readonly<{
  stock: boolean;
  imports: boolean;
  myQueue: boolean;
  management: boolean;
  settings: boolean;
}>;

type TabDefinition = {
  key: LeadGenTabKey;
  label: string;
  href: string;
  icon: LucideIcon;
  matchPrefixes: readonly string[];
};

const TAB_DEFINITIONS: readonly TabDefinition[] = [
  {
    key: "stock",
    label: "Stock",
    href: "/lead-generation",
    icon: Package,
    matchPrefixes: ["/lead-generation/stock"],
  },
  {
    key: "imports",
    label: "Imports",
    href: "/lead-generation/imports",
    icon: Inbox,
    matchPrefixes: ["/lead-generation/imports", "/lead-generation/quantification"],
  },
  {
    key: "my-queue",
    label: "Ma file",
    href: "/lead-generation/my-queue",
    icon: Target,
    matchPrefixes: ["/lead-generation/my-queue"],
  },
  {
    key: "management",
    label: "Pilotage",
    href: "/lead-generation/management",
    icon: BarChart3,
    matchPrefixes: [
      "/lead-generation/management",
      "/lead-generation/cockpit",
      "/lead-generation/analytics",
    ],
  },
  {
    key: "settings",
    label: "Réglages",
    href: "/lead-generation/settings",
    icon: Settings,
    matchPrefixes: [
      "/lead-generation/settings",
      "/lead-generation/automation",
      "/lead-generation/learning",
    ],
  },
];

function pickAccess(access: LeadGenTabsAccess, key: LeadGenTabKey): boolean {
  switch (key) {
    case "stock":
      return access.stock;
    case "imports":
      return access.imports;
    case "my-queue":
      return access.myQueue;
    case "management":
      return access.management;
    case "settings":
      return access.settings;
  }
}

/**
 * Détermine l'onglet actif à partir du pathname courant.
 * Priorité aux préfixes les plus spécifiques (longueur décroissante) pour éviter
 * que `/lead-generation` matche par défaut une route plus profonde.
 */
function resolveActiveTab(pathname: string): LeadGenTabKey {
  const cleanPath = pathname.replace(/\/$/, "") || "/";

  const prefixedTabs = TAB_DEFINITIONS.flatMap((tab) =>
    [tab.href, ...tab.matchPrefixes].map((prefix) => ({ tab, prefix })),
  )
    .filter(({ prefix }) => prefix !== "/lead-generation")
    .sort((a, b) => b.prefix.length - a.prefix.length);

  for (const { tab, prefix } of prefixedTabs) {
    if (cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)) {
      return tab.key;
    }
  }

  return "stock";
}

type LeadGenShellProps = {
  access: LeadGenTabsAccess;
  children: React.ReactNode;
};

/**
 * Coquille commune à toutes les pages /lead-generation/*.
 * - Header sobre avec titre + sous-titre du module
 * - Barre d'onglets style « underline » (Linear / Vercel)
 * - Visibilité par onglet pilotée par les permissions calculées côté serveur
 *
 * Le thème anthracite premium (`.lead-gen-premium`) reste appliqué par
 * `app/(dashboard)/lead-generation/layout.tsx`.
 */
export function LeadGenShell({ access, children }: LeadGenShellProps) {
  const pathname = usePathname() ?? "/lead-generation";
  const activeKey = resolveActiveTab(pathname);

  const visibleTabs = TAB_DEFINITIONS.filter((tab) => pickAccess(access, tab.key));

  return (
    <TooltipProvider delayDuration={0}>
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Acquisition de leads
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Pipeline de prospection immobilière CEE — du scraping au closing.
        </p>
      </header>

      {visibleTabs.length > 1 ? (
        <nav
          aria-label="Sections acquisition de leads"
          className="border-b border-border/60"
        >
          <ul className="flex flex-wrap items-end gap-1 -mb-px">
            {visibleTabs.map((tab) => {
              const isActive = tab.key === activeKey;
              const Icon = tab.icon;
              return (
                <li key={tab.key}>
                  <Link
                    href={tab.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group inline-flex items-center gap-2 border-b-2 px-3 pb-3 pt-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-t-md",
                      isActive
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                    )}
                  >
                    <Icon
                      aria-hidden
                      className={cn(
                        "size-4 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      <div className="space-y-6">{children}</div>
    </div>
    </TooltipProvider>
  );
}
