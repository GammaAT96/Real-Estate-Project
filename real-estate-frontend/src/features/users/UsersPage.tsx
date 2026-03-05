import React from 'react';
import { Badge } from '@/components/ui/badge';
import CRUDPage from '@/components/CRUDPage';
import type { User } from '@/types';

const UsersPage: React.FC = () => (
    <CRUDPage<User>
        title="Users"
        subtitle="Manage users within your company"
        endpoint="/api/users"
        columns={[
            { key: 'username', label: 'Username' },
            {
                key: 'role', label: 'Role',
                render: (u) => (
                    <Badge variant={u.role === 'SUPER_ADMIN' ? 'default' : u.role === 'COMPANY_ADMIN' ? 'secondary' : 'outline'}>
                        {u.role}
                    </Badge>
                ),
            },
            { key: 'companyId', label: 'Company ID' },
        ]}
        formFields={[
            { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'e.g. agent_ravi' },
            { name: 'password', label: 'Password', type: 'text', required: true, placeholder: 'Min 6 characters' },
            {
                name: 'role', label: 'Role', type: 'select', required: true,
                options: [
                    { value: 'SUPER_ADMIN', label: 'Super Admin' },
                    { value: 'COMPANY_ADMIN', label: 'Company Admin' },
                    { value: 'AGENT', label: 'Agent' },
                ],
            },
            { name: 'companyId', label: 'Company ID (UUID, optional)', type: 'text', placeholder: 'Leave empty for Super Admin' },
        ]}
        createTitle="Create New User"
        editTitle="Edit User"
    />
);

export default UsersPage;
