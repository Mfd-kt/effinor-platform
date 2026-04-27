import {
  Calculator,
  Home,
  Inbox,
  Megaphone,
  Settings,
  Target,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { APP_ROLE_CODES, type AppRoleCode } from "@/lib/auth/role-codes";

/**
 * Clé de badge dynamique : la valeur est résolue côté serveur
 * (`getNavBadgeCounts`) puis fournie au sidebar via props.
 */
export type NavBadgeKey =
  | "leadsCount"
  | "tasksCount"
  | "notifsCount";

export type NavBadgeTone = "urgent" | "warning" | "info" | "neutral";

export type NavBadgeValue = {
  count: number;
  tone: NavBadgeTone;
};

export type NavBadgeMap = Partial<Record<NavBadgeKey, NavBadgeValue>>;

export type NavRoleScope = readonly AppRoleCode[] | "*";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Liste de rôles autorisés ou "*" pour tout authentifié. */
  roles: NavRoleScope;
  badgeKey?: NavBadgeKey;
  /** Préfixes additionnels considérés actifs (ex: sous-routes hors `href`). */
  matchPrefixes?: readonly string[];
  /** Raccourci affiché dans la command palette. */
  shortcut?: string;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

/**
 * Hiérarchie ERP simplifiée — un item par domaine, profondeur gérée
 * par chaque page. Les badges sont fournis via `NavBadgeMap`.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "main",
    label: "Main",
    items: [
      {
        href: "/",
        label: "Accueil",
        icon: Home,
        roles: "*",
        shortcut: "G H",
      },
      {
        href: "/lead-generation",
        label: "Acquisition de leads",
        icon: Target,
        roles: "*",
        /** File LGC / fiches assignées : le menu principal pointe vers le hub, le filtrage RBAC repose sur les sous-routes. */
        matchPrefixes: ["/lead-generation"],
        badgeKey: "leadsCount",
        shortcut: "G A",
      },
      {
        href: "/leads",
        label: "CRM",
        icon: Users,
        roles: ["sales_agent", "closer", "sales_director", "admin", "super_admin"],
        matchPrefixes: ["/leads", "/commercial-callbacks"],
        shortcut: "G C",
      },
      {
        href: "/simulateur",
        label: "Simulateur CEE",
        icon: Calculator,
        roles: ["sales_agent", "closer", "admin", "super_admin"],
        matchPrefixes: ["/simulateur"],
        shortcut: "G S",
      },
      {
        href: "/technical-visits",
        label: "Terrain",
        icon: Wrench,
        roles: ["technician", "installer", "admin", "super_admin", "admin_agent"],
        matchPrefixes: ["/technical-visits", "/tasks", "/installations", "/operations"],
        badgeKey: "tasksCount",
        shortcut: "G T",
      },
    ],
  },
  {
    id: "you",
    label: "Vous",
    items: [
      {
        href: "/digests",
        label: "Digest",
        icon: Inbox,
        roles: "*",
        badgeKey: "notifsCount",
        shortcut: "G D",
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    items: [
      {
        href: "/marketing",
        label: "Marketing",
        icon: Megaphone,
        roles: ["admin", "super_admin", "marketing_manager"],
        matchPrefixes: ["/marketing"],
        shortcut: "G M",
      },
    ],
  },
  {
    id: "org",
    label: "Organisation",
    items: [
      {
        href: "/settings",
        label: "Paramètres",
        icon: Settings,
        /** Filtrage réel par `allowedNavHrefs` (équipe CEE, super admin, etc.) */
        roles: "*",
        matchPrefixes: ["/settings", "/admin"],
        shortcut: "G P",
      },
    ],
  },
];

/** Tous les items, pour la command palette + résolution active. */
export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/** Vérifie qu'un item est autorisé pour ce jeu de rôles + RBAC sidebar. */
export function navItemVisible(
  item: NavItem,
  roleCodes: readonly string[],
  allowedNavHrefs?: readonly string[],
): boolean {
  const rolesOk =
    item.roles === "*" ? true : item.roles.some((r) => roleCodes.includes(r));
  if (!rolesOk) return false;

  if (allowedNavHrefs && allowedNavHrefs.length > 0) {
    const matches =
      allowedNavHrefs.includes(item.href) ||
      (item.matchPrefixes ?? []).some((p) => allowedNavHrefs.some((h) => h === p || h.startsWith(`${p}/`)));
    if (!matches) {
      // L'accueil reste toujours visible si l'utilisateur est authentifié.
      if (item.href !== "/") return false;
    }
  }
  return true;
}

export function isNavItemActive(href: string, matchPrefixes: readonly string[] | undefined, pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if (href === "/") return path === "/";
  if (path === href || path.startsWith(`${href}/`)) return true;
  if (!matchPrefixes) return false;
  return matchPrefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Garde-fou typings : assure que tous les rôles cités dans le nav existent. */
const _knownRoles: ReadonlySet<string> = new Set(APP_ROLE_CODES);
for (const section of NAV_SECTIONS) {
  for (const item of section.items) {
    if (item.roles === "*") continue;
    for (const r of item.roles) {
      if (!_knownRoles.has(r)) {
        throw new Error(`nav-config: rôle inconnu "${r}" pour ${item.href}`);
      }
    }
  }
}
