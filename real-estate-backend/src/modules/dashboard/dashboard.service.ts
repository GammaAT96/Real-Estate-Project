import prisma from "../../config/prisma.js";
import { Role, PlotStatus } from "@prisma/client";
import { buildTenantFilter } from "../../utils/tenant.util.js";

interface TenantUser {
  id: string;
  role: Role;
  companyId?: string;
}

export const getSummary = async (currentUser: TenantUser) => {
  const tenantFilter = buildTenantFilter(currentUser);

  // Company count — SUPER_ADMIN only
  const totalCompanies =
    currentUser.role === "SUPER_ADMIN"
      ? await prisma.company.count({ where: { isActive: true } })
      : 0;

  // Projects
  const totalProjects = await prisma.project.count({
    where: { ...tenantFilter, isActive: true },
  });

  // Plot breakdown — for SUPER_ADMIN count all active plots, for others scope by company
  const plotWhere: any = { isActive: true };
  if (currentUser.role !== "SUPER_ADMIN") {
    plotWhere.project = { companyId: currentUser.companyId };
  }

  const [totalPlots, availablePlots, bookedPlots, soldPlots] =
    await Promise.all([
      prisma.plot.count({ where: plotWhere }),
      prisma.plot.count({ where: { ...plotWhere, status: PlotStatus.AVAILABLE } }),
      prisma.plot.count({ where: { ...plotWhere, status: PlotStatus.BOOKED } }),
      prisma.plot.count({ where: { ...plotWhere, status: PlotStatus.SOLD } }),
    ]);

  // Sales — revenue sum using actual saleAmount
  const saleWhere =
    currentUser.role === "SUPER_ADMIN"
      ? { isActive: true }
      : { companyId: currentUser.companyId, isActive: true };

  const revenueAgg = await prisma.sale.aggregate({
    where: saleWhere,
    _count: { id: true },
    _sum: { saleAmount: true },
  });

  return {
    totalCompanies,
    totalProjects,
    totalPlots,
    availablePlots,
    bookedPlots,
    soldPlots,
    totalSalesCount: revenueAgg._count.id,
    totalRevenue: revenueAgg._sum.saleAmount ?? 0,
  };
};
