import { Request, Response, NextFunction } from "express";
import * as plotService from "./plot.service.js";
import { createPlotSchema, updatePlotSchema } from "./plot.schema.js";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination.util.js";

export const createPlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createPlotSchema.parse(req.body);
    const plot = await plotService.createPlot(parsed, req.user);
    res.status(201).json(plot);
  } catch (error) {
    next(error);
  }
};

export const getPlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const { plots, total } = await plotService.getPlots(
      req.user,
      page,
      limit,
      skip,
      search,
      status
    );

    res.json({
      success: true,
      data: plots,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getPlotById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plot = await plotService.getPlotById(req.params.id as string, req.user);
    if (!plot) return res.status(404).json({ message: "Plot not found" });
    res.json(plot);
  } catch (error) {
    next(error);
  }
};

export const updatePlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updatePlotSchema.parse(req.body);
    const plot = await plotService.updatePlot(req.params.id as string, parsed, req.user);
    res.json(plot);
  } catch (error) {
    next(error);
  }
};

export const deletePlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await plotService.deletePlot(req.params.id as string, req.user);
    res.json({ message: "Plot deleted successfully" });
  } catch (error) {
    next(error);
  }
};
