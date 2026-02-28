import { Request } from "express";

export interface PaginationQuery {
    page: number;
    limit: number;
    skip: number;
}

export const parsePagination = (req: Request): PaginationQuery => {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(
        Math.max(parseInt(req.query.limit as string) || 10, 1),
        100
    );

    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

export const buildPaginationMeta = (
    total: number,
    page: number,
    limit: number
) => {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};