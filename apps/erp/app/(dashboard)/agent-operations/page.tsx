import { redirect } from "next/navigation";
import Link from "next/link";

import { AiOpsInbox } from "@/features/ai-ops-agent/components/ai-ops-inbox";
import { RoleDigestCard } from "@/features/role-digests/components/role-digest-card";
import { computeRoleDigestForAccess } from "@/features/role-digests/digest-scheduler";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button-variants";
import { getAccessContext } from "@/lib/auth/access-context";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function AgentOperationsPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    redirect("/login");
  }

  const [supabase, digestResult] = await Promise.all([
    createClient(),
    computeRoleDigestForAccess(access, { persist: true }),
  ]);
  const { data: conversations } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", access.userId)
    .order("updated_at", { ascending: false })
    .limit(120);

  const digest = digestResult.digest;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title="Agent opérations"
        description="Alertes utiles et calmes : une conversation par sujet, cooldowns, regroupements et clôture auto quand le problème disparaît. Tu peux résoudre, snoozer ou escalader depuis chaque fil."
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Digest orienté action (même contenu que la page dédiée).</p>
        <Link href="/digests" className={cn(buttonVariants({ variant: "ghost", size: "xs" }))}>
          Page digest
        </Link>
      </div>
      {digest ? (
        <RoleDigestCard
          digest={digest}
          duplicateNotice={digestResult.skipReason === "duplicate_suppressed"}
        />
      ) : null}
      <AiOpsInbox userId={access.userId} initialConversations={conversations ?? []} />
    </div>
  );
}
