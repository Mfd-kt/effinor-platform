import {
  BookOpen,
  ClipboardList,
  FileStack,
  FileText,
  Flame,
  MapPin,
  Package,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { OperationDossierStats } from "@/features/operations/queries/get-operation-dossier-stats";
import { OperationChildModuleCard } from "@/features/operations/components/operation-child-module-card";

type OperationChildModulesGridProps = {
  operationId: string;
  stats: OperationDossierStats;
};

type ModuleDef = {
  key: keyof OperationDossierStats;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export function OperationChildModulesGrid({ operationId, stats }: OperationChildModulesGridProps) {
  const q = `operation_id=${encodeURIComponent(operationId)}`;

  const modules: ModuleDef[] = [
    {
      key: "operationSites",
      title: "Sites techniques",
      description: "Entrepôts, bureaux, serres, volumes et contraintes terrain.",
      href: `/operation-sites?${q}`,
      icon: MapPin,
    },
    {
      key: "technicalStudies",
      title: "Études techniques",
      description: "NDD, notes de dimensionnement, études et synthèses.",
      href: `/technical-studies?${q}`,
      icon: BookOpen,
    },
    {
      key: "existingHeatingUnits",
      title: "Chauffage existant",
      description: "Unités observées sur site et modèles catalogue.",
      href: `/existing-heating?${q}`,
      icon: Flame,
    },
    {
      key: "installedProducts",
      title: "Produits installés",
      description: "Équipements prévus ou posés — chiffrage et cohérence technique.",
      href: `/installed-products?${q}`,
      icon: Package,
    },
    {
      key: "documents",
      title: "Documents",
      description: "Référentiel pièces : PDF, justificatifs, attestations.",
      href: `/documents?${q}`,
      icon: FileStack,
    },
    {
      key: "quotes",
      title: "Devis",
      description: "Propositions commerciales et montants.",
      href: `/quotes?${q}`,
      icon: FileText,
    },
    {
      key: "invoices",
      title: "Factures",
      description: "Facturation et suivi des règlements.",
      href: `/invoices?${q}`,
      icon: FileText,
    },
    {
      key: "installations",
      title: "Installations",
      description: "Planning terrain et exécution.",
      href: `/installations?${q}`,
      icon: Wrench,
    },
  ];

  return (
    <div className="mb-10">
      <div className="mb-6 flex items-start gap-3">
        <div className="mt-0.5 rounded-md border border-border bg-muted/40 p-2">
          <ClipboardList className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Dossier opération</h2>
          <p className="mt-1 max-w-3xl text-muted-foreground text-sm leading-relaxed">
            Accès aux sous-modules de ce dossier. Les listes s’ouvrent filtrées sur cette opération
            lorsque le module le permet.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((m) => (
          <div key={m.key} className="relative">
            <div className="absolute right-4 top-4 text-muted-foreground/30">
              <m.icon className="size-5" aria-hidden />
            </div>
            <OperationChildModuleCard
              title={m.title}
              description={m.description}
              count={stats[m.key]}
              href={m.href}
              hrefLabel="Ouvrir la liste"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
