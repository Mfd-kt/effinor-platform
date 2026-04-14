import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppShell } from "@/components/shared/app-shell";
import { getAccessContext } from "@/lib/auth/access-context";
import { buildAllowedNavHrefs } from "@/lib/auth/navigation";
import { isSuperAdmin } from "@/lib/auth/role-codes";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const access = await getAccessContext();
  const allowedNavHrefs =
    access.kind === "authenticated" ? await buildAllowedNavHrefs(supabase, access) : undefined;

  const effectiveId = access.kind === "authenticated" ? access.userId : user.id;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("email, full_name, avatar_url")
    .eq("id", effectiveId)
    .maybeSingle();

  let impersonationRoleOptions: { code: string; label: string }[] = [];
  if (access.kind === "authenticated" && isSuperAdmin(access.actorRoleCodes)) {
    const { data: roles } = await supabase
      .from("roles")
      .select("code, label_fr")
      .order("label_fr", { ascending: true });
    impersonationRoleOptions = (roles ?? []).map((r) => ({
      code: r.code,
      label: r.label_fr?.trim() || r.code,
    }));
  }

  const topBanner =
    access.kind === "authenticated" && access.impersonation ? (
      <ImpersonationBanner
        effectiveEmail={access.email ?? profileRow?.email ?? ""}
        effectiveName={access.fullName ?? profileRow?.full_name ?? null}
        actorEmail={access.impersonation.actorEmail}
        actorName={access.impersonation.actorFullName}
      />
    ) : null;

  const actorIsSuperAdmin = access.kind === "authenticated" && isSuperAdmin(access.actorRoleCodes);
  const isImpersonating = access.kind === "authenticated" && access.impersonation != null;

  return (
    <AppShell
      topBanner={topBanner}
      sidebar={<AppSidebar allowedNavHrefs={allowedNavHrefs} />}
      header={
        <AppHeader
          userId={effectiveId}
          userEmail={profileRow?.email ?? user.email ?? ""}
          displayName={profileRow?.full_name ?? null}
          avatarUrl={profileRow?.avatar_url ?? null}
          allowedNavHrefs={allowedNavHrefs}
          actorIsSuperAdmin={actorIsSuperAdmin}
          isImpersonating={isImpersonating}
          impersonationRoleOptions={impersonationRoleOptions}
        />
      }
    >
      {children}
    </AppShell>
  );
}
