import { Request, Response, NextFunction } from "express";
import * as saleService from "./sale.service.js";
import { createSaleSchema, updateSaleSchema } from "./sale.schema.js";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination.util.js";

export const createSale = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { plotId, saleAmount } = createSaleSchema.parse(req.body);
    const sale = await saleService.createSale(req.user!, plotId, saleAmount);
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

export const getSales = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const { sales, total } = await saleService.getSales(
      req.user!,
      page,
      limit,
      skip,
      from,
      to
    );

    res.json({
      success: true,
      data: sales,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getSaleById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const sale = await saleService.getSaleById(req.user!, id);
    res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

export const updateSale = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const { saleAmount } = updateSaleSchema.parse(req.body);
    const sale = await saleService.updateSale(req.user!, id, saleAmount!);
    res.json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

export const deleteSale = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const result = await saleService.deleteSale(req.user!, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};