"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { ALL_NAV_ITEMS } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  "lead-generation": "Acquisition de leads",
  imports: "Imports",
  stock: "Stock",
  management: "Pilotage",
  "my-queue": "Ma file",
  quantification: "Quantification",
  settings: "Réglages",
  analytics: "Analytics",
  automation: "Automatisations",
  learning: "Apprentissage",
  cockpit: "Cockpit",
  leads: "CRM",
  lost: "Perdus",
  "technical-visits": "Visites techniques",
  tasks: "Tâches",
  installations: "Installations",
  operations: "Opérations",
  "commercial-callbacks": "Rappels",
  digests: "Digest",
  account: "Mon compte",
  admin: "Administration",
  users: "Utilisateurs",
  roles: "Rôles",
  products: "Produits",
  "technical-visit-templates": "Templates VT",
  beneficiaries: "Bénéficiaires",
  documents: "Documents",
  delegators: "Délégataires",
  invoices: "Factures",
  quotes: "Devis",
  "existing-heating": "Chauffage existant",
  "installed-products": "Produits installés",
  "operation-sites": "Sites d’opération",
  "technical-studies": "Études techniques",
  "agent-operations": "Opérations agent",
  "lead-generation/imports": "Imports",
  marketing: "Marketing",
  blog: "Blog",
  "re-energie": "Rénovation énergétique",
  realisations: "Réalisations",
  testimonials: "Témoignages",
};

function humanizeSegment(seg: string): string {
  if (SEGMENT_LABELS[seg]) return SEGMENT_LABELS[seg];
  if (/^[0-9a-f-]{20,}$/i.test(seg)) return "Détail";
  return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/[-_]/g, " ");
}

type Crumb = { label: string; href: string };

function buildCrumbs(pathname: string): Crumb[] {
  if (pathname === "/" || pathname === "") {
    return [{ label: "Accueil", href: "/" }];
  }
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "Accueil", href: "/" }];

  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    acc += `/${segments[i]}`;
    /** Si l'URL accumulée matche un item nav top-level, on remplace par son label canonique. */
    const navMatch = ALL_NAV_ITEMS.find((it) => it.href === acc);
    crumbs.push({ label: navMatch?.label ?? humanizeSegment(segments[i]!), href: acc });
  }
  return crumbs;
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);

  return (
    <nav aria-label="Fil d'Ariane" className={cn("flex min-w-0 items-center gap-1 text-sm", className)}>
      <ol className="flex min-w-0 items-center gap-1">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${c.href}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
              ) : null}
              {last ? (
                <span className="truncate font-semibold text-foreground" aria-current="page">
                  {c.label}
                </span>
              ) : (
                <Link
                  href={c.href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
