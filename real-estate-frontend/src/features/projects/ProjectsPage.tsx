import React from 'react';
import CRUDPage from '@/components/CRUDPage';
import type { Project } from '@/types';

const ProjectsPage: React.FC = () => (
    <CRUDPage<Project>
        title="Projects"
        subtitle="Manage real estate projects within companies"
        endpoint="/api/projects"
        columns={[
            { key: 'name', label: 'Project Name' },
            { key: 'location', label: 'Location' },
            { key: 'id', label: 'ID (copy for plot creation)' },
        ]}
        formFields={[
            { name: 'name', label: 'Project Name', type: 'text', required: true, placeholder: 'e.g. Green Valley' },
            { name: 'location', label: 'Location', type: 'text', required: true, placeholder: 'e.g. Sector 14, Gurugram' },
            { name: 'companyId', label: 'Company ID (UUID)', type: 'text', required: true, placeholder: 'Copy from Companies page' },
        ]}
        createTitle="Create Project"
        editTitle="Edit Project"
    />
);

export default ProjectsPage;
