export type DashboardVariant =
  | "super_admin"
  | "admin"
  | "sales_director"
  | "closer"
  | "sales_agent"
  | "default";

export function resolveDashboardVariant(roleCodes: readonly string[]): DashboardVariant {
  if (roleCodes.includes("super_admin")) {
    return "super_admin";
  }
  if (roleCodes.includes("admin")) {
    return "admin";
  }
  if (roleCodes.includes("sales_director")) {
    return "sales_director";
  }
  if (roleCodes.includes("closer")) {
    return "closer";
  }
  if (roleCodes.includes("sales_agent")) {
    return "sales_agent";
  }
  return "default";
}
