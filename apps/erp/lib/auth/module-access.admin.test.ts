import { describe, expect, it } from "vitest";

import { canAccessAdminCeeSheets } from "@/lib/auth/module-access";

describe("canAccessAdminCeeSheets", () => {
  it("allows super admin, admin and sales director", () => {
    expect(
      canAccessAdminCeeSheets({
        kind: "authenticated",
        userId: "u1",
        actorUserId: "u1",
        actorRoleCodes: ["admin"],
        email: "admin@test.fr",
        fullName: "Admin",
        roleCodes: ["admin"],
        permissionCodes: [],
        impersonation: null,
      }),
    ).toBe(true);

    expect(
      canAccessAdminCeeSheets({
        kind: "authenticated",
        userId: "u1",
        actorUserId: "u1",
        actorRoleCodes: ["sales_director"],
        email: "dir@test.fr",
        fullName: "Dir",
        roleCodes: ["sales_director"],
        permissionCodes: [],
        impersonation: null,
      }),
    ).toBe(true);
  });

  it("denies standard pipeline roles", () => {
    expect(
      canAccessAdminCeeSheets({
        kind: "authenticated",
        userId: "u1",
        actorUserId: "u1",
        actorRoleCodes: ["sales_agent"],
        email: "agent@test.fr",
        fullName: "Agent",
        roleCodes: ["sales_agent"],
        permissionCodes: [],
        impersonation: null,
      }),
    ).toBe(false);
  });
});
