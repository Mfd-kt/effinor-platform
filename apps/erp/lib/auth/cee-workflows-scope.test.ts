import { describe, expect, it } from "vitest";

import {
  canAccessCeeWorkflowsModule,
  hasFullCeeWorkflowAccess,
} from "@/lib/auth/cee-workflows-scope";

describe("cee workflow access scope", () => {
  it("grants full access to admin-like roles", () => {
    expect(
      hasFullCeeWorkflowAccess({
        kind: "authenticated",
        userId: "u-1",
        actorUserId: "u-1",
        actorRoleCodes: ["admin"],
        email: "admin@effinor.fr",
        fullName: "Admin",
        roleCodes: ["admin"],
        permissionCodes: [],
        impersonation: null,
      }),
    ).toBe(true);
  });

  it("grants team access to legacy commercial roles when no permission matrix is loaded", () => {
    expect(
      canAccessCeeWorkflowsModule({
        kind: "authenticated",
        userId: "u-1",
        actorUserId: "u-1",
        actorRoleCodes: ["sales_agent"],
        email: "agent@effinor.fr",
        fullName: "Agent",
        roleCodes: ["sales_agent"],
        permissionCodes: [],
        impersonation: null,
      }),
    ).toBe(true);
  });

  it("denies guest access", () => {
    expect(canAccessCeeWorkflowsModule({ kind: "guest" })).toBe(false);
  });
});
