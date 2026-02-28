import prisma from "../../config/prisma.js";
import { Role } from "@prisma/client";
import { AppError } from "../../utils/appError.js";

interface TenantUser {
    id: string;
    role: Role;
    companyId?: string;
}

/* --------------------------------
   CREATE COMPANY (SUPER_ADMIN only)
--------------------------------- */
export const createCompany = async (
    currentUser: TenantUser,
    name: string
) => {
    if (currentUser.role !== "SUPER_ADMIN") {
        throw new AppError("Only Super Admin can create companies", 403);
    }

    return prisma.company.create({
        data: {
            name,
            isActive: true,
        },
    });
};

/* --------------------------------
   GET ALL COMPANIES
--------------------------------- */
export const getCompanies = async (
    currentUser: TenantUser,
    page: number,
    limit: number,
    skip: number,
    search?: string
) => {
    if (currentUser.role !== "SUPER_ADMIN") {
        throw new AppError("Only Super Admin can view all companies", 403);
    }

    const where: any = { isActive: true };
    if (search) {
        where.name = { contains: search };
    }

    const [companies, total] = await Promise.all([
        prisma.company.findMany({
            where,
            skip,
            take: limit,
            include: {
                _count: {
                    select: { users: true, projects: true },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.company.count({ where }),
    ]);

    return { companies, total };
};

/* --------------------------------
   GET SINGLE COMPANY BY ID
--------------------------------- */
export const getCompanyById = async (
    currentUser: TenantUser,
    companyId: string
) => {
    // SUPER_ADMIN can view any; COMPANY_ADMIN can only view their own
    if (
        currentUser.role !== "SUPER_ADMIN" &&
        currentUser.companyId !== companyId
    ) {
        throw new AppError("Access denied", 403);
    }

    const company = await prisma.company.findFirst({
        where: { id: companyId, isActive: true },
        include: {
            users: {
                where: { isActive: true },
                select: { id: true, username: true, role: true, createdAt: true },
            },
            projects: {
                where: { isActive: true },
                select: { id: true, name: true, location: true, status: true, createdAt: true },
            },
        },
    });

    if (!company) {
        throw new AppError("Company not found", 404);
    }

    return company;
};

/* --------------------------------
   UPDATE COMPANY (SUPER_ADMIN only)
--------------------------------- */
export const updateCompany = async (
    currentUser: TenantUser,
    companyId: string,
    name: string
) => {
    if (currentUser.role !== "SUPER_ADMIN") {
        throw new AppError("Only Super Admin can update companies", 403);
    }

    const company = await prisma.company.findFirst({
        where: { id: companyId, isActive: true },
    });

    if (!company) {
        throw new AppError("Company not found", 404);
    }

    return prisma.company.update({
        where: { id: companyId },
        data: { name },
    });
};

/* --------------------------------
   DEACTIVATE COMPANY (SUPER_ADMIN only)
--------------------------------- */
export const deactivateCompany = async (
    currentUser: TenantUser,
    companyId: string
) => {
    if (currentUser.role !== "SUPER_ADMIN") {
        throw new AppError("Only Super Admin can deactivate companies", 403);
    }

    const company = await prisma.company.findFirst({
        where: { id: companyId, isActive: true },
    });

    if (!company) {
        throw new AppError("Company not found", 404);
    }

    await prisma.company.update({
        where: { id: companyId },
        data: { isActive: false },
    });

    return { message: "Company deactivated successfully" };
};
