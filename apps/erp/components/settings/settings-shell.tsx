"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Shield, Users, type LucideIcon } from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type SettingsTabsAccess = Readonly<{
  users: boolean;
  roles: boolean;
  products: boolean;
}>;

type SettingsTabKey = keyof SettingsTabsAccess;

type TabDefinition = {
  key: SettingsTabKey;
  label: string;
  href: string;
  icon: LucideIcon;
  matchPrefixes: readonly string[];
};

const TAB_DEFINITIONS: readonly TabDefinition[] = [
  {
    key: "users",
    label: "Utilisateurs",
    href: "/settings/users",
    icon: Users,
    matchPrefixes: ["/settings/users"],
  },
  {
    key: "roles",
    label: "Rôles & permissions",
    href: "/settings/roles",
    icon: Shield,
    matchPrefixes: ["/settings/roles"],
  },
  {
    key: "products",
    label: "Produits",
    href: "/settings/products",
    icon: Package,
    matchPrefixes: ["/settings/products"],
  },
];

function pickAccess(access: SettingsTabsAccess, key: SettingsTabKey): boolean {
  return access[key];
}

function resolveActiveTab(pathname: string): SettingsTabKey {
  const cleanPath = pathname.replace(/\/$/, "") || "/";
  const prefixed = TAB_DEFINITIONS.flatMap((tab) =>
    [tab.href, ...tab.matchPrefixes].map((prefix) => ({ tab, prefix })),
  )
    .filter(({ prefix }) => prefix.length > 0)
    .sort((a, b) => b.prefix.length - a.prefix.length);

  for (const { tab, prefix } of prefixed) {
    if (cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)) {
      return tab.key;
    }
  }
  return "users";
}

type SettingsShellProps = {
  access: SettingsTabsAccess;
  children: React.ReactNode;
};

/**
 * Coquille /settings/* : entrée unique « Paramètres » + onglets (utilisateurs, rôles, produits).
 * Visibilité des onglets : super admin (tout) vs manager d’équipe CEE (utilisateurs seulement), etc.
 */
export function SettingsShell({ access, children }: SettingsShellProps) {
  const pathname = usePathname() ?? "/settings";
  const activeKey = resolveActiveTab(pathname);
  const visibleTabs = TAB_DEFINITIONS.filter((tab) => pickAccess(access, tab.key));

  return (
    <TooltipProvider delayDuration={0}>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Paramètres
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Comptes, rôles, catalogue produits et droits d’accès à l’ERP.
          </p>
        </header>

        {visibleTabs.length > 1 ? (
          <nav aria-label="Sections paramètres" className="border-b border-border/60">
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
        ) : null}

        <div className="space-y-6">{children}</div>
      </div>
    </TooltipProvider>
  );
}
