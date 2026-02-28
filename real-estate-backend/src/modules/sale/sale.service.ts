import prisma from "../../config/prisma.js";
import { Role, PlotStatus, BookingStatus } from "@prisma/client";
import { AppError } from "../../utils/appError.js";
import { buildTenantFilter } from "../../utils/tenant.util.js";

interface TenantUser {
  id: string;
  role: Role;
  companyId?: string;
}

/* --------------------------------
   CREATE SALE (transactional)
--------------------------------- */
export const createSale = async (
  currentUser: TenantUser,
  plotId: string,
  saleAmount: number
) => {
  if (currentUser.role === "SUPER_ADMIN") {
    throw new AppError("Super admin cannot create a sale", 403);
  }

  return prisma.$transaction(async (tx) => {
    // Plot must belong to the tenant (via project)
    const plot = await tx.plot.findFirst({
      where: {
        id: plotId,
        isActive: true,
        project: { ...buildTenantFilter(currentUser) },
      },
      include: { bookings: true },
    });

    if (!plot) {
      throw new AppError("Plot not found or access denied", 404);
    }

    if (plot.status !== PlotStatus.BOOKED) {
      throw new AppError("Only booked plots can be sold", 400);
    }

    const activeBooking = plot.bookings.find(
      (b) => b.status === BookingStatus.ACTIVE
    );
    if (!activeBooking) {
      throw new AppError("No active booking found for this plot", 400);
    }

    const sale = await tx.sale.create({
      data: {
        plotId,
        agentId: currentUser.id,
        companyId: currentUser.companyId!,
        saleAmount,
      },
    });

    // Mark plot as SOLD
    await tx.plot.update({
      where: { id: plotId },
      data: { status: PlotStatus.SOLD },
    });

    return sale;
  });
};

/* --------------------------------
   GET ALL SALES (tenant-scoped)
--------------------------------- */
export const getSales = async (
  currentUser: TenantUser,
  page: number,
  limit: number,
  skip: number,
  from?: string,
  to?: string
) => {
  const where: any =
    currentUser.role === "SUPER_ADMIN"
      ? { isActive: true }
      : { companyId: currentUser.companyId, isActive: true };

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      skip,
      take: limit,
      include: {
        plot: { include: { project: true } },
        agent: { select: { id: true, username: true, role: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.count({ where }),
  ]);

  return { sales, total };
};

/* --------------------------------
   GET SALE BY ID
--------------------------------- */
export const getSaleById = async (currentUser: TenantUser, id: string) => {
  const where =
    currentUser.role === "SUPER_ADMIN"
      ? { id, isActive: true }
      : { id, companyId: currentUser.companyId, isActive: true };

  const sale = await prisma.sale.findFirst({
    where,
    include: {
      plot: { include: { project: true } },
      agent: { select: { id: true, username: true, role: true } },
      company: { select: { id: true, name: true } },
    },
  });

  if (!sale) throw new AppError("Sale not found", 404);
  return sale;
};

/* --------------------------------
   UPDATE SALE AMOUNT
--------------------------------- */
export const updateSale = async (
  currentUser: TenantUser,
  id: string,
  saleAmount: number
) => {
  const existing = await prisma.sale.findFirst({
    where: {
      id,
      ...(currentUser.role !== "SUPER_ADMIN" && {
        companyId: currentUser.companyId,
      }),
      isActive: true,
    },
  });
  if (!existing) throw new AppError("Sale not found", 404);

  return prisma.sale.update({
    where: { id },
    data: { saleAmount },
  });
};

/* --------------------------------
   SOFT DELETE SALE
--------------------------------- */
export const deleteSale = async (currentUser: TenantUser, id: string) => {
  const existing = await prisma.sale.findFirst({
    where: {
      id,
      ...(currentUser.role !== "SUPER_ADMIN" && {
        companyId: currentUser.companyId,
      }),
      isActive: true,
    },
  });
  if (!existing) throw new AppError("Sale not found", 404);

  await prisma.sale.update({ where: { id }, data: { isActive: false } });
  return { message: "Sale deleted successfully" };
};