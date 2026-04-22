import { notFound } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button-variants";
import { LeadsTable } from "@/features/leads/components/leads-table";
import { getLeads } from "@/features/leads/queries/get-leads";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLeadsDirectoryNav, canAccessLostLeadsInbox } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";
import { UserRoundX } from "lucide-react";

export default async function LostLeadsPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessLostLeadsInbox(access))) {
    notFound();
  }

  let leads;
  try {
    leads = await getLeads(access, { visibility: "lost_only" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du chargement des leads.";
    return (
      <div>
        <PageHeader
          title="Prospects perdus"
          description="Fiches au statut « Perdu », consultables ici pour le pilotage."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  const showActiveLeadsLink = canAccessLeadsDirectoryNav(access);

  return (
    <div>
      <PageHeader
        title="Prospects perdus"
        description="Hors des listes opérationnelles (agent, closer, fiches actives). Les indicateurs du cockpit incluent toujours ces dossiers dans le funnel."
        actions={
          showActiveLeadsLink ? (
            <Link href="/leads" className={cn(buttonVariants({ variant: "outline" }))}>
              Fiches actives
            </Link>
          ) : undefined
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          title="Aucun prospect perdu"
          description="Les dossiers marqués « Perdu » apparaîtront ici."
          icon={<UserRoundX className="size-10 opacity-50" />}
        />
      ) : (
        <LeadsTable data={leads} />
      )}
    </div>
  );
}
