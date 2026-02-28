import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import * as dashboardController from "./dashboard.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Analytics and summary statistics
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get analytics summary (tenant-scoped)
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns aggregated statistics scoped to the authenticated user's company.
 *       SUPER_ADMIN sees global totals across all companies.
 *       COMPANY_ADMIN sees totals for their own company only.
 *     responses:
 *       200:
 *         description: Summary statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCompanies:
 *                   type: integer
 *                   description: Only populated for SUPER_ADMIN
 *                 totalProjects:
 *                   type: integer
 *                 totalPlots:
 *                   type: integer
 *                 availablePlots:
 *                   type: integer
 *                 bookedPlots:
 *                   type: integer
 *                 soldPlots:
 *                   type: integer
 *                 totalSalesCount:
 *                   type: integer
 *                 totalRevenue:
 *                   type: number
 *                   description: Sum of all saleAmount values
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/summary",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"),
  dashboardController.getSummary
);

export default router;
