import { Request, Response, NextFunction } from "express";
import * as leadService from "./lead.service.js";
import { createLeadSchema, listLeadsSchema, updateLeadSchema } from "./lead.schema.js";

export async function createLead(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createLeadSchema.parse({ body: req.body });
    const lead = await leadService.createLead(req.user!, parsed.body);
    res.status(201).json({ success: true, data: lead });
  } catch (e) {
    next(e);
  }
}

export async function listLeads(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listLeadsSchema.parse({ query: req.query });
    const leads = await leadService.listLeads(req.user!, {
      status: parsed.query.status as any,
      assignedToId: parsed.query.assignedToId,
      projectId: parsed.query.projectId,
      search: parsed.query.search,
    });
    res.json({ success: true, data: leads });
  } catch (e) {
    next(e);
  }
}

export async function getLead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const lead = await leadService.getLead(req.user!, id);
    res.json({ success: true, data: lead });
  } catch (e) {
    next(e);
  }
}

export async function updateLead(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateLeadSchema.parse({ params: req.params, body: req.body });
    const lead = await leadService.updateLead(req.user!, parsed.params.id, parsed.body as any);
    res.json({ success: true, data: lead });
  } catch (e) {
    next(e);
  }
}

export async function deleteLead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    const result = await leadService.deleteLead(req.user!, id);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

