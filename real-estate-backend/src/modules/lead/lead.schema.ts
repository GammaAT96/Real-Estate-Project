import { z } from "zod";

export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(5),
    email: z.string().email().optional(),
    source: z.string().max(191).optional(),
    notes: z.string().optional(),
    projectId: z.string().uuid().optional(),
    plotId: z.string().uuid().optional(),
    assignedToId: z.string().uuid().optional(),
  }),
});

export const updateLeadSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(5).optional(),
    email: z.string().email().optional(),
    source: z.string().max(191).optional(),
    notes: z.string().optional(),
    status: z
      .enum(["NEW", "CONTACTED", "VISIT_SCHEDULED", "NEGOTIATION", "WON", "LOST"])
      .optional(),
    projectId: z.string().uuid().optional().nullable(),
    plotId: z.string().uuid().optional().nullable(),
    assignedToId: z.string().uuid().optional().nullable(),
  }),
});

export const listLeadsSchema = z.object({
  query: z.object({
    status: z
      .enum(["NEW", "CONTACTED", "VISIT_SCHEDULED", "NEGOTIATION", "WON", "LOST"])
      .optional(),
    assignedToId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    search: z.string().optional(),
  }),
});

