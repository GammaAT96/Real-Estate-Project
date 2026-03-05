import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import { useAuthStore } from "@/store/auth.store";
import Layout from "@/components/Layout";

// ─── Feature Pages ─────────────────────────────────────────
import LoginPage from "@/features/auth/LoginPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import UsersPage from "@/features/users/UsersPage";
import CompaniesPage from "@/features/companies/CompaniesPage";
import ProjectsPage from "@/features/projects/ProjectsPage";
import PlotsPage from "@/features/plots/PlotsPage";
import BookingsPage from "@/features/bookings/BookingsPage";
import SalesPage from "@/features/sales/SalesPage";

// ─── Route Guards ─────────────────────────────────────────

/** Protected route */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { accessToken, isInitialized } = useAuthStore();

    if (!isInitialized) return null;

    if (!accessToken) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

/** Public route (login page) */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { accessToken, isInitialized } = useAuthStore();

    if (!isInitialized) return null;

    return accessToken ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

/** SUPER_ADMIN only */
const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isInitialized } = useAuthStore();

    if (!isInitialized) return null;

    return user?.role === "SUPER_ADMIN"
        ? <>{children}</>
        : <Navigate to="/dashboard" replace />;
};

// ─── Router ───────────────────────────────────────────────

const AppRoutes: React.FC = () => (
    <Routes>
        {/* Public */}
        <Route
            path="/login"
            element={
                <PublicRoute>
                    <LoginPage />
                </PublicRoute>
            }
        />

        {/* Protected Layout Wrapper */}
        <Route
            element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }
        >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/plots" element={<PlotsPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/sales" element={<SalesPage />} />

            {/* SUPER_ADMIN only */}
            <Route
                path="/companies"
                element={
                    <SuperAdminRoute>
                        <CompaniesPage />
                    </SuperAdminRoute>
                }
            />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
);

// ─── Auth Initializer ─────────────────────────────────────

const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isInitialized = useAuthStore((s) => s.isInitialized);

    if (!isInitialized) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

// ─── Root App ─────────────────────────────────────────────

const App: React.FC = () => (
    <BrowserRouter>
        <AuthInitializer>
            <AppRoutes />
            <Toaster />
        </AuthInitializer>
    </BrowserRouter>
);

export default App;