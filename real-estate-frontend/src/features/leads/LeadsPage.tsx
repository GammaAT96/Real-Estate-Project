import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CRUDPage, { FieldDef, ColDef } from '@/components/CRUDPage';
import type { Lead, LeadStatus } from '@/types';

const statusLabels: Record<LeadStatus, string> = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    VISIT_SCHEDULED: 'Visit Scheduled',
    NEGOTIATION: 'Negotiation',
    WON: 'Won',
    LOST: 'Lost',
};

const statusVariant: Record<LeadStatus, string> = {
    NEW: 'bg-slate-100 text-slate-800',
    CONTACTED: 'bg-blue-100 text-blue-800',
    VISIT_SCHEDULED: 'bg-amber-100 text-amber-800',
    NEGOTIATION: 'bg-purple-100 text-purple-800',
    WON: 'bg-emerald-100 text-emerald-800',
    LOST: 'bg-red-100 text-red-800',
};

const LeadsPage: React.FC = () => {
    const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');

    const columns: ColDef<Lead>[] = [
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        {
            key: 'email',
            label: 'Email',
        },
        {
            key: 'status',
            label: 'Stage',
            render: (l) => (
                <Badge variant="outline" className={statusVariant[l.status]}>
                    {statusLabels[l.status]}
                </Badge>
            ),
        },
        {
            key: 'source',
            label: 'Source',
        },
    ];

    const formFields: FieldDef[] = [
        { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Client name' },
        { name: 'phone', label: 'Phone', type: 'text', required: true, placeholder: 'Mobile number' },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Optional email' },
        { name: 'source', label: 'Source', type: 'text', placeholder: 'e.g. Walk-in, Portal, Referral' },
        { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any extra context about this lead' },
        {
            name: 'status',
            label: 'Stage',
            type: 'select',
            required: true,
            options: (Object.keys(statusLabels) as LeadStatus[]).map((s) => ({
                value: s,
                label: statusLabels[s],
            })),
        },
    ];

    const endpoint =
        statusFilter === 'ALL'
            ? '/api/leads'
            : `/api/leads?status=${encodeURIComponent(statusFilter)}`;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                    <p className="text-muted-foreground mt-1">Manage your sales pipeline and follow-ups</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Stage:</span>
                    <Select
                        value={statusFilter}
                        onValueChange={(v) => setStatusFilter(v as LeadStatus | 'ALL')}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All stages" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All</SelectItem>
                            {(Object.keys(statusLabels) as LeadStatus[]).map((s) => (
                                <SelectItem key={s} value={s}>
                                    {statusLabels[s]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <CRUDPage<Lead>
                title=""
                subtitle=""
                endpoint={endpoint}
                columns={columns}
                formFields={formFields}
                createTitle="Create Lead"
                editTitle="Edit Lead"
            />
        </div>
    );
};

export default LeadsPage;

