import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import * as userController from "./user.controller.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management within a company
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (COMPANY_ADMIN or AGENT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, role]
 *             properties:
 *               username:
 *                 type: string
 *                 example: agent_ravi
 *               password:
 *                 type: string
 *                 example: securepass123
 *               role:
 *                 type: string
 *                 enum: [COMPANY_ADMIN, AGENT]
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *   get:
 *     tags: [Users]
 *     summary: List users (tenant-scoped, paginated)
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
 *         description: Paginated list of users
 */
router.post("/", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), userController.createUser);
router.get("/", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), userController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
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
 *         description: User details
 *       404:
 *         description: Not found
 *   put:
 *     tags: [Users]
 *     summary: Update user
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
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [COMPANY_ADMIN, AGENT]
 *     responses:
 *       200:
 *         description: Updated user
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete a user
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
 *         description: User deactivated
 */
router.get("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), userController.getUserById);
router.put("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), userController.updateUser);
router.delete("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), userController.deleteUser);

export default router;