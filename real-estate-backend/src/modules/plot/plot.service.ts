import prisma from "../../config/prisma.js";
import { buildTenantFilter } from "../../utils/tenant.util.js";

// Build the nested company filter for plots (via project.companyId)
// SUPER_ADMIN gets no filter (sees all); others scoped to their company
const buildPlotCompanyFilter = (currentUser: any) => {
  if (currentUser.role === "SUPER_ADMIN") return {};
  return { project: { companyId: currentUser.companyId } };
};

export const createPlot = async (data: any, currentUser: any) => {
  // Validate the project exists. SUPER_ADMIN can create plots in any project.
  const projectWhere: any = { id: data.projectId, isActive: true };
  if (currentUser.role !== "SUPER_ADMIN") {
    projectWhere.companyId = currentUser.companyId;
  }

  const project = await prisma.project.findFirst({ where: projectWhere });
  if (!project) throw new Error("Project not found");

  return prisma.plot.create({ data });
};

export const getPlots = async (
  currentUser: any,
  page: number,
  limit: number,
  skip: number,
  search?: string,
  status?: string
) => {
  const companyFilter = buildPlotCompanyFilter(currentUser);
  const where: any = { ...companyFilter, isActive: true };

  if (search) where.plotNumber = { contains: search };
  if (status) where.status = status;

  const [plots, total] = await Promise.all([
    prisma.plot.findMany({
      where,
      skip,
      take: limit,
      include: { project: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.plot.count({ where })
  ]);

  return { plots, total };
};

export const getPlotById = async (id: string, currentUser: any) => {
  const companyFilter = buildPlotCompanyFilter(currentUser);
  return prisma.plot.findFirst({
    where: { id, ...companyFilter, isActive: true },
    include: { project: true }
  });
};

export const updatePlot = async (id: string, data: any, currentUser: any) => {
  const companyFilter = buildPlotCompanyFilter(currentUser);
  const plot = await prisma.plot.findFirst({
    where: { id, ...companyFilter, isActive: true }
  });
  if (!plot) throw new Error("Plot not found");
  return prisma.plot.update({ where: { id }, data });
};

export const deletePlot = async (id: string, currentUser: any) => {
  const companyFilter = buildPlotCompanyFilter(currentUser);
  const plot = await prisma.plot.findFirst({
    where: { id, ...companyFilter, isActive: true }
  });
  if (!plot) throw new Error("Plot not found");

  const hasSale = await prisma.sale.findFirst({ where: { plotId: id, isActive: true } });
  if (hasSale) throw new Error("Cannot delete sold plot");

  return prisma.plot.update({ where: { id }, data: { isActive: false } });
};