import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    Building2, FolderKanban, MapPin, CheckCircle2,
    Clock, Home, TrendingUp, DollarSign,
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import type { DashboardSummary } from '@/types';

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}> = ({ title, value, icon: Icon, color, bgColor }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={`h-9 w-9 rounded-lg ${bgColor} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

// ─── Custom Recharts Tooltip ───────────────────────────────────────────────────
const CustomTooltip: React.FC<any> = ({ active, payload, label, formatter }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
            <p className="font-semibold mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.dataKey} style={{ color: p.color }}>
                    {p.name}: {formatter ? formatter(p.value, p.name) : p.value}
                </p>
            ))}
        </div>
    );
};

// ─── Monthly trend type ────────────────────────────────────────────────────────
interface MonthTrend { month: string; revenue: number; bookings: number; }

// ─── Dashboard Page ────────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
    const { accessToken } = useAuthStore();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [trends, setTrends] = useState<MonthTrend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!accessToken) return;
        setLoading(true);
        Promise.all([
            apiClient.get('/api/dashboard/summary'),
            apiClient.get('/api/dashboard/trends'),
        ])
            .then(([summaryRes, trendsRes]) => {
                setSummary(summaryRes.data.data ?? summaryRes.data);
                setTrends(trendsRes.data.data ?? []);
            })
            .catch(() => toast.error('Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, [accessToken]);

    const stats = [
        { title: 'Total Companies', value: summary?.totalCompanies ?? 0, icon: Building2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        { title: 'Total Projects', value: summary?.totalProjects ?? 0, icon: FolderKanban, color: 'text-purple-600', bgColor: 'bg-purple-50' },
        { title: 'Total Plots', value: summary?.totalPlots ?? 0, icon: MapPin, color: 'text-gray-600', bgColor: 'bg-gray-100' },
        { title: 'Available', value: summary?.availablePlots ?? 0, icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50' },
        { title: 'Booked', value: summary?.bookedPlots ?? 0, icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
        { title: 'Sold', value: summary?.soldPlots ?? 0, icon: Home, color: 'text-red-600', bgColor: 'bg-red-50' },
        { title: 'Total Sales', value: summary?.totalSalesCount ?? 0, icon: TrendingUp, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        {
            title: 'Total Revenue',
            value: `₹${(summary?.totalRevenue ?? 0).toLocaleString('en-IN')}`,
            icon: DollarSign, color: 'text-green-700', bgColor: 'bg-green-50',
        },
    ];

    const totalPlots = summary?.totalPlots || 1;
    const availPct = Math.round(((summary?.availablePlots ?? 0) / totalPlots) * 100);
    const bookedPct = Math.round(((summary?.bookedPlots ?? 0) / totalPlots) * 100);
    const soldPct = Math.round(((summary?.soldPlots ?? 0) / totalPlots) * 100);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading dashboard...
                </div>
            </div>
        );
    }

    const formatRevenue = (v: number) => `₹${(v / 1000).toFixed(0)}K`;

    return (
        <div className="space-y-8">
            {/* Page header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Overview of your real estate business</p>
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => <StatCard key={s.title} {...s} />)}
            </div>

            {/* ── Revenue Trend Chart (Area) ────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Revenue Trend — Last 6 Months</CardTitle>
                </CardHeader>
                <CardContent>
                    {trends.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                            No trend data yet — start recording sales to see the chart
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={trends} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={formatRevenue} tick={{ fontSize: 12 }} width={52} />
                                <Tooltip
                                    content={<CustomTooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Revenue"
                                    stroke="#4f46e5"
                                    strokeWidth={2}
                                    fill="url(#revGrad)"
                                    dot={{ r: 4, fill: '#4f46e5' }}
                                    activeDot={{ r: 6 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* ── Bottom row ────────────────────────────────────── */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Bookings per month (Bar chart) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Bookings per Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {trends.length === 0 ? (
                            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                                No booking data yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={trends} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="bookings" name="Bookings" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Plot distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Plot Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: 'Available', count: summary?.availablePlots ?? 0, pct: availPct, color: 'bg-green-500' },
                            { label: 'Booked', count: summary?.bookedPlots ?? 0, pct: bookedPct, color: 'bg-yellow-400' },
                            { label: 'Sold', count: summary?.soldPlots ?? 0, pct: soldPct, color: 'bg-red-500' },
                        ].map(({ label, count, pct, color }) => (
                            <div key={label} className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{label}</span>
                                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${color} transition-all duration-700`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        ))}

                        {/* Revenue summary */}
                        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="text-xs text-muted-foreground">Total Revenue</p>
                                <p className="text-lg font-bold mt-0.5 text-green-700">
                                    ₹{(summary?.totalRevenue ?? 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="text-xs text-muted-foreground">Avg. Sale Value</p>
                                <p className="text-lg font-bold mt-0.5">
                                    ₹{summary?.totalSalesCount
                                        ? Math.round((summary.totalRevenue ?? 0) / summary.totalSalesCount).toLocaleString('en-IN')
                                        : 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
