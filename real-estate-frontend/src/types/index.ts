// ─── Shared Type Definitions ──────────────────────────────────────────────────

export interface User {
    id: string;
    username: string;
    role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENT';
    companyId?: string;
    isActive?: boolean;
}

export interface Company {
    id: string;
    name: string;
    isActive?: boolean;
}

export interface Project {
    id: string;
    name: string;
    location: string;
    status?: 'ACTIVE' | 'INACTIVE';
    companyId: string;
    company?: Company;
}

export interface Plot {
    id: string;
    plotNumber: string;
    area: number;
    price: number;
    status: 'AVAILABLE' | 'BOOKED' | 'SOLD';
    projectId: string;
    project?: Project;
    isActive?: boolean;
}

export interface Booking {
    id: string;
    plotId: string;
    clientName: string;
    bookingAmount: number;
    status: 'ACTIVE' | 'CANCELLED';
    agentId?: string;
    plot?: Plot;
    createdAt: string;
}

export interface Sale {
    id: string;
    plotId: string;
    saleAmount: number;
    createdAt: string;
    plot?: Plot;
    agentId?: string;
    companyId?: string;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'VISIT_SCHEDULED' | 'NEGOTIATION' | 'WON' | 'LOST';

export interface Lead {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    status: LeadStatus;
    source?: string | null;
    notes?: string | null;
    companyId: string;
    projectId?: string | null;
    plotId?: string | null;
    assignedToId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export type InstallmentStatus = 'DUE' | 'PAID' | 'WAIVED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CARD' | 'OTHER';

export interface Installment {
    id: string;
    saleId: string;
    companyId: string;
    number: number;
    amount: number;
    dueDate: string;
    status: InstallmentStatus;
    paidAt?: string | null;
    paidAmount?: number | null;
    method?: PaymentMethod | null;
    reference?: string | null;
    receivedBy?: Pick<User, 'id' | 'username' | 'role'> | null;
    sale?: Sale & { plot?: Plot & { project?: Project } };
}

export interface DuesSummary {
    dueCount: number;
    dueAmount: number;
    overdueCount: number;
    overdueAmount: number;
    dueNext7DaysCount: number;
    dueNext7DaysAmount: number;
    paidThisMonthCount: number;
    paidThisMonthAmount: number;
}

export interface DashboardSummary {
    totalCompanies: number;
    totalProjects: number;
    totalPlots: number;
    availablePlots: number;
    bookedPlots: number;
    soldPlots: number;
    totalSalesCount: number;
    totalRevenue: number;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    pagination?: PaginationMeta;
}
