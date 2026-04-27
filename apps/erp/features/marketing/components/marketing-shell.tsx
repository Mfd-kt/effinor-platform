"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  ImageIcon,
  LayoutGrid,
  Settings2,
  Star,
  type LucideIcon,
} from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type MarketingTabKey =
  | "blog"
  | "re-energie"
  | "realisations"
  | "settings"
  | "testimonials";

type TabDefinition = {
  key: MarketingTabKey;
  label: string;
  href: string;
  icon: LucideIcon;
  matchPrefixes: readonly string[];
};

const TAB_DEFINITIONS: readonly TabDefinition[] = [
  {
    key: "blog",
    label: "Blog",
    href: "/marketing/blog",
    icon: FileText,
    matchPrefixes: ["/marketing/blog"],
  },
  {
    key: "re-energie",
    label: "Rénovation énergétique",
    href: "/marketing/re-energie",
    icon: LayoutGrid,
    matchPrefixes: ["/marketing/re-energie"],
  },
  {
    key: "realisations",
    label: "Réalisations",
    href: "/marketing/realisations",
    icon: ImageIcon,
    matchPrefixes: ["/marketing/realisations"],
  },
  {
    key: "settings",
    label: "Paramètres site",
    href: "/marketing/settings",
    icon: Settings2,
    matchPrefixes: ["/marketing/settings"],
  },
  {
    key: "testimonials",
    label: "Témoignages",
    href: "/marketing/testimonials",
    icon: Star,
    matchPrefixes: ["/marketing/testimonials"],
  },
];

/**
 * Onglet actif : préfixes les plus spécifiques d'abord.
 */
function resolveActiveTab(pathname: string): MarketingTabKey {
  const cleanPath = pathname.replace(/\/$/, "") || "/";

  const prefixedTabs = TAB_DEFINITIONS.flatMap((tab) =>
    [tab.href, ...tab.matchPrefixes].map((prefix) => ({ tab, prefix })),
  )
    .filter(({ prefix }) => prefix.length > 0)
    .sort((a, b) => b.prefix.length - a.prefix.length);

  for (const { tab, prefix } of prefixedTabs) {
    if (cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)) {
      return tab.key;
    }
  }

  return "blog";
}

type MarketingShellProps = {
  children: React.ReactNode;
};

/**
 * Coquille /marketing/* : une entrée sidebar « Marketing » + onglets internes
 * (même principe que l’acquisition de leads).
 */
export function MarketingShell({ children }: MarketingShellProps) {
  const pathname = usePathname() ?? "/marketing";
  const activeKey = resolveActiveTab(pathname);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Marketing
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Contenus du site public effinor.fr : blog, fiches rénovation énergétique,
            réalisations, réglages et avis.
          </p>
        </header>

        <nav aria-label="Sections marketing" className="border-b border-border/60">
          <ul className="flex flex-wrap items-end gap-1 -mb-px">
            {TAB_DEFINITIONS.map((tab) => {
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
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-6">{children}</div>
      </div>
    </TooltipProvider>
  );
}
