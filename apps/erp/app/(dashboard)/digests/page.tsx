import { redirect } from "next/navigation";

import { RoleDigestCard } from "@/features/role-digests/components/role-digest-card";
import { computeRoleDigestForAccess } from "@/features/role-digests/digest-scheduler";
import { PageHeader } from "@/components/shared/page-header";
import { getAccessContext } from "@/lib/auth/access-context";

export default async function DigestsPage() {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    redirect("/login");
  }

  const result = await computeRoleDigestForAccess(access, { persist: true });
  const digest = result.digest;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <PageHeader
        title="Digest du jour"
        description="Synthèse courte selon ton rôle : priorités, blocages et actions — sans bruit inutile."
      />
      {!digest ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          {result.skipReason === "empty"
            ? "Rien d’utile à te signaler pour l’instant — reviens plus tard ou consulte tes modules habituels."
            : result.skipReason === "no_role"
              ? "Session non reconnue."
              : "Digest indisponible pour le moment."}
        </p>
      ) : (
        <RoleDigestCard digest={digest} duplicateNotice={result.skipReason === "duplicate_suppressed"} />
      )}
    </div>
  );
}
