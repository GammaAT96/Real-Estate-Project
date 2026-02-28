import { Role } from "@prisma/client";

interface TenantUser {
  id: string;
  role: Role;
  companyId?: string;
}

export const buildTenantFilter = (user: TenantUser) => {
  if (user.role === "SUPER_ADMIN") {
    return {};
  }

  return {
    companyId: user.companyId,
  };
};
