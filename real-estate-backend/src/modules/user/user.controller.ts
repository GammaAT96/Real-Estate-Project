import { Request, Response, NextFunction } from "express";
import * as userService from "./user.service.js";
import { createUserSchema, updateUserSchema, paginationSchema } from "./user.schema.js";
import { Role } from "@prisma/client";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password, role, companyId } = createUserSchema.parse(req.body);
    const user = await userService.createUser(
      req.user!,
      username,
      password,
      role as Role,
      companyId
    );
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = "1", limit = "10" } = paginationSchema.parse(req.query);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const { users, total } = await userService.getUsers(req.user!, pageNum, limitNum);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const user = await userService.getUserById(req.user!, id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const data = updateUserSchema.parse(req.body);
    const user = await userService.updateUser(req.user!, id, data as { username?: string; password?: string; role?: Role });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const result = await userService.deleteUser(req.user!, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};