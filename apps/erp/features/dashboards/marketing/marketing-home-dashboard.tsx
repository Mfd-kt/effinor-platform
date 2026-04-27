import Link from "next/link";
import { ArrowRight, FileText, ImageIcon, LayoutGrid, Settings2, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

import { DashboardLayout } from "../shared/dashboard-layout";

const AREAS: {
  href: string;
  title: string;
  description: string;
  icon: typeof FileText;
}[] = [
  {
    href: "/marketing/blog",
    title: "Blog",
    description: "Articles, brouillons et publication sur effinor.fr",
    icon: FileText,
  },
  {
    href: "/marketing/re-energie",
    title: "Rénovation énergétique",
    description: "Fiches thématiques, catégories et liens site public",
    icon: LayoutGrid,
  },
  {
    href: "/marketing/realisations",
    title: "Réalisations",
    description: "Chantiers et visuels du portfolio",
    icon: ImageIcon,
  },
  {
    href: "/marketing/settings",
    title: "Paramètres site",
    description: "Contact, CTA, bandeau de confiance",
    icon: Settings2,
  },
  {
    href: "/marketing/testimonials",
    title: "Témoignages",
    description: "Avis affichés sur le site",
    icon: Star,
  },
];

/**
 * Accueil pour le rôle marketing : raccourcis vers les onglets du module Marketing.
 */
export function MarketingHomeDashboard() {
  return (
    <DashboardLayout
      title="Espace marketing"
      description="Gérez les contenus publics effinor.fr : blog, fiches rénovation, réalisations, réglages et avis. Ouvrez une section pour travailler."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((a) => {
          const Icon = a.icon;
          return (
            <Link key={a.href} href={a.href} className="group block">
              <Card className="h-full border-border/80 transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-2 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="font-medium text-foreground group-hover:underline">
                      {a.title}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                  <span className="mt-auto inline-flex items-center text-sm font-medium text-primary">
                    Ouvrir
                    <ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Le détail (onglets) se trouve dans <strong className="font-medium text-foreground">Marketing</strong>{" "}
          dans la barre latérale.
        </p>
        <Link href="/marketing/blog" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
          Aller au module Marketing
        </Link>
      </div>
    </DashboardLayout>
  );
}
