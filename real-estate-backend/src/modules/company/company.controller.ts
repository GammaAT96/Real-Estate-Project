import { Request, Response, NextFunction } from "express";
import * as companyService from "./company.service.js";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination.util.js";

export const createCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name } = req.body;
        const company = await companyService.createCompany(req.user!, name);
        res.status(201).json(company);
    } catch (error) {
        next(error);
    }
};

export const getCompanies = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { page, limit, skip } = parsePagination(req);
        const search = req.query.search as string | undefined;

        const { companies, total } = await companyService.getCompanies(
            req.user!,
            page,
            limit,
            skip,
            search
        );

        res.json({
            success: true,
            data: companies,
            pagination: buildPaginationMeta(total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

export const getCompanyById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = req.params.id as string;
        const company = await companyService.getCompanyById(req.user!, id);
        res.json(company);
    } catch (error) {
        next(error);
    }
};

export const updateCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = req.params.id as string;
        const { name } = req.body;
        const company = await companyService.updateCompany(req.user!, id, name);
        res.json(company);
    } catch (error) {
        next(error);
    }
};

export const deactivateCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = req.params.id as string;
        const result = await companyService.deactivateCompany(req.user!, id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
