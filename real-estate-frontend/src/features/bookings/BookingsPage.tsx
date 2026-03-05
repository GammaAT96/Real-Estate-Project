import React from 'react';
import { toast } from 'sonner';
import { XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/axios';
import CRUDPage from '@/components/CRUDPage';
import type { Booking } from '@/types';

const BookingsPage: React.FC = () => {
    const handleCancel = async (id: string, refresh: () => void) => {
        if (!confirm('Cancel this booking? The plot will revert to AVAILABLE.')) return;
        try {
            await apiClient.patch(`/api/bookings/${id}/cancel`, {});
            toast.success('Booking cancelled — plot is now available');
            refresh();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    return (
        <CRUDPage<Booking>
            title="Bookings"
            subtitle="View and manage plot bookings"
            endpoint="/api/bookings"
            readOnly
            extraAction={(item, refresh) =>
                item.status !== 'CANCELLED' ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(item.id, refresh)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                ) : null
            }
            columns={[
                { key: 'clientName', label: 'Client Name' },
                {
                    key: 'bookingAmount', label: 'Amount',
                    render: (b) => `₹${b.bookingAmount.toLocaleString('en-IN')}`,
                },
                {
                    key: 'status', label: 'Status',
                    render: (b) => (
                        <Badge
                            variant={b.status === 'ACTIVE' ? 'default' : 'outline'}
                            className={b.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'text-muted-foreground'}
                        >
                            {b.status}
                        </Badge>
                    ),
                },
                { key: 'plot', label: 'Plot', render: (b) => b.plot?.plotNumber ?? '—' },
                { key: 'createdAt', label: 'Date', render: (b) => new Date(b.createdAt).toLocaleDateString('en-IN') },
            ]}
            formFields={[
                { name: 'plotId', label: 'Plot ID (UUID)', type: 'text', required: true, placeholder: 'Copy from Plots page' },
                { name: 'clientName', label: 'Client Name', type: 'text', required: true, placeholder: 'e.g. Rahul Sharma' },
                { name: 'bookingAmount', label: 'Booking Amount (₹)', type: 'number', required: true, placeholder: 'e.g. 50000' },
            ]}
            createTitle="Create Booking"
            editTitle="Edit Booking"
        />
    );
};

export default BookingsPage;
