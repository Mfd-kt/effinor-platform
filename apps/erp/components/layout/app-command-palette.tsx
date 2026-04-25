"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Keyboard,
  LifeBuoy,
  Plus,
  Inbox,
  type LucideIcon,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  navItemVisible,
  ALL_NAV_ITEMS,
  type NavItem,
} from "@/components/layout/nav-config";
import { COMMAND_PALETTE_EVENT } from "@/components/layout/sidebar-context";

export type RecentLeadEntry = {
  id: string;
  title: string;
  city?: string | null;
  dpe?: string | null;
  href: string;
};

export type AppCommandPaletteProps = {
  roleCodes: readonly string[];
  allowedNavHrefs?: readonly string[];
  recentLeads?: RecentLeadEntry[];
};

type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  shortcut?: string;
  /** Filtre optionnel par préfixe `allowedNavHrefs`. */
  requiresHref?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "new-import",
    label: "Lancer un import Leboncoin",
    icon: Plus,
    href: "/lead-generation/imports?action=new",
    requiresHref: "/lead-generation",
  },
  {
    id: "new-lead",
    label: "Créer un lead",
    icon: Plus,
    href: "/leads?action=new",
    requiresHref: "/leads",
  },
  {
    id: "new-vt",
    label: "Planifier une visite technique",
    icon: Plus,
    href: "/technical-visits?action=new",
    requiresHref: "/technical-visits",
  },
];

export function AppCommandPalette({ roleCodes, allowedNavHrefs, recentLeads }: AppCommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const visibleNav: NavItem[] = ALL_NAV_ITEMS.filter((it) =>
    navItemVisible(it, roleCodes, allowedNavHrefs),
  );

  const visibleQuickActions = QUICK_ACTIONS.filter((qa) => {
    if (!qa.requiresHref) return true;
    if (!allowedNavHrefs || allowedNavHrefs.length === 0) return true;
    return allowedNavHrefs.some(
      (h) => h === qa.requiresHref || h.startsWith(`${qa.requiresHref}/`),
    );
  });

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onTrigger() {
      setOpen((o) => !o);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_PALETTE_EVENT, onTrigger as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_PALETTE_EVENT, onTrigger as EventListener);
    };
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Recherche globale">
      <CommandInput placeholder="Rechercher pages, actions, leads…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        {visibleNav.length > 0 ? (
          <CommandGroup heading="Navigation">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={`nav ${item.label} ${item.href}`}
                  onSelect={() => go(item.href)}
                >
                  <Icon className="text-muted-foreground" aria-hidden />
                  <span>{item.label}</span>
                  {item.shortcut ? <CommandShortcut>{item.shortcut}</CommandShortcut> : null}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}

        {visibleQuickActions.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Actions rapides">
              {visibleQuickActions.map((qa) => {
                const Icon = qa.icon;
                return (
                  <CommandItem
                    key={qa.id}
                    value={`action ${qa.label}`}
                    onSelect={() => go(qa.href)}
                  >
                    <Icon className="text-primary" aria-hidden />
                    <span>{qa.label}</span>
                    {qa.shortcut ? <CommandShortcut>{qa.shortcut}</CommandShortcut> : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        ) : null}

        {recentLeads && recentLeads.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Leads récents">
              {recentLeads.slice(0, 5).map((lead) => {
                const subtitle = [lead.city, lead.dpe ? `DPE ${lead.dpe}` : null]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <CommandItem
                    key={lead.id}
                    value={`lead ${lead.title} ${lead.city ?? ""}`}
                    onSelect={() => go(lead.href)}
                  >
                    <Inbox className="text-muted-foreground" aria-hidden />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{lead.title}</span>
                      {subtitle ? (
                        <span className="truncate text-[11px] text-muted-foreground">{subtitle}</span>
                      ) : null}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        ) : null}

        <CommandSeparator />
        <CommandGroup heading="Aide">
          <CommandItem
            value="help docs"
            onSelect={() => {
              setOpen(false);
              window.open("https://docs.effinor.fr", "_blank", "noreferrer");
            }}
          >
            <BookOpen className="text-muted-foreground" aria-hidden />
            <span>Documentation</span>
          </CommandItem>
          <CommandItem
            value="help support"
            onSelect={() => {
              setOpen(false);
              window.location.href = "mailto:support@effinor.fr";
            }}
          >
            <LifeBuoy className="text-muted-foreground" aria-hidden />
            <span>Contacter le support</span>
          </CommandItem>
          <CommandItem
            value="help shortcuts"
            onSelect={() => {
              setOpen(false);
            }}
          >
            <Keyboard className="text-muted-foreground" aria-hidden />
            <span>Raccourcis clavier</span>
            <CommandShortcut>⌘K · ⌘B</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
