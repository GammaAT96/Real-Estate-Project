import { Router } from "express";
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from "./project.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management within a company
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Green Valley
 *               location:
 *                 type: string
 *                 example: Sector 14, Gurugram
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *   get:
 *     tags: [Projects]
 *     summary: List projects (tenant-scoped)
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
 *         description: Paginated list of projects
 */
router.post("/", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), createProject);
router.get("/", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), getProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project by ID
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
 *         description: Project details
 *       404:
 *         description: Not found
 *   put:
 *     tags: [Projects]
 *     summary: Update a project
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
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated project
 *   delete:
 *     tags: [Projects]
 *     summary: Soft-delete a project
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
 *         description: Deleted
 */
router.get("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), getProjectById);
router.put("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), updateProject);
router.delete("/:id", authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"), deleteProject);

export default router;