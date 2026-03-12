import { describe, expect, it } from "vitest";
import { buildTenantFilter } from "./tenant.util.js";

describe("buildTenantFilter", () => {
  it("returns empty filter for SUPER_ADMIN", () => {
    expect(buildTenantFilter({ id: "u1", role: "SUPER_ADMIN" as any })).toEqual({});
  });

  it("returns companyId filter for non-super-admin", () => {
    expect(buildTenantFilter({ id: "u2", role: "AGENT" as any, companyId: "c1" })).toEqual({
      companyId: "c1",
    });
  });
});

