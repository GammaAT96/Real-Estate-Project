import { z } from "zod";

export const createBookingSchema = z.object({
  body: z.object({
    plotId: z.string().uuid(),
    clientName: z.string().min(3),
    bookingAmount: z.number().positive(),
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
