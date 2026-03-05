import axios from "axios";
import { useAuthStore } from "../store/auth.store";

/**
 * Called once on app startup (fire-and-forget, NOT awaited before render).
 * Attempts a silent token refresh using the HttpOnly refresh cookie.
 * Sets isInitialized = true when finished so the app stops showing the loader.
 */
export const initAuth = async () => {
    try {
        const response = await axios.post(
            "http://localhost:5000/api/auth/refresh",
            {},
            { withCredentials: true }
        );

        const { accessToken, user } = response.data;

        useAuthStore.getState().setAuth(accessToken, user);
    } catch {
        // No valid refresh cookie — user is not logged in, that's fine
        useAuthStore.getState().clearAuth();
    } finally {
        // Always mark as initialized so the spinner goes away
        useAuthStore.getState().setInitialized();
    }
};