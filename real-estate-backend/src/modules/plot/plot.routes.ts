import { Router } from "express";
import { createPlot, getPlots, getPlotById, updatePlot, deletePlot } from "./plot.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Plots
 *   description: Plot management within projects
 */

/**
 * @swagger
 * /api/plots:
 *   post:
 *     tags: [Plots]
 *     summary: Create a plot
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, plotNumber, area, price]
 *             properties:
 *               projectId:
 *                 type: string
 *                 format: uuid
 *               plotNumber:
 *                 type: string
 *                 example: A-101
 *               area:
 *                 type: number
 *                 example: 200.5
 *               price:
 *                 type: number
 *                 example: 500000
 *     responses:
 *       201:
 *         description: Plot created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Plot'
 *   get:
 *     tags: [Plots]
 *     summary: List plots (tenant-scoped, paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, BOOKED, SOLD]
 *     responses:
 *       200:
 *         description: Paginated list of plots
 */
router.post("/", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), createPlot);
router.get("/", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"), getPlots);

/**
 * @swagger
 * /api/plots/{id}:
 *   get:
 *     tags: [Plots]
 *     summary: Get plot by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plot details
 *       404:
 *         description: Not found
 *   put:
 *     tags: [Plots]
 *     summary: Update a plot
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plotNumber:
 *                 type: string
 *               area:
 *                 type: number
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated plot
 *   delete:
 *     tags: [Plots]
 *     summary: Soft-delete a plot (cannot delete if sold)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plot deleted
 */
router.get("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"), getPlotById);
router.put("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), updatePlot);
router.delete("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), deletePlot);

export default router;
