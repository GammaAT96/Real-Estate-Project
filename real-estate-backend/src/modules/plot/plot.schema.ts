import { z } from "zod";

export const createPlotSchema = z.object({
    projectId: z.string().uuid(),
    plotNumber: z.string(),
    area: z.coerce.number().positive(),
    price: z.coerce.number().positive()
});

export const updatePlotSchema = z.object({
    plotNumber: z.string().optional(),
    area: z.coerce.number().positive().optional(),
    price: z.coerce.number().positive().optional()
});