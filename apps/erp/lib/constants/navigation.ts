import {
  BadgeEuro,
  Briefcase,
  CircleDollarSign,
  ClipboardCheck,
  ContactRound,
  FileSpreadsheet,
  FolderKanban,
  Headset,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  ListTodo,
  ListChecks,
  MapPinned,
  Network,
  Package,
  Radar,
  ScrollText,
  Settings,
  SlidersHorizontal,
  ShieldCheck,
  UserRound,
  UserRoundX,
  Users,
  KeyRound,
  Table2,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavLinkItem = {
  kind: "link";
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroupSubItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Sous-groupe (sous-onglet) : regroupe plusieurs liens sous un libellé de rôle / domaine. */
export type NavGroupSectionItem = {
  kind: "section";
  id: string;
  label: string;
  items: NavGroupSubItem[];
};

export type NavGroupChild = NavGroupSubItem | NavGroupSectionItem;

export type NavGroupItem = {
  kind: "group";
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavGroupChild[];
};

/** Séparateur visuel entre blocs métier. */
export type NavDividerItem = { kind: "divider"; id: string };

/** Libellé de section discret au-dessus d'un bloc. */
export type NavHeadingItem = { kind: "heading"; id: string; label: string };

export type SidebarNavEntry = NavLinkItem | NavGroupItem | NavDividerItem | NavHeadingItem;

/**
 * Navigation principale (sidebar + menu mobile).
 * Hiérarchie type SaaS : travail quotidien → acquisition de leads → perso → organisation.
 */
export const sidebarNavigation: SidebarNavEntry[] = [
  {
    kind: "group",
    id: "overview",
    label: "Accueil",
    icon: LayoutGrid,
    items: [
      { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/cockpit", label: "Cockpit", icon: Radar },
    ],
  },
  {
    kind: "group",
    id: "cee-ops",
    label: "Pilotage CEE",
    icon: Network,
    items: [
      { href: "/agent", label: "Agent", icon: Headset },
      { href: "/commercial-callbacks", label: "Rappels équipe", icon: ContactRound },
      { href: "/confirmateur", label: "Confirmateur", icon: ShieldCheck },
      { href: "/closer", label: "Closer", icon: CircleDollarSign },
    ],
  },
  {
    kind: "group",
    id: "sales",
    label: "CRM & prospection",
    icon: Briefcase,
    items: [
      { href: "/leads", label: "Fiches prospects", icon: FolderKanban },
      { href: "/leads/lost", label: "Prospects perdus", icon: UserRoundX },
    ],
  },
  {
    kind: "group",
    id: "field",
    label: "Terrain & suivi",
    icon: MapPinned,
    items: [
      { href: "/technical-visits", label: "Visites techniques", icon: ClipboardCheck },
      { href: "/tasks", label: "Tâches", icon: ListTodo },
    ],
  },
  { kind: "divider", id: "after-field" },
  {
    kind: "group",
    id: "lead-gen-admin",
    label: "Acquisition de leads",
    icon: Target,
    items: [
      { href: "/lead-generation", label: "Pilotage", icon: LayoutDashboard },
      { href: "/lead-generation/quantification", label: "À qualifier", icon: ListChecks },
      { href: "/lead-generation/my-queue", label: "Ma file", icon: Inbox },
      { href: "/lead-generation/stock", label: "Stock", icon: Table2 },
      { href: "/lead-generation/settings", label: "Réglages", icon: SlidersHorizontal },
    ],
  },
  { kind: "divider", id: "after-lead-gen" },
  { kind: "heading", id: "hx-personal", label: "Pour vous" },
  { kind: "link", href: "/digests", label: "Digest", icon: ScrollText },
  { kind: "link", href: "/account", label: "Mon compte", icon: UserRound },
  { kind: "divider", id: "before-admin" },
  { kind: "heading", id: "hx-org", label: "Organisation" },
  {
    kind: "group",
    id: "settings",
    label: "Paramètres",
    icon: Settings,
    items: [
      { href: "/settings/users", label: "Utilisateurs", icon: Users },
      { href: "/settings/roles", label: "Rôles et permissions", icon: KeyRound },
      { href: "/settings/cee", label: "Réglages CEE", icon: BadgeEuro },
      { href: "/admin/cee-sheets", label: "Fiches CEE", icon: FileSpreadsheet },
      { href: "/admin/technical-visit-templates", label: "Templates visite technique", icon: LayoutTemplate },
      { href: "/settings/products", label: "Produits", icon: Package },
    ],
  },
];
