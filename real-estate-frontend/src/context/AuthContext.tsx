import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL, apiClient, setAccessToken } from '@/lib/axios';
import type { AuthContextType, User } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessTokenState] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(true);

    // On mount: restore session from HttpOnly refresh token cookie
    useEffect(() => {
        axios
            .post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true })
            .then(({ data }) => {
                setAccessToken(data.accessToken);
                setAccessTokenState(data.accessToken);
                setUser(data.user);
            })
            .catch(() => { /* No valid cookie — user must log in */ })
            .finally(() => setInitializing(false));
    }, []);

    const login = async (username: string, password: string) => {
        const { data } = await axios.post(
            `${API_BASE_URL}/api/auth/login`,
            { username, password },
            { withCredentials: true }
        );
        setAccessToken(data.accessToken);
        setAccessTokenState(data.accessToken);
        setUser(data.user);
        toast.success('Login successful!');
    };

    const logout = async () => {
        try {
            await apiClient.post('/api/auth/logout');
        } catch (_) { }
        finally {
            setAccessToken(null);
            setAccessTokenState(null);
            setUser(null);
            toast.success('Logged out successfully');
        }
    };

    if (initializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground text-sm">Loading session...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated: !!accessToken }}>
            {children}
        </AuthContext.Provider>
    );
};
