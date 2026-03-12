import { describe, expect, it, vi } from "vitest";
import { AppError } from "../../utils/appError.js";
import { BookingStatus, PlotStatus, Role } from "@prisma/client";

const { tx } = vi.hoisted(() => {
  const innerTx = {
    plot: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    booking: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return { tx: innerTx };
});

vi.mock("../../config/prisma.js", () => ({
  default: {
    $transaction: vi.fn(async (cb: any) => cb(tx)),
  },
}));

import { cancelBooking, createBooking } from "./booking.service.js";

describe("booking.service", () => {
  it("createBooking blocks SUPER_ADMIN", async () => {
    await expect(
      createBooking({ id: "u1", role: Role.SUPER_ADMIN }, "p1", "Rahul", 50000)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("createBooking 404 when plot missing / access denied", async () => {
    tx.plot.findFirst.mockResolvedValueOnce(null);

    await expect(
      createBooking({ id: "u2", role: Role.AGENT, companyId: "c1" }, "p1", "Rahul", 50000)
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      createBooking({ id: "u2", role: Role.AGENT, companyId: "c1" }, "p1", "Rahul", 50000)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("createBooking 400 when plot not AVAILABLE", async () => {
    tx.plot.findFirst.mockResolvedValueOnce({ id: "p1", status: PlotStatus.BOOKED });

    await expect(
      createBooking({ id: "u2", role: Role.AGENT, companyId: "c1" }, "p1", "Rahul", 50000)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createBooking creates booking and marks plot BOOKED", async () => {
    tx.plot.findFirst.mockResolvedValueOnce({ id: "p1", status: PlotStatus.AVAILABLE });
    tx.booking.create.mockResolvedValueOnce({ id: "b1" });
    tx.plot.update.mockResolvedValueOnce({ id: "p1", status: PlotStatus.BOOKED });

    const booking = await createBooking(
      { id: "u2", role: Role.AGENT, companyId: "c1" },
      "p1",
      "Rahul",
      50000
    );

    expect(booking).toEqual({ id: "b1" });
    expect(tx.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plotId: "p1",
          clientName: "Rahul",
          bookingAmount: 50000,
          agentId: "u2",
          status: BookingStatus.ACTIVE,
        }),
      })
    );
    expect(tx.plot.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: PlotStatus.BOOKED },
    });
  });

  it("cancelBooking 404 when booking missing", async () => {
    tx.booking.findUnique.mockResolvedValueOnce(null);

    await expect(
      cancelBooking({ id: "u2", role: Role.AGENT, companyId: "c1" }, "b1")
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("cancelBooking 403 when tenant mismatch (non super admin)", async () => {
    tx.booking.findUnique.mockResolvedValueOnce({
      id: "b1",
      status: BookingStatus.ACTIVE,
      plotId: "p1",
      plot: { project: { companyId: "other" } },
    });

    await expect(
      cancelBooking({ id: "u2", role: Role.AGENT, companyId: "c1" }, "b1")
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("cancelBooking 400 when already cancelled", async () => {
    tx.booking.findUnique.mockResolvedValueOnce({
      id: "b1",
      status: BookingStatus.CANCELLED,
      plotId: "p1",
      plot: { project: { companyId: "c1" } },
    });

    await expect(
      cancelBooking({ id: "u2", role: Role.AGENT, companyId: "c1" }, "b1")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("cancelBooking marks booking CANCELLED and plot AVAILABLE", async () => {
    tx.booking.findUnique.mockResolvedValueOnce({
      id: "b1",
      status: BookingStatus.ACTIVE,
      plotId: "p1",
      plot: { project: { companyId: "c1" } },
    });
    tx.booking.update.mockResolvedValueOnce({ id: "b1", status: BookingStatus.CANCELLED });
    tx.plot.update.mockResolvedValueOnce({ id: "p1", status: PlotStatus.AVAILABLE });

    const res = await cancelBooking({ id: "u2", role: Role.AGENT, companyId: "c1" }, "b1");
    expect(res).toEqual({ message: "Booking cancelled successfully" });
    expect(tx.booking.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { status: BookingStatus.CANCELLED },
    });
    expect(tx.plot.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: PlotStatus.AVAILABLE },
    });
  });
});

