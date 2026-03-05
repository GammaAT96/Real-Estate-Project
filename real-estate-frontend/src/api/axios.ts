import axios from "axios";
import { useAuthStore } from "../store/auth.store";

// ─── Base instance ─────────────────────────────────────────────────────────────
// Dev:        VITE_API_URL not set  → defaults to http://localhost:5000
// Production: VITE_API_URL=http://localhost  (nginx proxies /api/* → backend)
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // ⚠️ Critical — sends HttpOnly refresh token cookie
});

// ─── Request interceptor ───────────────────────────────────────────────────────
// Reads the access token from Zustand store (memory-only, XSS-safe)
// and injects it into every request's Authorization header.
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(
                    `${BASE_URL}/api/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newToken = response.data.accessToken;

                useAuthStore.getState().setAuth(
                    newToken,
                    useAuthStore.getState().user!
                );

                processQueue(null, newToken);
                isRefreshing = false;

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                isRefreshing = false;

                useAuthStore.getState().clearAuth();
                window.location.href = "/login";
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

// ─── NOTE ──────────────────────────────────────────────────────────────────────
// 401 auto-refresh interceptor will be added in the next step.
// This keeps concerns separated and easier to test.
