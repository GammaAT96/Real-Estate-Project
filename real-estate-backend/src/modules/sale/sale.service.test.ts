import { describe, expect, it, vi } from "vitest";
import { BookingStatus, PlotStatus, Role } from "@prisma/client";
import { AppError } from "../../utils/appError.js";

const { tx } = vi.hoisted(() => {
  const innerTx = {
    plot: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    sale: {
      create: vi.fn(),
    },
  };
  return { tx: innerTx };
});

vi.mock("../../config/prisma.js", () => ({
  default: {
    $transaction: vi.fn(async (cb: any) => cb(tx)),
    sale: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { createSale } from "./sale.service.js";

describe("sale.service", () => {
  it("createSale blocks SUPER_ADMIN", async () => {
    await expect(createSale({ id: "u1", role: Role.SUPER_ADMIN }, "p1", 1500000)).rejects.toMatchObject(
      { statusCode: 403 }
    );
  });

  it("createSale 404 when plot missing / access denied", async () => {
    tx.plot.findFirst.mockResolvedValueOnce(null);

    await expect(
      createSale({ id: "u2", role: Role.AGENT, companyId: "c1" }, "p1", 1500000)
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      createSale({ id: "u2", role: Role.AGENT, companyId: "c1" }, "p1", 1500000)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("createSale 400 when plot not BOOKED", async () => {
    tx.plot.findFirst.mockResolvedValueOnce({
      id: "p1",
      status: PlotStatus.AVAILABLE,
      bookings: [],
    });

    await expect(
      createSale({ id: "u2", role: Role.AGENT, companyId: "c1" }, "p1", 1500000)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createSale 400 when no active booking exists", async () => {
    tx.plot.findFirst.mockResolvedValueOnce({
      id: "p1",
      status: PlotStatus.BOOKED,
      bookings: [{ status: BookingStatus.CANCELLED }],
    });

    await expect(
      createSale({ id: "u2", role: Role.AGENT, companyId: "c1" }, "p1", 1500000)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createSale creates sale and marks plot SOLD", async () => {
    tx.plot.findFirst.mockResolvedValueOnce({
      id: "p1",
      status: PlotStatus.BOOKED,
      bookings: [{ status: BookingStatus.ACTIVE }],
    });
    tx.sale.create.mockResolvedValueOnce({ id: "s1" });
    tx.plot.update.mockResolvedValueOnce({ id: "p1", status: PlotStatus.SOLD });

    const sale = await createSale(
      { id: "u2", role: Role.AGENT, companyId: "c1" },
      "p1",
      1500000
    );

    expect(sale).toEqual({ id: "s1" });
    expect(tx.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plotId: "p1",
          agentId: "u2",
          companyId: "c1",
          saleAmount: 1500000,
        }),
      })
    );
    expect(tx.plot.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: PlotStatus.SOLD },
    });
  });
});

