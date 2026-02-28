import { Router } from "express";
import { createSale, getSales, getSaleById, updateSale, deleteSale } from "./sale.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sale management — convert booked plots to sold
 */

/**
 * @swagger
 * /api/sales:
 *   post:
 *     tags: [Sales]
 *     summary: Create a sale (plot must be BOOKED first)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plotId, saleAmount]
 *             properties:
 *               plotId:
 *                 type: string
 *                 format: uuid
 *               saleAmount:
 *                 type: number
 *                 example: 1500000
 *     responses:
 *       201:
 *         description: Sale created, plot status → SOLD
 *       400:
 *         description: Plot not in BOOKED state
 *   get:
 *     tags: [Sales]
 *     summary: List sales (paginated, date filterable)
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
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-12-31"
 *     responses:
 *       200:
 *         description: Paginated list of sales
 */
router.post("/", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"), createSale);
router.get("/", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), getSales);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     tags: [Sales]
 *     summary: Get sale by ID
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
 *         description: Sale details
 *       404:
 *         description: Not found
 *   put:
 *     tags: [Sales]
 *     summary: Update sale amount
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
 *               saleAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated sale
 *   delete:
 *     tags: [Sales]
 *     summary: Soft-delete a sale
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
 *         description: Sale deleted
 */
router.get("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), getSaleById);
router.put("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), updateSale);
router.delete("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), deleteSale);

export default router;