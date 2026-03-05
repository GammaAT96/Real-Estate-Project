import React from 'react';
import CRUDPage from '@/components/CRUDPage';
import type { Sale } from '@/types';

const SalesPage: React.FC = () => (
    <CRUDPage<Sale>
        title="Sales"
        subtitle="Record and manage plot sales"
        endpoint="/api/sales"
        columns={[
            { key: 'plot', label: 'Plot', render: (s) => s.plot?.plotNumber ?? '—' },
            {
                key: 'saleAmount', label: 'Sale Amount',
                render: (s) => `₹${Number(s.saleAmount).toLocaleString('en-IN')}`,
            },
            {
                key: 'createdAt', label: 'Sale Date',
                render: (s) => new Date(s.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric', month: 'short', day: 'numeric',
                }),
            },
        ]}
        formFields={[
            {
                name: 'plotId', label: 'Plot ID (UUID — must be BOOKED)',
                type: 'text', required: true, placeholder: 'Copy from Plots page',
            },
            {
                name: 'saleAmount', label: 'Sale Amount (₹)',
                type: 'number', required: true, placeholder: 'e.g. 1500000',
            },
        ]}
        createTitle="Record Sale"
        editTitle="Update Sale"
    />
);

export default SalesPage;
