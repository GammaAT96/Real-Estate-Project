import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Building2, Users, LayoutDashboard, FolderKanban,
    MapPin, Calendar, DollarSign, LogOut, CreditCard,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/api/axios';
import { toast } from 'sonner';

interface NavItem {
    to: string;
    label: string;
    icon: React.ElementType;
    superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/users', label: 'Users', icon: Users },
    { to: '/leads', label: 'Leads', icon: Users },
    { to: '/companies', label: 'Companies', icon: Building2, superAdminOnly: true },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/plots', label: 'Plots', icon: MapPin },
    { to: '/bookings', label: 'Bookings', icon: Calendar },
    { to: '/sales', label: 'Sales', icon: DollarSign },
    { to: '/dues', label: 'Dues', icon: CreditCard },
];

const SidebarContent: React.FC = () => {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();

    const visibleItems = navItems.filter(
        (item) => !item.superAdminOnly || user?.role === 'SUPER_ADMIN'
    );

    const handleLogout = async () => {
        try { await api.post('/api/auth/logout'); } catch (_) { }
        clearAuth();
        toast.success('Logged out successfully');
        navigate('/login', { replace: true });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h2 className="font-bold text-base leading-none">Real Estate</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Admin Dashboard</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {visibleItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                            }`
                        }
                    >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* User info + logout */}
            <div className="p-4 border-t border-border space-y-3">
                <div className="p-3 rounded-lg bg-accent">
                    <p className="text-sm font-semibold leading-none">{user?.username}</p>
                    <Badge variant="outline" className="mt-1.5 text-xs">{user?.role}</Badge>
                </div>
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>
        </div>
    );
};

interface SidebarProps {
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => (
    <>
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-64 border-r border-border bg-card h-screen sticky top-0 shrink-0">
            <SidebarContent />
        </div>

        {/* Mobile overlay */}
        {isMobileOpen && (
            <>
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onMobileClose}
                />
                <div className="fixed left-0 top-0 bottom-0 w-64 bg-card z-50 lg:hidden shadow-xl">
                    <SidebarContent />
                </div>
            </>
        )}
    </>
);

export default Sidebar;
