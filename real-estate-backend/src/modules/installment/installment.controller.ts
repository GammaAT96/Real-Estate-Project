import { Request, Response, NextFunction } from "express";
import * as installmentService from "./installment.service.js";
import {
  createInstallmentScheduleSchema,
  listInstallmentsSchema,
  markInstallmentPaidSchema,
  waiveInstallmentSchema,
} from "./installment.schema.js";

export async function createSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createInstallmentScheduleSchema.parse({
      params: req.params,
      body: req.body,
    });

    const result = await installmentService.createInstallmentSchedule(
      req.user!,
      parsed.params.saleId,
      parsed.body.installments
    );

    res.status(201).json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listInstallmentsSchema.parse({ query: req.query });
    const installments = await installmentService.listInstallments(req.user!, {
      status: parsed.query.status as any,
      saleId: parsed.query.saleId,
      from: parsed.query.from,
      to: parsed.query.to,
      overdue: parsed.query.overdue as any,
    });
    res.json({ success: true, data: installments });
  } catch (e) {
    next(e);
  }
}

export async function markPaid(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = markInstallmentPaidSchema.parse({
      params: req.params,
      body: req.body,
    });

    const updated = await installmentService.markInstallmentPaid(req.user!, parsed.params.id, {
      paidAmount: parsed.body.paidAmount,
      paidAt: parsed.body.paidAt,
      method: parsed.body.method as any,
      reference: parsed.body.reference,
    });

    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
}

export async function waive(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = waiveInstallmentSchema.parse({ params: req.params, body: req.body });
    const updated = await installmentService.waiveInstallment(req.user!, parsed.params.id);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
}

export async function duesSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await installmentService.getDuesSummary(req.user!);
    res.json({ success: true, data: summary });
  } catch (e) {
    next(e);
  }
}

