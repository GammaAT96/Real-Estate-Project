import { Request, Response, NextFunction } from "express";
import * as bookingService from "./booking.service.js";

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { plotId, clientName, bookingAmount } = req.body;

    const booking = await bookingService.createBooking(
      req.user!,
      plotId,
      clientName,
      bookingAmount
    );

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const bookingId = req.params.id as string;

const result = await bookingService.cancelBooking(
  req.user!,
  bookingId
);


    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
