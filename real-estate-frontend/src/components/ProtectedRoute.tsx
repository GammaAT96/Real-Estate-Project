import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

interface Props {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
    const { accessToken, user, isInitialized } = useAuthStore();

    // Wait until auth initialization completes
    if (!isInitialized) {
        return null;
    }

    if (!accessToken) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};