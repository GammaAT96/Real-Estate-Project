import prisma from "../../config/prisma.js";
import { Role, PlotStatus, BookingStatus } from "@prisma/client";
import { AppError } from "../../utils/appError.js";
import { buildTenantFilter } from "../../utils/tenant.util.js";

interface TenantUser {
  id: string;
  role: Role;
  companyId?: string;
}

/* -----------------------------
   CREATE BOOKING (Transactional)
------------------------------ */

export const createBooking = async (
  currentUser: TenantUser,
  plotId: string,
  clientName: string,
  bookingAmount: number
) => {
  if (currentUser.role === "SUPER_ADMIN") {
    throw new AppError("Super admin cannot create booking", 403);
  }

  return prisma.$transaction(async (tx) => {
    const plot = await tx.plot.findFirst({
      where: {
        id: plotId,
        isActive: true,
        project: {
          ...buildTenantFilter(currentUser),
        },
      },
    });

    if (!plot) {
      throw new AppError("Plot not found or access denied", 404);
    }

    if (plot.status !== PlotStatus.AVAILABLE) {
      throw new AppError("Plot is not available for booking", 400);
    }

    const booking = await tx.booking.create({
      data: {
        plotId,
        clientName,
        bookingAmount,
        agentId: currentUser.id,
        status: BookingStatus.ACTIVE,
      },
    });

    await tx.plot.update({
      where: { id: plotId },
      data: { status: PlotStatus.BOOKED },
    });

    return booking;
  });
};

/* -----------------------------
   CANCEL BOOKING (Transactional)
------------------------------ */

export const cancelBooking = async (
  currentUser: TenantUser,
  bookingId: string
) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        plot: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (
      currentUser.role !== "SUPER_ADMIN" &&
      booking.plot.project.companyId !== currentUser.companyId
    ) {
      throw new AppError("Access denied", 403);
    }

    if (booking.status !== BookingStatus.ACTIVE) {
      throw new AppError("Booking already cancelled", 400);
    }

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    await tx.plot.update({
      where: { id: booking.plotId },
      data: { status: PlotStatus.AVAILABLE },
    });

    return { message: "Booking cancelled successfully" };
  });
};
