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

/* ──────────────────────────────────────
   MONTHLY TREND DATA (last 6 months)
────────────────────────────────────── */
export const getMonthlyTrends = async (currentUser: TenantUser) => {
  const saleWhere =
    currentUser.role === "SUPER_ADMIN"
      ? { isActive: true }
      : { companyId: currentUser.companyId, isActive: true };

  const bookingWhere: any = {};
  if (currentUser.role !== "SUPER_ADMIN") {
    bookingWhere.plot = { project: { companyId: currentUser.companyId } };
  }

  // Fetch all sales and bookings from last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [sales, bookings] = await Promise.all([
    prisma.sale.findMany({
      where: { ...saleWhere, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, saleAmount: true },
    }),
    prisma.booking.findMany({
      where: { ...bookingWhere, bookingDate: { gte: sixMonthsAgo } },
      select: { bookingDate: true },
    }),
  ]);

  // Build month buckets for last 6 months
  const months: Record<string, { month: string; revenue: number; bookings: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
    months[key] = { month: label, revenue: 0, bookings: 0 };
  }

  // Aggregate sales by month
  for (const sale of sales) {
    const d = new Date(sale.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (months[key]) months[key].revenue += Number(sale.saleAmount);
  }

  // Aggregate bookings by month
  for (const booking of bookings) {
    const d = new Date(booking.bookingDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (months[key]) months[key].bookings += 1;
  }

  return Object.values(months);
};
