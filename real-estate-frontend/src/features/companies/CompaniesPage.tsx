import React from 'react';
import CRUDPage from '@/components/CRUDPage';
import type { Company } from '@/types';

const CompaniesPage: React.FC = () => (
    <CRUDPage<Company>
        title="Companies"
        subtitle="Manage real estate companies on the platform"
        endpoint="/api/companies"
        columns={[
            { key: 'name', label: 'Company Name' },
            { key: 'id', label: 'ID (copy for project creation)' },
        ]}
        formFields={[
            { name: 'name', label: 'Company Name', type: 'text', required: true, placeholder: 'e.g. Sunrise Realty' },
        ]}
        createTitle="Create Company"
        editTitle="Edit Company"
    />
);

export default CompaniesPage;
