import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import * as companyController from "./company.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management (SUPER_ADMIN only)
 */

/**
 * @swagger
 * /api/companies:
 *   post:
 *     tags: [Companies]
 *     summary: Create a new company
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sunrise Realty
 *     responses:
 *       201:
 *         description: Company created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Companies]
 *     summary: List all companies
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
 *     responses:
 *       200:
 *         description: List of companies
 */
router.post("/", authenticate, authorizeRoles("SUPER_ADMIN"), companyController.createCompany);
router.get("/", authenticate, authorizeRoles("SUPER_ADMIN"), companyController.getCompanies);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Get company by ID
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
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Not found
 *   put:
 *     tags: [Companies]
 *     summary: Update company
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated company
 *   delete:
 *     tags: [Companies]
 *     summary: Soft-delete a company
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
 *         description: Company deactivated
 */
router.get("/:id", authenticate, authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), companyController.getCompanyById);
router.put("/:id", authenticate, authorizeRoles("SUPER_ADMIN"), companyController.updateCompany);
router.delete("/:id", authenticate, authorizeRoles("SUPER_ADMIN"), companyController.deactivateCompany);

export default router;
