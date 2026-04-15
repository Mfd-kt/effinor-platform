import {
  CircleDollarSign,
  ClipboardCheck,
  ContactRound,
  FolderKanban,
  Headset,
  LayoutDashboard,
  ListTodo,
  Radar,
  ScrollText,
  Settings,
  ShieldCheck,
  UserRound,
  UserRoundX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavLinkItem = {
  kind: "link";
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroupItem = {
  kind: "group";
  id: string;
  label: string;
  icon: LucideIcon;
  items: { href: string; label: string }[];
};

export type SidebarNavEntry = NavLinkItem | NavGroupItem;

/**
 * Navigation principale (sidebar + menu mobile). Le bloc « Réglages » regroupe les écrans d’administration.
 */
export const sidebarNavigation: SidebarNavEntry[] = [
  { kind: "link", href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { kind: "link", href: "/cockpit", label: "Cockpit", icon: Radar },
  { kind: "link", href: "/agent", label: "Agent", icon: Headset },
  { kind: "link", href: "/commercial-callbacks", label: "Rappels équipe", icon: ContactRound },
  { kind: "link", href: "/confirmateur", label: "Confirmateur", icon: ShieldCheck },
  { kind: "link", href: "/closer", label: "Closer", icon: CircleDollarSign },
  { kind: "link", href: "/leads", label: "Fiches prospects", icon: FolderKanban },
  { kind: "link", href: "/leads/lost", label: "Prospects perdus", icon: UserRoundX },
  { kind: "link", href: "/technical-visits", label: "Visites techniques", icon: ClipboardCheck },
  { kind: "link", href: "/tasks", label: "Tâches", icon: ListTodo },
  { kind: "link", href: "/digests", label: "Digest", icon: ScrollText },
  { kind: "link", href: "/account", label: "Mon compte", icon: UserRound },
  {
    kind: "group",
    id: "settings",
    label: "Réglages",
    icon: Settings,
    items: [
      { href: "/settings/users", label: "Utilisateurs" },
      { href: "/settings/roles", label: "Rôles et permissions" },
      { href: "/settings/cee", label: "Réglages CEE" },
      { href: "/admin/cee-sheets", label: "Fiches CEE" },
      { href: "/admin/technical-visit-templates", label: "Templates VT (builder)" },
      { href: "/settings/products", label: "Produits" },
    ],
  },
];
