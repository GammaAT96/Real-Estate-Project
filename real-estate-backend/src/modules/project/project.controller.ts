import { Request, Response, NextFunction } from "express";
import * as projectService from "./project.service.js";
import {
  createProjectSchema,
  updateProjectSchema
} from "./project.schema.js";
import {
  parsePagination,
  buildPaginationMeta
} from "../../utils/pagination.util.js";

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createProjectSchema.parse(req.body);
    const project = await projectService.createProject(parsed, req.user);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const search = req.query.search as string | undefined;

    const { projects, total } =
      await projectService.getProjects(
        req.user,
        page,
        limit,
        skip,
        search
      );

    res.json({
      data: projects,
      pagination: buildPaginationMeta(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.getProjectById(req.params.id as string, req.user);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateProjectSchema.parse(req.body);
    const project = await projectService.updateProject(req.params.id as string, parsed, req.user);
    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await projectService.deleteProject(req.params.id as string, req.user);
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    next(error);
  }
};