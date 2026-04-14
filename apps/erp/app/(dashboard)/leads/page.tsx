import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button-variants";
import { LeadsTable } from "@/features/leads/components/leads-table";
import { getLeads } from "@/features/leads/queries/get-leads";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessLostLeadsInbox } from "@/lib/auth/module-access";
import { cn } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

export default async function LeadsPage() {
  const access = await getAccessContext();
  const auth = access.kind === "authenticated" ? access : undefined;
  const showLostInbox = auth ? await canAccessLostLeadsInbox(auth) : false;
  let leads;
  try {
    leads = await getLeads(auth);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du chargement des leads.";
    return (
      <div>
        <PageHeader
          title="Fiches prospects"
          description="Acquisition et qualification des opportunités avant conversion en dossier."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Fiches prospects"
        description="Acquisition et qualification des opportunités avant conversion en dossier."
        actions={
          <>
            {showLostInbox ? (
              <Link href="/leads/lost" className={cn(buttonVariants({ variant: "outline" }))}>
                Prospects perdus
              </Link>
            ) : null}
            <Link href="/leads/new" className={cn(buttonVariants())}>
              Nouveau lead
            </Link>
          </>
        }
      />

      {leads.length === 0 ? (
        <EmptyState
          title="Aucun lead"
          description="Créez un premier lead pour alimenter le pipeline commercial."
          icon={<FolderKanban className="size-10 opacity-50" />}
          action={
            <Link href="/leads/new" className={cn(buttonVariants())}>
              Nouveau lead
            </Link>
          }
        />
      ) : (
        <LeadsTable data={leads} />
      )}
    </div>
  );
}
