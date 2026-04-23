import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AiOpsAgentFloatingButton } from "@/components/layout/ai-ops-agent-floating-button";
import { AppCommandPalette } from "@/components/layout/app-command-palette";
import { AppFooter } from "@/components/layout/app-footer";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { SidebarProvider, SIDEBAR_COOKIE_NAME } from "@/components/layout/sidebar-context";
import { getAccessContext } from "@/lib/auth/access-context";
import { buildAllowedNavHrefs } from "@/lib/auth/navigation";
import { canAccessCloserWorkspace } from "@/lib/auth/module-access";
import { isSuperAdmin, ROLE_LABEL_FR, isAppRoleCode } from "@/lib/auth/role-codes";
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
  const includeCloserLeadReminders =
    access.kind === "authenticated" && canAccessCloserWorkspace(access);

  const userEmail = profileRow?.email ?? user.email ?? "";
  const roleCodes = access.kind === "authenticated" ? access.roleCodes : [];

  /** Premier rôle « visible » comme libellé sous l'avatar (fallback : email). */
  const primaryRoleCode = roleCodes.find((c) => isAppRoleCode(c) && c !== "super_admin");
  const roleLabel = primaryRoleCode && isAppRoleCode(primaryRoleCode)
    ? ROLE_LABEL_FR[primaryRoleCode]
    : null;

  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === "1";

  return (
    <SidebarProvider initialCollapsed={initialCollapsed}>
      <div className="flex h-screen min-h-screen w-full bg-background text-foreground">
        <AppSidebar
          roleCodes={roleCodes}
          allowedNavHrefs={allowedNavHrefs}
          user={{
            userEmail,
            displayName: profileRow?.full_name ?? null,
            avatarUrl: profileRow?.avatar_url ?? null,
            roleLabel,
            isImpersonating,
            canImpersonate: actorIsSuperAdmin,
            impersonationRoleOptions,
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          {topBanner}
          <AppTopbar
            userId={effectiveId}
            includeCloserLeadReminders={includeCloserLeadReminders}
          />
          <main className="flex-1 overflow-auto px-4 py-6 md:px-6 md:py-6 lg:px-8 lg:py-8">
            {children}
          </main>
          <AppFooter />
        </div>
      </div>
      <AppCommandPalette roleCodes={roleCodes} allowedNavHrefs={allowedNavHrefs} />
      <AiOpsAgentFloatingButton userId={effectiveId} />
    </SidebarProvider>
  );
}
