import { Request, Response, NextFunction } from "express";
import * as dashboardService from "./dashboard.service.js";

export const getSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const summary = await dashboardService.getSummary(req.user!);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
