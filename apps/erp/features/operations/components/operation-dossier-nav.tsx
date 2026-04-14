"use client";

import { cn } from "@/lib/utils";

const links = [
  { href: "#operation-dossier-overview", label: "Vue générale" },
  { href: "#operation-dossier-modules", label: "Sous-modules" },
  { href: "#operation-dossier-vt", label: "VT de référence" },
  { href: "#operation-dossier-pilotage-form", label: "Pilotage" },
] as const;

export function OperationDossierNav({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Sections du dossier"
      className={cn(
        "mb-8 flex flex-wrap gap-2 border-b border-border pb-3",
        className,
      )}
    >
      {links.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
            "hover:border-border hover:bg-muted/50 hover:text-foreground",
          )}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
