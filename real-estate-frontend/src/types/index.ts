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

export interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
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
