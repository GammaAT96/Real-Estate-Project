import { z } from "zod";

export const createInstallmentScheduleSchema = z.object({
  params: z.object({
    saleId: z.string().uuid(),
  }),
  body: z.object({
    installments: z
      .array(
        z.object({
          number: z.coerce.number().int().positive(),
          amount: z.coerce.number().positive(),
          dueDate: z.coerce.date(),
        })
      )
      .min(1),
  }),
});

export const listInstallmentsSchema = z.object({
  query: z.object({
    status: z.enum(["DUE", "PAID", "WAIVED"]).optional(),
    saleId: z.string().uuid().optional(),
    from: z.string().optional(), // yyyy-mm-dd
    to: z.string().optional(), // yyyy-mm-dd
    overdue: z
      .string()
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
  }),
});

export const markInstallmentPaidSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    paidAmount: z.coerce.number().positive().optional(),
    paidAt: z.coerce.date().optional(),
    method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "CARD", "OTHER"]).optional(),
    reference: z.string().trim().min(1).max(191).optional(),
  }),
});

export const waiveInstallmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    reason: z.string().trim().min(1).max(191).optional(),
  }),
});

