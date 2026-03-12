import { describe, expect, it, vi } from "vitest";
import { InstallmentStatus, PaymentMethod, Role } from "@prisma/client";
import { AppError } from "../../utils/appError.js";

const prismaHoisted = vi.hoisted(() => {
  const prisma = {
    sale: {
      findFirst: vi.fn(),
    },
    installment: {
      count: vi.fn(),
      createMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
  };
  return { prisma };
});

vi.mock("../../config/prisma.js", () => ({
  default: prismaHoisted.prisma,
}));

import {
  createInstallmentSchedule,
  getDuesSummary,
  markInstallmentPaid,
  waiveInstallment,
} from "./installment.service.js";

describe("installment.service", () => {
  it("createInstallmentSchedule blocks SUPER_ADMIN", async () => {
    await expect(
      createInstallmentSchedule({ id: "u1", role: Role.SUPER_ADMIN }, "s1", [
        { number: 1, amount: 1000, dueDate: new Date() },
      ])
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("createInstallmentSchedule 404 when sale missing", async () => {
    prismaHoisted.prisma.sale.findFirst.mockResolvedValueOnce(null);

    await expect(
      createInstallmentSchedule({ id: "u2", role: Role.COMPANY_ADMIN, companyId: "c1" }, "s1", [
        { number: 1, amount: 1000, dueDate: new Date() },
      ])
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      createInstallmentSchedule({ id: "u2", role: Role.COMPANY_ADMIN, companyId: "c1" }, "s1", [
        { number: 1, amount: 1000, dueDate: new Date() },
      ])
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("createInstallmentSchedule rejects duplicate schedules", async () => {
    prismaHoisted.prisma.sale.findFirst.mockResolvedValueOnce({ id: "s1", companyId: "c1" });
    prismaHoisted.prisma.installment.count.mockResolvedValueOnce(1);

    await expect(
      createInstallmentSchedule({ id: "u2", role: Role.COMPANY_ADMIN, companyId: "c1" }, "s1", [
        { number: 1, amount: 1000, dueDate: new Date() },
      ])
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createInstallmentSchedule rejects duplicate installment numbers", async () => {
    prismaHoisted.prisma.sale.findFirst.mockResolvedValueOnce({ id: "s1", companyId: "c1" });
    prismaHoisted.prisma.installment.count.mockResolvedValueOnce(0);

    await expect(
      createInstallmentSchedule({ id: "u2", role: Role.COMPANY_ADMIN, companyId: "c1" }, "s1", [
        { number: 1, amount: 1000, dueDate: new Date() },
        { number: 1, amount: 1000, dueDate: new Date() },
      ])
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createInstallmentSchedule creates installments for the sale's company", async () => {
    prismaHoisted.prisma.sale.findFirst.mockResolvedValueOnce({ id: "s1", companyId: "c1" });
    prismaHoisted.prisma.installment.count.mockResolvedValueOnce(0);
    prismaHoisted.prisma.installment.createMany.mockResolvedValueOnce({ count: 2 });

    const res = await createInstallmentSchedule(
      { id: "u2", role: Role.COMPANY_ADMIN, companyId: "c1" },
      "s1",
      [
        { number: 1, amount: 1000, dueDate: new Date("2026-04-01") },
        { number: 2, amount: 1000, dueDate: new Date("2026-05-01") },
      ]
    );

    expect(res).toEqual({ count: 2 });
    expect(prismaHoisted.prisma.installment.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          saleId: "s1",
          companyId: "c1",
          number: 1,
          amount: 1000,
          status: InstallmentStatus.DUE,
        }),
        expect.objectContaining({
          saleId: "s1",
          companyId: "c1",
          number: 2,
          amount: 1000,
          status: InstallmentStatus.DUE,
        }),
      ],
    });
  });

  it("markInstallmentPaid blocks paying already paid installment", async () => {
    prismaHoisted.prisma.installment.findFirst.mockResolvedValueOnce({
      id: "i1",
      status: InstallmentStatus.PAID,
      amount: "1000.00",
    });

    await expect(
      markInstallmentPaid({ id: "u2", role: Role.AGENT, companyId: "c1" }, "i1", {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("markInstallmentPaid updates installment as PAID", async () => {
    prismaHoisted.prisma.installment.findFirst.mockResolvedValueOnce({
      id: "i1",
      status: InstallmentStatus.DUE,
      amount: "1000.00",
    });
    prismaHoisted.prisma.installment.update.mockResolvedValueOnce({ id: "i1", status: "PAID" });

    const updated = await markInstallmentPaid(
      { id: "u2", role: Role.AGENT, companyId: "c1" },
      "i1",
      { paidAmount: 1000, method: PaymentMethod.UPI, reference: "TXN123" }
    );

    expect(updated).toEqual({ id: "i1", status: "PAID" });
    expect(prismaHoisted.prisma.installment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "i1" },
        data: expect.objectContaining({
          status: InstallmentStatus.PAID,
          paidAmount: 1000,
          method: PaymentMethod.UPI,
          reference: "TXN123",
          receivedById: "u2",
        }),
      })
    );
  });

  it("waiveInstallment blocks AGENT", async () => {
    await expect(
      waiveInstallment({ id: "u2", role: Role.AGENT, companyId: "c1" }, "i1")
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("getDuesSummary returns aggregated fields", async () => {
    prismaHoisted.prisma.installment.aggregate
      .mockResolvedValueOnce({ _count: { id: 3 }, _sum: { amount: 3000 } })
      .mockResolvedValueOnce({ _count: { id: 1 }, _sum: { amount: 1000 } })
      .mockResolvedValueOnce({ _count: { id: 2 }, _sum: { amount: 2000 } })
      .mockResolvedValueOnce({ _count: { id: 4 }, _sum: { paidAmount: 4000 } });

    const summary = await getDuesSummary({ id: "u2", role: Role.COMPANY_ADMIN, companyId: "c1" });
    expect(summary).toEqual({
      dueCount: 3,
      dueAmount: 3000,
      overdueCount: 1,
      overdueAmount: 1000,
      dueNext7DaysCount: 2,
      dueNext7DaysAmount: 2000,
      paidThisMonthCount: 4,
      paidThisMonthAmount: 4000,
    });
  });
});

