import { z } from "zod";

export const createSaleSchema = z.object({
    plotId: z.string().uuid(),
    saleAmount: z.coerce.number().positive()
});

export const updateSaleSchema = z.object({
    saleAmount: z.coerce.number().positive().optional()
});