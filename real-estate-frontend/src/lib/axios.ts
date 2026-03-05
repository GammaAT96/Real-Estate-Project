import axios, { AxiosInstance, AxiosError } from 'axios';

export const API_BASE_URL = 'http://localhost:5000';

// Access token stored in memory (NOT localStorage — XSS protection)
let accessTokenMemory: string | null = null;

export const getAccessToken = () => accessTokenMemory;
export const setAccessToken = (token: string | null) => { accessTokenMemory = token; };

export const createAxiosInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true, // Required for HttpOnly refresh token cookie
    });

    // Inject Bearer token on every request
    instance.interceptors.request.use((config) => {
        if (accessTokenMemory) {
            config.headers.Authorization = `Bearer ${accessTokenMemory}`;
        }
        return config;
    });

    // Auto-refresh on 401 — silently retry the original request
    instance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as any;
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    const { data } = await axios.post(
                        `${API_BASE_URL}/api/auth/refresh`,
                        {},
                        { withCredentials: true }
                    );
                    accessTokenMemory = data.accessToken;
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    return instance(originalRequest);
                } catch (refreshError) {
                    accessTokenMemory = null;
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );

    return instance;
};

export const apiClient = createAxiosInstance();
