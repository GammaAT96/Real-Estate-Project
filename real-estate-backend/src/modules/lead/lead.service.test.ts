import { describe, expect, it, vi } from "vitest";
import { LeadStatus, Role } from "@prisma/client";
import { AppError } from "../../utils/appError.js";

const prismaHoisted = vi.hoisted(() => {
  const prisma = {
    project: {
      findFirst: vi.fn(),
    },
    plot: {
      findFirst: vi.fn(),
    },
    lead: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { prisma };
});

vi.mock("../../config/prisma.js", () => ({
  default: prismaHoisted.prisma,
}));

import { createLead, deleteLead, getLead, listLeads, updateLead } from "./lead.service.js";

describe("lead.service", () => {
  it("createLead rejects when user has no company (non-super-admin)", async () => {
    await expect(
      createLead({ id: "u1", role: Role.COMPANY_ADMIN }, { name: "A", phone: "99999" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createLead validates project ownership", async () => {
    prismaHoisted.prisma.project.findFirst.mockResolvedValueOnce(null);

    await expect(
      createLead(
        { id: "u1", role: Role.COMPANY_ADMIN, companyId: "c1" },
        { name: "A", phone: "99999", projectId: "p1" }
      )
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("createLead succeeds with minimal data", async () => {
    prismaHoisted.prisma.project.findFirst.mockResolvedValue(null);
    prismaHoisted.prisma.plot.findFirst.mockResolvedValue(null);
    prismaHoisted.prisma.lead.create.mockResolvedValue({ id: "l1", name: "A" });

    const lead = await createLead(
      { id: "u1", role: Role.COMPANY_ADMIN, companyId: "c1" },
      { name: "A", phone: "99999" }
    );

    expect(lead).toEqual({ id: "l1", name: "A" });
    expect(prismaHoisted.prisma.lead.create).toHaveBeenCalled();
  });

  it("listLeads scopes agents to their own leads", async () => {
    prismaHoisted.prisma.lead.findMany.mockResolvedValueOnce([]);

    await listLeads(
      { id: "u2", role: Role.AGENT, companyId: "c1" },
      { status: LeadStatus.NEW, search: "a" }
    );

    expect(prismaHoisted.prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: "c1",
          assignedToId: "u2",
        }),
      })
    );
  });

  it("getLead 404s when not found", async () => {
    prismaHoisted.prisma.lead.findFirst.mockResolvedValueOnce(null);

    await expect(
      getLead({ id: "u1", role: Role.COMPANY_ADMIN, companyId: "c1" }, "l1")
    ).rejects.toBeInstanceOf(AppError);
  });

  it("updateLead 404s when not found", async () => {
    prismaHoisted.prisma.lead.findFirst.mockResolvedValueOnce(null);

    await expect(
      updateLead(
        { id: "u1", role: Role.COMPANY_ADMIN, companyId: "c1" },
        "l1",
        { status: LeadStatus.WON }
      )
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("deleteLead deletes when found", async () => {
    prismaHoisted.prisma.lead.findFirst.mockResolvedValueOnce({ id: "l1" });
    prismaHoisted.prisma.lead.delete.mockResolvedValueOnce({});

    const res = await deleteLead(
      { id: "u1", role: Role.COMPANY_ADMIN, companyId: "c1" },
      "l1"
    );
    expect(res).toEqual({ message: "Lead deleted successfully" });
  });
});

