import prisma from "../../config/prisma.js";
import { LeadStatus, Role } from "@prisma/client";
import { AppError } from "../../utils/appError.js";

interface TenantUser {
  id: string;
  role: Role;
  companyId?: string;
}

function buildLeadTenantWhere(currentUser: TenantUser) {
  if (currentUser.role === "SUPER_ADMIN") return {};
  return { companyId: currentUser.companyId };
}

export async function createLead(
  currentUser: TenantUser,
  data: {
    name: string;
    phone: string;
    email?: string;
    source?: string;
    notes?: string;
    projectId?: string;
    plotId?: string;
    assignedToId?: string;
  }
) {
  if (!currentUser.companyId && currentUser.role !== "SUPER_ADMIN") {
    throw new AppError("User not associated with any company", 400);
  }

  const companyId =
    currentUser.role === "SUPER_ADMIN" && data.projectId == null && data.plotId == null
      ? (() => {
          throw new AppError("SUPER_ADMIN must link leads to a project or plot", 400);
        })()
      : currentUser.companyId;

  // Optional: validate project/plot belong to same company when provided
  if (data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, ...buildLeadTenantWhere(currentUser) },
      select: { id: true, companyId: true },
    });
    if (!project) throw new AppError("Project not found or access denied", 404);
  }

  if (data.plotId) {
    const plot = await prisma.plot.findFirst({
      where: {
        id: data.plotId,
        isActive: true,
        project: { ...buildLeadTenantWhere(currentUser) },
      },
      select: { id: true },
    });
    if (!plot) throw new AppError("Plot not found or access denied", 404);
  }

  return prisma.lead.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      source: data.source,
      notes: data.notes,
      companyId: companyId!,
      projectId: data.projectId,
      plotId: data.plotId,
      assignedToId: data.assignedToId ?? currentUser.id,
      status: LeadStatus.NEW,
    },
  });
}

export async function listLeads(
  currentUser: TenantUser,
  opts: { status?: LeadStatus; assignedToId?: string; projectId?: string; search?: string }
) {
  const where: any = { ...buildLeadTenantWhere(currentUser) };

  if (opts.status) where.status = opts.status;
  if (opts.projectId) where.projectId = opts.projectId;

  if (opts.assignedToId) {
    where.assignedToId = opts.assignedToId;
  } else if (currentUser.role === "AGENT") {
    // Agents by default see only their own leads
    where.assignedToId = currentUser.id;
  }

  if (opts.search) {
    const q = opts.search;
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      project: true,
      plot: { include: { project: true } },
      assignedTo: { select: { id: true, username: true, role: true } },
    },
  });
}

export async function getLead(currentUser: TenantUser, id: string) {
  const lead = await prisma.lead.findFirst({
    where: { id, ...buildLeadTenantWhere(currentUser) },
    include: {
      project: true,
      plot: { include: { project: true } },
      assignedTo: { select: { id: true, username: true, role: true } },
    },
  });

  if (!lead) throw new AppError("Lead not found", 404);
  return lead;
}

export async function updateLead(
  currentUser: TenantUser,
  id: string,
  data: Partial<{
    name: string;
    phone: string;
    email?: string;
    source?: string;
    notes?: string;
    status: LeadStatus;
    projectId?: string | null;
    plotId?: string | null;
    assignedToId?: string | null;
  }>
) {
  const existing = await prisma.lead.findFirst({
    where: { id, ...buildLeadTenantWhere(currentUser) },
  });
  if (!existing) throw new AppError("Lead not found", 404);

  if (currentUser.role === "AGENT" && data.status && data.status === LeadStatus.WON) {
    // Example of a business rule you can tighten later
  }

  return prisma.lead.update({
    where: { id },
    data,
  });
}

export async function deleteLead(currentUser: TenantUser, id: string) {
  const existing = await prisma.lead.findFirst({
    where: { id, ...buildLeadTenantWhere(currentUser) },
  });
  if (!existing) throw new AppError("Lead not found", 404);

  await prisma.lead.delete({ where: { id } });
  return { message: "Lead deleted successfully" };
}

