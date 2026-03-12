import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as installmentController from "./installment.controller.js";
import {
  createInstallmentScheduleSchema,
  listInstallmentsSchema,
  markInstallmentPaidSchema,
  waiveInstallmentSchema,
} from "./installment.schema.js";

const router = Router();
router.use(authenticate);

// Create schedule for a sale
router.post(
  "/sales/:saleId/installments",
  authorizeRoles("COMPANY_ADMIN", "AGENT"),
  validate(createInstallmentScheduleSchema),
  installmentController.createSchedule
);

// List installments (filters: status, saleId, date range, overdue)
router.get(
  "/installments",
  authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"),
  validate(listInstallmentsSchema),
  installmentController.list
);

// Mark paid
router.patch(
  "/installments/:id/pay",
  authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"),
  validate(markInstallmentPaidSchema),
  installmentController.markPaid
);

// Waive
router.patch(
  "/installments/:id/waive",
  authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"),
  validate(waiveInstallmentSchema),
  installmentController.waive
);

// Dues summary (dashboard)
router.get(
  "/dues/summary",
  authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"),
  installmentController.duesSummary
);

export default router;

