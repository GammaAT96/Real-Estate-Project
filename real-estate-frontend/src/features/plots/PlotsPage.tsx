import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/axios';
import CRUDPage from '@/components/CRUDPage';
import PlotGrid from '@/features/plots/PlotGrid';
import type { Plot } from '@/types';

const PlotsPage: React.FC = () => {
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [plots, setPlots] = useState<Plot[]>([]);
    const [loadingGrid, setLoadingGrid] = useState(false);
    const [triggerCreate, setTriggerCreate] = useState(false);

    // Fetch plots for grid view
    useEffect(() => {
        if (viewMode !== 'grid') return;
        setLoadingGrid(true);
        apiClient
            .get('/api/plots')
            .then(({ data }) => setPlots(data.data ?? data))
            .catch(() => toast.error('Failed to load plots for grid'))
            .finally(() => setLoadingGrid(false));
    }, [viewMode]);

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Plots</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage plot inventory — switch between table and visual grid view
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Add New button — only available in table mode */}
                    {viewMode === 'table' && (
                        <Button onClick={() => setTriggerCreate(true)}>
                            <Plus className="h-4 w-4 mr-2" /> Add New
                        </Button>
                    )}

                    {/* View toggle */}
                    <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted">
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className="gap-2"
                        >
                            <List className="h-4 w-4" />
                            Table
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="gap-2"
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Grid
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table view */}
            {viewMode === 'table' && (
                <CRUDPage<Plot>
                    title=""
                    endpoint="/api/plots"
                    externalTriggerCreate={triggerCreate}
                    onCreateDialogOpened={() => setTriggerCreate(false)}
                    columns={[
                        { key: 'plotNumber', label: 'Plot No.' },
                        { key: 'area', label: 'Area (sqft)' },
                        {
                            key: 'status', label: 'Status',
                            render: (p) => (
                                <Badge
                                    variant={
                                        p.status === 'AVAILABLE' ? 'default'
                                            : p.status === 'BOOKED' ? 'secondary'
                                                : 'destructive'
                                    }
                                    className={
                                        p.status === 'AVAILABLE'
                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                            : p.status === 'BOOKED'
                                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                                : ''
                                    }
                                >
                                    {p.status}
                                </Badge>
                            ),
                        },
                        {
                            key: 'price', label: 'Price',
                            render: (p) => `₹${p.price.toLocaleString('en-IN')}`,
                        },
                        {
                            key: 'project', label: 'Project',
                            render: (p) => p.project?.name ?? '—',
                        },
                    ]}
                    formFields={[
                        { name: 'plotNumber', label: 'Plot Number', type: 'text', required: true, placeholder: 'e.g. A-101' },
                        { name: 'area', label: 'Area (sqft)', type: 'number', required: true, placeholder: 'e.g. 200' },
                        { name: 'price', label: 'Price (₹)', type: 'number', required: true, placeholder: 'e.g. 500000' },
                        { name: 'projectId', label: 'Project ID (UUID)', type: 'text', required: true, placeholder: 'Copy from Projects page' },
                    ]}
                    createTitle="Create Plot"
                    editTitle="Edit Plot"
                />
            )}

            {/* Grid view */}
            {viewMode === 'grid' && (
                <div className="border rounded-xl p-6 bg-card">
                    {loadingGrid ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            Loading plot grid...
                        </div>
                    ) : (
                        <PlotGrid
                            plots={plots}
                            onPlotClick={(plot) =>
                                toast.info(`Plot ${plot.plotNumber} — ${plot.status} | ₹${plot.price.toLocaleString('en-IN')} | ${plot.area} sqft`)
                            }
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default PlotsPage;
