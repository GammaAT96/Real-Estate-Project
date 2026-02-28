import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().min(2),
    location: z.string().min(2),
    companyId: z.string().uuid().optional(), // SUPER_ADMIN passes this; COMPANY_ADMIN gets it from token
});

export const updateProjectSchema = z.object({
    name: z.string().min(2).optional(),
    location: z.string().min(2).optional()
});