import prisma from "../../config/prisma.js";
import { InstallmentStatus, PaymentMethod, Role } from "@prisma/client";
import { AppError } from "../../utils/appError.js";

interface TenantUser {
  id: string;
  role: Role;
  companyId?: string;
}

function buildInstallmentTenantWhere(currentUser: TenantUser) {
  if (currentUser.role === "SUPER_ADMIN") return {};
  return { companyId: currentUser.companyId };
}

export async function createInstallmentSchedule(
  currentUser: TenantUser,
  saleId: string,
  installments: Array<{ number: number; amount: number; dueDate: Date }>
) {
  if (currentUser.role === "SUPER_ADMIN") {
    throw new AppError("Super admin cannot create installments", 403);
  }

  const sale = await prisma.sale.findFirst({
    where: {
      id: saleId,
      isActive: true,
      companyId: currentUser.companyId,
    },
    select: { id: true, companyId: true },
  });

  if (!sale) throw new AppError("Sale not found or access denied", 404);

  // Prevent duplicate schedules (simple rule: one schedule per sale)
  const existingCount = await prisma.installment.count({ where: { saleId } });
  if (existingCount > 0) throw new AppError("Installment schedule already exists for this sale", 400);

  // Validate numbers uniqueness & ordering
  const numbers = installments.map((i) => i.number);
  const unique = new Set(numbers);
  if (unique.size !== numbers.length) throw new AppError("Duplicate installment numbers not allowed", 400);

  return prisma.installment.createMany({
    data: installments.map((i) => ({
      saleId,
      companyId: sale.companyId,
      number: i.number,
      amount: i.amount,
      dueDate: i.dueDate,
      status: InstallmentStatus.DUE,
    })),
  });
}

export async function listInstallments(
  currentUser: TenantUser,
  opts: { status?: InstallmentStatus; saleId?: string; from?: string; to?: string; overdue?: boolean }
) {
  const where: any = { ...buildInstallmentTenantWhere(currentUser) };

  if (opts.status) where.status = opts.status;
  if (opts.saleId) where.saleId = opts.saleId;

  if (opts.from || opts.to || opts.overdue) {
    where.dueDate = {};
    if (opts.from) where.dueDate.gte = new Date(opts.from);
    if (opts.to) {
      const end = new Date(opts.to);
      end.setHours(23, 59, 59, 999);
      where.dueDate.lte = end;
    }
  }

  if (opts.overdue) {
    where.status = InstallmentStatus.DUE;
    where.dueDate = { ...(where.dueDate ?? {}), lt: new Date() };
  }

  return prisma.installment.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { number: "asc" }],
    include: {
      sale: {
        include: {
          plot: { include: { project: true } },
        },
      },
      receivedBy: { select: { id: true, username: true, role: true } },
    },
  });
}

export async function markInstallmentPaid(
  currentUser: TenantUser,
  id: string,
  data: { paidAmount?: number; paidAt?: Date; method?: PaymentMethod; reference?: string }
) {
  const installment = await prisma.installment.findFirst({
    where: { id, ...buildInstallmentTenantWhere(currentUser) },
  });
  if (!installment) throw new AppError("Installment not found", 404);

  if (installment.status === InstallmentStatus.PAID) {
    throw new AppError("Installment already paid", 400);
  }
  if (installment.status === InstallmentStatus.WAIVED) {
    throw new AppError("Cannot pay a waived installment", 400);
  }

  return prisma.installment.update({
    where: { id },
    data: {
      status: InstallmentStatus.PAID,
      paidAt: data.paidAt ?? new Date(),
      paidAmount: data.paidAmount ?? Number(installment.amount),
      method: data.method,
      reference: data.reference,
      receivedById: currentUser.id,
    },
  });
}

export async function waiveInstallment(currentUser: TenantUser, id: string) {
  if (currentUser.role === "AGENT") {
    throw new AppError("Only admins can waive installments", 403);
  }

  const installment = await prisma.installment.findFirst({
    where: { id, ...buildInstallmentTenantWhere(currentUser) },
  });
  if (!installment) throw new AppError("Installment not found", 404);

  if (installment.status === InstallmentStatus.PAID) {
    throw new AppError("Cannot waive a paid installment", 400);
  }

  return prisma.installment.update({
    where: { id },
    data: {
      status: InstallmentStatus.WAIVED,
      paidAt: null,
      paidAmount: null,
      method: null,
      reference: null,
      receivedById: null,
    },
  });
}

export async function getDuesSummary(currentUser: TenantUser) {
  const tenantWhere = buildInstallmentTenantWhere(currentUser);
  const now = new Date();

  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dueAgg, overdueAgg, next7Agg, paidThisMonthAgg] = await Promise.all([
    prisma.installment.aggregate({
      where: { ...tenantWhere, status: InstallmentStatus.DUE },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.installment.aggregate({
      where: { ...tenantWhere, status: InstallmentStatus.DUE, dueDate: { lt: now } },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.installment.aggregate({
      where: {
        ...tenantWhere,
        status: InstallmentStatus.DUE,
        dueDate: { gte: now, lte: sevenDays },
      },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.installment.aggregate({
      where: { ...tenantWhere, status: InstallmentStatus.PAID, paidAt: { gte: startOfMonth } },
      _count: { id: true },
      _sum: { paidAmount: true },
    }),
  ]);

  return {
    dueCount: dueAgg._count.id,
    dueAmount: dueAgg._sum.amount ?? 0,
    overdueCount: overdueAgg._count.id,
    overdueAmount: overdueAgg._sum.amount ?? 0,
    dueNext7DaysCount: next7Agg._count.id,
    dueNext7DaysAmount: next7Agg._sum.amount ?? 0,
    paidThisMonthCount: paidThisMonthAgg._count.id,
    paidThisMonthAmount: paidThisMonthAgg._sum.paidAmount ?? 0,
  };
}

