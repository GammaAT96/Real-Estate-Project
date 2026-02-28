import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { AppError } from "../../utils/appError.js";
import { buildTenantFilter } from "../../utils/tenant.util.js";

interface TenantUser {
  id: string;
  role: Role;
  companyId?: string;
}

/* --------------------------------
   CREATE USER
--------------------------------- */
export const createUser = async (
  currentUser: TenantUser,
  username: string,
  password: string,
  role: Role,
  companyId?: string
) => {
  if (currentUser.role === "COMPANY_ADMIN" && role !== "AGENT") {
    throw new AppError("Company admin can only create agents", 403);
  }
  if (currentUser.role === "AGENT") {
    throw new AppError("Agents cannot create users", 403);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role,
      companyId:
        currentUser.role === "SUPER_ADMIN" ? companyId : currentUser.companyId,
      isActive: true,
    },
    select: { id: true, username: true, role: true, companyId: true, createdAt: true },
  });
};

/* --------------------------------
   GET ALL USERS (paginated)
--------------------------------- */
export const getUsers = async (
  currentUser: TenantUser,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;
  const where = { ...buildTenantFilter(currentUser), isActive: true };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, username: true, role: true, companyId: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
};

/* --------------------------------
   GET USER BY ID
--------------------------------- */
export const getUserById = async (currentUser: TenantUser, userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...buildTenantFilter(currentUser), isActive: true },
    select: { id: true, username: true, role: true, companyId: true, createdAt: true },
  });

  if (!user) throw new AppError("User not found", 404);
  return user;
};

/* --------------------------------
   UPDATE USER
--------------------------------- */
export const updateUser = async (
  currentUser: TenantUser,
  userId: string,
  data: { username?: string; password?: string; role?: Role }
) => {
  const existing = await prisma.user.findFirst({
    where: { id: userId, ...buildTenantFilter(currentUser), isActive: true },
  });
  if (!existing) throw new AppError("User not found", 404);

  const updateData: Record<string, unknown> = { ...data };
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, username: true, role: true, companyId: true, createdAt: true },
  });
};

/* --------------------------------
   SOFT DELETE USER (set isActive = false)
--------------------------------- */
export const deleteUser = async (currentUser: TenantUser, userId: string) => {
  if (userId === currentUser.id) {
    throw new AppError("You cannot delete your own account", 400);
  }

  const existing = await prisma.user.findFirst({
    where: { id: userId, ...buildTenantFilter(currentUser), isActive: true },
  });
  if (!existing) throw new AppError("User not found", 404);

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  return { message: "User deactivated successfully" };
};