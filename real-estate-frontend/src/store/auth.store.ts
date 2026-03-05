import { create } from "zustand";

export interface User {
    id: string;
    username: string;
    role: "SUPER_ADMIN" | "COMPANY_ADMIN" | "AGENT";
    companyId?: string;
}

interface AuthState {
    accessToken: string | null;
    user: User | null;
    isInitialized: boolean; // ← true once the refresh check completes (success or fail)
    setAuth: (token: string, user: User) => void;
    clearAuth: () => void;
    setInitialized: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,      // ✅ Memory-only — no localStorage, no XSS risk
    user: null,
    isInitialized: false,   // ← app shows spinner until this is true
    setAuth: (token, user) => set({ accessToken: token, user }),
    clearAuth: () => set({ accessToken: null, user: null }),
    setInitialized: () => set({ isInitialized: true }),
}));
