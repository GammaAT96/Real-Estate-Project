import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as leadController from "./lead.controller.js";
import { createLeadSchema, listLeadsSchema, updateLeadSchema } from "./lead.schema.js";

const router = Router();
router.use(authenticate);

// Create lead
router.post(
  "/leads",
  authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"),
  validate(createLeadSchema),
  leadController.createLead
);

// List leads
router.get(
  "/leads",
  authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"),
  validate(listLeadsSchema),
  leadController.listLeads
);

// Get one
router.get(
  "/leads/:id",
  authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"),
  leadController.getLead
);

// Update (status / assignment / details)
router.put(
  "/leads/:id",
  authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN", "AGENT"),
  validate(updateLeadSchema),
  leadController.updateLead
);

// Delete
router.delete(
  "/leads/:id",
  authorizeRoles("SUPER_ADMIN", "COMPANY_ADMIN"),
  leadController.deleteLead
);

export default router;

