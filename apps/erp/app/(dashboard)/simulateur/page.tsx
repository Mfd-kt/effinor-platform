import { redirect } from "next/navigation";

import { SimulatorCee } from "@/features/simulator-cee/components/simulator-cee";
import { getAccessContext } from "@/lib/auth/access-context";
import { hasRole, isCloser, isSalesAgent } from "@/lib/auth/role-codes";

export default async function SimulateurCeePage() {
  const ctx = await getAccessContext();
  if (ctx.kind !== "authenticated") {
    redirect("/login");
  }
  const allowed =
    isSalesAgent(ctx.roleCodes) ||
    isCloser(ctx.roleCodes) ||
    hasRole(ctx.roleCodes, "admin", "super_admin");
  if (!allowed) {
    redirect("/");
  }

  return <SimulatorCee />;
}
