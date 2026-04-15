import {
  BadgeEuro,
  Briefcase,
  CircleDollarSign,
  ClipboardCheck,
  ContactRound,
  FileSpreadsheet,
  FolderKanban,
  Headset,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  ListTodo,
  MapPinned,
  Network,
  Package,
  Radar,
  ScrollText,
  Settings,
  ShieldCheck,
  UserRound,
  UserRoundX,
  Users,
  KeyRound,
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

export type NavGroupItem = {
  kind: "group";
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavGroupSubItem[];
};

export type SidebarNavEntry = NavLinkItem | NavGroupItem;

/**
 * Navigation principale (sidebar + menu mobile).
 * Regroupement type SaaS : vue d’ensemble, pilotage CEE, prospection, terrain, puis compte et administration.
 */
export const sidebarNavigation: SidebarNavEntry[] = [
  {
    kind: "group",
    id: "overview",
    label: "Vue d’ensemble",
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
    label: "Prospection",
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
  { kind: "link", href: "/digests", label: "Digest", icon: ScrollText },
  { kind: "link", href: "/account", label: "Mon compte", icon: UserRound },
  {
    kind: "group",
    id: "settings",
    label: "Administration",
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
