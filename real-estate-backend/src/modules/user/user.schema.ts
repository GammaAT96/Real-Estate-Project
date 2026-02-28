import { z } from "zod";

export const createUserSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"]),
    companyId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
    username: z.string().min(3).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(["SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"]).optional(),
});

export const paginationSchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
});