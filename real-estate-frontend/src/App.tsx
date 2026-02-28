import React, { useState, useEffect, createContext, useContext } from 'react';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
    Building2,
    Users,
    LayoutDashboard,
    FolderKanban,
    MapPin,
    Calendar,
    DollarSign,
    LogOut,
    Menu,
    Plus,
    Edit,
    Trash2,
    Search,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Home,
    CheckCircle2,
    Clock,
    XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const API_BASE_URL = 'http://localhost:5000';

// ─── Types ────────────────────────────────────────────────────────────────────
// NOTE: User has NO email field — backend schema only has username, password, role, companyId
interface User {
    id: string;
    username: string;
    role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENT';
    companyId?: string;
}

interface Company {
    id: string;
    name: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
}

interface Project {
    id: string;
    name: string;
    description?: string;
    location?: string;
    companyId: string;
    company?: Company;
}

interface Plot {
    id: string;
    plotNumber: string;
    area: number;        // backend uses 'area', NOT 'size'
    status: 'AVAILABLE' | 'BOOKED' | 'SOLD';
    price: number;
    projectId: string;
    project?: Project;
}

// Booking: backend only supports POST (create) and PATCH /:id/cancel
// Fields: plotId, clientName, bookingAmount
interface Booking {
    id: string;
    plotId: string;
    clientName: string;    // backend uses 'clientName' NOT 'customerName'
    bookingAmount: number; // backend uses 'bookingAmount'
    status: string;
    plot?: Plot;
    createdAt: string;
}

// Sale: backend only accepts plotId + saleAmount on create
interface Sale {
    id: string;
    plotId: string;
    saleAmount: number;
    createdAt: string;
    plot?: Plot;
}

interface DashboardSummary {
    totalCompanies: number;
    totalProjects: number;
    totalPlots: number;
    availablePlots: number;
    bookedPlots: number;
    soldPlots: number;
    totalSalesCount: number;
    totalRevenue: number;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

// ─── Axios Instance ───────────────────────────────────────────────────────────
// accessToken stored in memory (NOT localStorage — security best practice)
let accessTokenMemory: string | null = null;

const createAxiosInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: API_BASE_URL,
        withCredentials: true, // Required for httpOnly refresh token cookie
    });

    instance.interceptors.request.use((config) => {
        if (accessTokenMemory) {
            config.headers.Authorization = `Bearer ${accessTokenMemory}`;
        }
        return config;
    });

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
                    window.location.reload();
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );

    return instance;
};

const apiClient = createAxiosInstance();

// ─── Auth Provider ────────────────────────────────────────────────────────────
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(true); // true while checking session

    // On mount: try to restore session from the httpOnly refresh cookie
    useEffect(() => {
        axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true })
            .then(({ data }) => {
                accessTokenMemory = data.accessToken;
                setAccessToken(data.accessToken);
                setUser(data.user);
            })
            .catch(() => { /* no valid cookie — user must log in */ })
            .finally(() => setInitializing(false));
    }, []);

    const login = async (username: string, password: string) => {
        const { data } = await axios.post(
            `${API_BASE_URL}/api/auth/login`,
            { username, password },
            { withCredentials: true }
        );
        accessTokenMemory = data.accessToken;
        setAccessToken(data.accessToken);
        setUser(data.user);
        toast.success('Login successful!');
    };

    const logout = async () => {
        try {
            await apiClient.post('/api/auth/logout');
        } catch (_) { }
        finally {
            accessTokenMemory = null;
            setAccessToken(null);
            setUser(null);
            toast.success('Logged out successfully');
        }
    };

    if (initializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, isAuthenticated: !!accessToken }}>
            {children}
        </AuthContext.Provider>
    );
};


// ─── Login Page ───────────────────────────────────────────────────────────────
const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(username, password);
            onLogin();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex">
            <div className="hidden lg:flex lg:w-1/2 bg-black items-center justify-center p-12">
                <div className="max-w-md space-y-6">
                    <div className="flex items-center gap-3">
                        <Building2 className="h-16 w-16 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold text-white leading-tight">Real Estate Admin</h1>
                    <p className="text-xl text-gray-300 leading-relaxed">
                        Manage your properties, projects, and sales with ease.
                    </p>
                    <div className="space-y-3 pt-4">
                        {['Complete Property Management', 'Real-time Sales Tracking', 'Multi-Company Support'].map((feat) => (
                            <div key={feat} className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-white" />
                                <span className="text-gray-200">{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-black">Welcome Back</h2>
                        <p className="text-gray-600">Sign in to access your dashboard</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-black">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-black/5 border-black/20 text-black placeholder:text-gray-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-black">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-black/5 border-black/20 text-black placeholder:text-gray-500"
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800 font-semibold" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                    <p className="text-center text-xs text-gray-400">
                        Default: <strong>superadmin</strong> / <strong>admin123</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
    const { accessToken } = useAuth();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!accessToken) return;  // Wait for token before fetching
        setLoading(true);
        apiClient.get('/api/dashboard/summary')
            .then(({ data }) => setSummary(data.data ?? data))   // backend wraps in {success, data})
            .catch(() => toast.error('Failed to fetch dashboard summary'))
            .finally(() => setLoading(false));
    }, [accessToken]);  // Re-run whenever token changes (login/refresh)

    if (loading) return <div className="p-6 text-muted-foreground">Loading dashboard...</div>;

    const stats = [
        { title: 'Total Companies', value: summary?.totalCompanies ?? 0, icon: Building2, color: 'text-blue-500' },
        { title: 'Total Projects', value: summary?.totalProjects ?? 0, icon: FolderKanban, color: 'text-purple-500' },
        { title: 'Total Plots', value: summary?.totalPlots ?? 0, icon: MapPin, color: 'text-green-500' },
        { title: 'Available', value: summary?.availablePlots ?? 0, icon: CheckCircle2, color: 'text-emerald-500' },
        { title: 'Booked', value: summary?.bookedPlots ?? 0, icon: Clock, color: 'text-yellow-500' },
        { title: 'Sold', value: summary?.soldPlots ?? 0, icon: Home, color: 'text-red-500' },
        { title: 'Total Sales', value: summary?.totalSalesCount ?? 0, icon: TrendingUp, color: 'text-indigo-500' },
        { title: 'Total Revenue', value: `₹${(summary?.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-green-600' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your real estate business</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Plot Status Distribution</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: 'Available', count: summary?.availablePlots ?? 0, color: 'bg-emerald-500' },
                            { label: 'Booked', count: summary?.bookedPlots ?? 0, color: 'bg-yellow-500' },
                            { label: 'Sold', count: summary?.soldPlots ?? 0, color: 'bg-red-500' },
                        ].map(({ label, count, color }) => (
                            <div key={label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`h-3 w-3 rounded-full ${color}`} />
                                    <span className="text-sm">{label}</span>
                                </div>
                                <span className="font-semibold">{count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Revenue Overview</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                            <p className="text-3xl font-bold text-green-600">
                                ₹{(summary?.totalRevenue ?? 0).toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Sales Count</p>
                            <p className="text-2xl font-semibold">{summary?.totalSalesCount ?? 0}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// ─── Generic CRUD Page ────────────────────────────────────────────────────────
// All list endpoints return: { success: true, data: [...], pagination: {...} }
// So we always extract response.data.data for the array

interface FieldDef {
    name: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date';
    options?: Array<{ value: string; label: string }>;
    required?: boolean;
}

interface ColDef<T> {
    key: string;
    label: string;
    render?: (item: T) => React.ReactNode;
}

interface CRUDPageProps<T> {
    title: string;
    endpoint: string;
    columns: ColDef<T>[];
    formFields: FieldDef[];
    createTitle: string;
    editTitle: string;
    /** If true, no Edit button (e.g. Bookings which use cancel instead) */
    readOnly?: boolean;
    /** Custom action rendered per-row */
    extraAction?: (item: T, refresh: () => void) => React.ReactNode;
}

function CRUDPage<T extends { id: string }>({
    title, endpoint, columns, formFields, createTitle, editTitle, readOnly, extraAction,
}: CRUDPageProps<T>) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data: res } = await apiClient.get(endpoint);
            // Backend always wraps list responses in { success, data, pagination }
            setItems(res.data ?? res);
        } catch {
            toast.error(`Failed to fetch ${title.toLowerCase()}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, [endpoint]);

    const handleCreate = () => { setEditingItem(null); setFormData({}); setDialogOpen(true); };
    const handleEdit = (item: T) => { setEditingItem(item); setFormData(item as any); setDialogOpen(true); };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await apiClient.delete(`${endpoint}/${id}`);
            toast.success('Deleted successfully');
            fetchItems();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await apiClient.put(`${endpoint}/${editingItem.id}`, formData);
                toast.success('Updated successfully');
            } else {
                await apiClient.post(endpoint, formData);
                toast.success('Created successfully');
            }
            setDialogOpen(false);
            fetchItems();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Operation failed');
        }
    };

    const filtered = items.filter((item: any) =>
        Object.values(item).some((v) => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{title}</h1>
                    <p className="text-muted-foreground">Manage your {title.toLowerCase()}</p>
                </div>
                {!readOnly && (
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" /> Add New
                    </Button>
                )}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-8">Loading...</TableCell></TableRow>
                            ) : paginated.length === 0 ? (
                                <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">No items found</TableCell></TableRow>
                            ) : paginated.map((item) => (
                                <TableRow key={item.id}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key}>{col.render ? col.render(item) : (item as any)[col.key] ?? '—'}</TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {extraAction?.(item, fetchItems)}
                                            {!readOnly && (
                                                <>
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? editTitle : createTitle}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {formFields.map((field) => (
                            <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name}>{field.label}</Label>
                                {field.type === 'select' ? (
                                    <Select value={formData[field.name] || ''} onValueChange={(v) => setFormData({ ...formData, [field.name]: v })}>
                                        <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
                                        <SelectContent>
                                            {field.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        id={field.name}
                                        className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                                        value={formData[field.name] || ''}
                                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                                        required={field.required}
                                    />
                                ) : (
                                    <Input
                                        id={field.name}
                                        type={field.type}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => setFormData({ ...formData, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                                        required={field.required}
                                    />
                                )}
                            </div>
                        ))}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">{editingItem ? 'Update' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Module Pages ─────────────────────────────────────────────────────────────

const UsersPage = () => (
    <CRUDPage<User>
        title="Users" endpoint="/api/users"
        columns={[
            { key: 'username', label: 'Username' },
            { key: 'role', label: 'Role', render: (u) => <Badge variant={u.role === 'SUPER_ADMIN' ? 'default' : u.role === 'COMPANY_ADMIN' ? 'secondary' : 'outline'}>{u.role}</Badge> },
            { key: 'companyId', label: 'Company ID' },
        ]}
        formFields={[
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'password', label: 'Password', type: 'text', required: true },
            {
                name: 'role', label: 'Role', type: 'select', required: true, options: [
                    { value: 'SUPER_ADMIN', label: 'Super Admin' },
                    { value: 'COMPANY_ADMIN', label: 'Company Admin' },
                    { value: 'AGENT', label: 'Agent' },
                ]
            },
            { name: 'companyId', label: 'Company ID (UUID, optional)', type: 'text' },
        ]}
        createTitle="Create User" editTitle="Edit User"
    />
);

// Company schema: only 'name' field exists in DB
const CompaniesPage = () => (
    <CRUDPage<Company>
        title="Companies" endpoint="/api/companies"
        columns={[
            { key: 'name', label: 'Company Name' },
            { key: 'id', label: 'ID (copy for Project creation)' },
        ]}
        formFields={[
            { name: 'name', label: 'Company Name', type: 'text', required: true },
        ]}
        createTitle="Create Company" editTitle="Edit Company"
    />
);

// Project schema: only 'name', 'location', 'companyId' exist in DB (no description)
const ProjectsPage = () => (
    <CRUDPage<Project>
        title="Projects" endpoint="/api/projects"
        columns={[
            { key: 'name', label: 'Name' },
            { key: 'location', label: 'Location' },
            { key: 'id', label: 'ID (copy for Plot creation)' },
        ]}
        formFields={[
            { name: 'name', label: 'Project Name', type: 'text', required: true },
            { name: 'location', label: 'Location', type: 'text', required: true },
            { name: 'companyId', label: 'Company ID (UUID — from Companies page)', type: 'text', required: true },
        ]}
        createTitle="Create Project" editTitle="Edit Project"
    />
);

const PlotsPage = () => (
    <CRUDPage<Plot>
        title="Plots" endpoint="/api/plots"
        columns={[
            { key: 'plotNumber', label: 'Plot Number' },
            { key: 'area', label: 'Area (sqft)' },  // Backend field is 'area' not 'size'
            {
                key: 'status', label: 'Status', render: (p) => (
                    <Badge variant={p.status === 'AVAILABLE' ? 'default' : p.status === 'BOOKED' ? 'secondary' : 'destructive'}>{p.status}</Badge>
                )
            },
            { key: 'price', label: 'Price', render: (p) => `₹${p.price.toLocaleString('en-IN')}` },
            { key: 'project', label: 'Project', render: (p) => p.project?.name ?? '—' },
        ]}
        formFields={[
            { name: 'plotNumber', label: 'Plot Number', type: 'text', required: true },
            { name: 'area', label: 'Area (sqft)', type: 'number', required: true },  // 'area' not 'size'
            { name: 'price', label: 'Price (₹)', type: 'number', required: true },
            { name: 'projectId', label: 'Project ID (UUID)', type: 'text', required: true },
        ]}
        createTitle="Create Plot" editTitle="Edit Plot"
    />
);

// Bookings: Backend only has POST (create) and PATCH /:id/cancel
// No standard PUT or global DELETE for bookings
const BookingsPage = () => {
    const handleCancel = async (id: string, refresh: () => void) => {
        if (!confirm('Cancel this booking? The plot will revert to AVAILABLE.')) return;
        try {
            await apiClient.patch(`/api/bookings/${id}/cancel`, {});
            toast.success('Booking cancelled');
            refresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    return (
        <CRUDPage<Booking>
            title="Bookings" endpoint="/api/bookings"
            readOnly  // no standard edit/delete — use cancel instead
            extraAction={(item, refresh) => (
                item.status !== 'CANCELLED' ? (
                    <Button variant="ghost" size="sm" onClick={() => handleCancel(item.id, refresh)}>
                        <XCircle className="h-4 w-4 text-orange-500" />
                    </Button>
                ) : null
            )}
            columns={[
                { key: 'clientName', label: 'Client Name' },
                { key: 'bookingAmount', label: 'Amount', render: (b) => `₹${b.bookingAmount.toLocaleString('en-IN')}` },
                { key: 'status', label: 'Status', render: (b) => <Badge variant={b.status === 'ACTIVE' ? 'default' : 'outline'}>{b.status}</Badge> },
                { key: 'plot', label: 'Plot', render: (b) => b.plot?.plotNumber ?? '—' },
                { key: 'createdAt', label: 'Date', render: (b) => new Date(b.createdAt).toLocaleDateString('en-IN') },
            ]}
            formFields={[
                { name: 'plotId', label: 'Plot ID (UUID)', type: 'text', required: true },
                { name: 'clientName', label: 'Client Name', type: 'text', required: true },
                { name: 'bookingAmount', label: 'Booking Amount (₹)', type: 'number', required: true },
            ]}
            createTitle="Create Booking" editTitle="Edit Booking"
        />
    );
};

// Sales: Create only needs plotId + saleAmount (plot must already be BOOKED)
const SalesPage = () => (
    <CRUDPage<Sale>
        title="Sales" endpoint="/api/sales"
        columns={[
            { key: 'plot', label: 'Plot', render: (s) => s.plot?.plotNumber ?? '—' },
            { key: 'saleAmount', label: 'Sale Amount', render: (s) => `₹${s.saleAmount.toLocaleString('en-IN')}` },
            { key: 'createdAt', label: 'Sale Date', render: (s) => new Date(s.createdAt).toLocaleDateString('en-IN') },
        ]}
        formFields={[
            { name: 'plotId', label: 'Plot ID (UUID) — must be BOOKED status', type: 'text', required: true },
            { name: 'saleAmount', label: 'Sale Amount (₹)', type: 'number', required: true },
        ]}
        createTitle="Record Sale" editTitle="Update Sale"
    />
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar: React.FC<{ currentPage: string; onNavigate: (p: string) => void; isMobileOpen: boolean; onMobileClose: () => void }> = ({
    currentPage, onNavigate, isMobileOpen, onMobileClose,
}) => {
    const { user, logout } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'companies', label: 'Companies', icon: Building2, superAdminOnly: true },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'plots', label: 'Plots', icon: MapPin },
        { id: 'bookings', label: 'Bookings', icon: Calendar },
        { id: 'sales', label: 'Sales', icon: DollarSign },
    ].filter((item) => !item.superAdminOnly || user?.role === 'SUPER_ADMIN');

    const nav = (page: string) => { onNavigate(page); onMobileClose(); };

    const content = (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border">
                <div className="flex items-center gap-2">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                        <h2 className="font-bold text-lg">Real Estate</h2>
                        <p className="text-xs text-muted-foreground">Admin Dashboard</p>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => nav(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${currentPage === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                            }`}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
            <div className="p-4 border-t border-border">
                <div className="mb-3 p-3 bg-accent rounded-lg">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <Badge variant="outline" className="mt-1 text-xs">{user?.role}</Badge>
                </div>
                <Button variant="outline" className="w-full" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
            </div>
        </div>
    );

    return (
        <>
            <div className="hidden lg:block w-64 border-r border-border bg-card h-screen sticky top-0">{content}</div>
            {isMobileOpen && (
                <>
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={onMobileClose} />
                    <div className="fixed left-0 top-0 bottom-0 w-64 bg-card z-50 lg:hidden">{content}</div>
                </>
            )}
        </>
    );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const RealEstateAdmin: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (!isAuthenticated) return <LoginPage onLogin={() => setCurrentPage('dashboard')} />;

    const pages: Record<string, React.ReactNode> = {
        dashboard: <DashboardPage />,
        users: <UsersPage />,
        companies: <CompaniesPage />,
        projects: <ProjectsPage />,
        plots: <PlotsPage />,
        bookings: <BookingsPage />,
        sales: <SalesPage />,
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} isMobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
            <div className="flex-1 flex flex-col">
                <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur p-4 flex items-center">
                    <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </header>
                <main className="flex-1 p-6 overflow-auto">{pages[currentPage] ?? <DashboardPage />}</main>
            </div>
        </div>
    );
};

const App: React.FC = () => (
    <AuthProvider>
        <RealEstateAdmin />
        <Toaster />
    </AuthProvider>
);

export default App;
