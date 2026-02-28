import prisma from "../../config/prisma.js";
import { buildTenantFilter } from "../../utils/tenant.util.js";

export const createProject = async (data: any, currentUser: any) => {
  // SUPER_ADMIN can pass companyId in body; others always use their own companyId
  const companyId = currentUser.role === "SUPER_ADMIN"
    ? data.companyId
    : currentUser.companyId;

  return prisma.project.create({
    data: {
      name: data.name,
      location: data.location,
      companyId,
    }
  });
};

export const getProjects = async (
  currentUser: any,
  page: number,
  limit: number,
  skip: number,
  search?: string
) => {
  // SUPER_ADMIN sees all projects; others see only their company's
  const tenantFilter = buildTenantFilter(currentUser);
  const where: any = {
    ...tenantFilter,
    isActive: true
  };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { location: { contains: search } }
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.project.count({ where })
  ]);

  return { projects, total };
};

export const getProjectById = async (id: string, currentUser: any) => {
  const tenantFilter = buildTenantFilter(currentUser);
  return prisma.project.findFirst({
    where: {
      id,
      ...tenantFilter,
      isActive: true
    }
  });
};

export const updateProject = async (
  id: string,
  data: any,
  currentUser: any
) => {
  const project = await getProjectById(id, currentUser);
  if (!project) throw new Error("Project not found");

  return prisma.project.update({
    where: { id },
    data
  });
};

export const deleteProject = async (id: string, currentUser: any) => {
  const project = await getProjectById(id, currentUser);
  if (!project) throw new Error("Project not found");

  return prisma.project.update({
    where: { id },
    data: { isActive: false }
  });
};