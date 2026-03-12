import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { CrudDialog } from "@/components/crud/CrudDialog";
import { CrudTable } from "@/components/crud/CrudTable";
import { Pagination } from "@/components/crud/Pagination";
import { validateField } from "@/components/crud/validation";

// ─── Field & Column definitions ───────────────────────────────────────────────

export interface FieldDef {
    name: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date';
    options?: Array<{ value: string; label: string }>;
    required?: boolean;
    placeholder?: string;
    /** Minimum numeric value */
    min?: number;
    /** Custom validation function — return error string or undefined */
    validate?: (value: any, formData: Record<string, any>) => string | undefined;
}

export interface ColDef<T> {
    key: string;
    label: string;
    render?: (item: T) => React.ReactNode;
}

interface CRUDPageProps<T> {
    title: string;
    subtitle?: string;
    endpoint: string;
    columns: ColDef<T>[];
    formFields: FieldDef[];
    createTitle: string;
    editTitle: string;
    readOnly?: boolean;
    extraAction?: (item: T, refresh: () => void) => React.ReactNode;
    externalTriggerCreate?: boolean;
    onCreateDialogOpened?: () => void;
}

// ─── Generic CRUD Page ────────────────────────────────────────────────────────

function CRUDPage<T extends { id: string }>({
    title,
    subtitle,
    endpoint,
    columns,
    formFields,
    createTitle,
    editTitle,
    readOnly,
    extraAction,
    externalTriggerCreate,
    onCreateDialogOpened,
}: CRUDPageProps<T>) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // External trigger
    useEffect(() => {
        if (externalTriggerCreate) {
            openCreateDialog();
            onCreateDialogOpened?.();
        }
    }, [externalTriggerCreate]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data: res } = await apiClient.get(endpoint);
            setItems(res.data ?? res);
        } catch {
            toast.error(`Failed to fetch ${title.toLowerCase() || "items"}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, [endpoint]);

    const openCreateDialog = () => {
        setEditingItem(null);
        setFormData({});
        setFieldErrors({});
        setTouched({});
        setDialogOpen(true);
    };

    const handleEdit = (item: T) => {
        setEditingItem(item);
        setFormData(item as any);
        setFieldErrors({});
        setTouched({});
        setDialogOpen(true);
    };

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

    // Validate all fields — returns true if valid
    const validateAll = (): boolean => {
        const errors: Record<string, string> = {};
        for (const field of formFields) {
            const err = validateField(field, formData[field.name], formData);
            if (err) errors[field.name] = err;
        }
        setFieldErrors(errors);
        // Mark all as touched so errors show
        const allTouched: Record<string, boolean> = {};
        formFields.forEach((f) => (allTouched[f.name] = true));
        setTouched(allTouched);
        return Object.keys(errors).length === 0;
    };

    const handleBlur = (fieldName: string) => {
        setTouched((prev) => ({ ...prev, [fieldName]: true }));
        const field = formFields.find((f) => f.name === fieldName);
        if (field) {
            const err = validateField(field, formData[fieldName], formData);
            setFieldErrors((prev) => ({ ...prev, [fieldName]: err || '' }));
        }
    };

    const handleFieldChange = (fieldName: string, value: any) => {
        const updated = { ...formData, [fieldName]: value };
        setFormData(updated);
        // Live-clear error once user fixes it
        if (touched[fieldName]) {
            const field = formFields.find((f) => f.name === fieldName);
            if (field) {
                const err = validateField(field, value, updated);
                setFieldErrors((prev) => ({ ...prev, [fieldName]: err || '' }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return; // ← block submit if invalid

        setSubmitting(true);
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
            // Surface backend validation errors inline if available
            const backendMsg = err.response?.data?.message;
            if (backendMsg) toast.error(backendMsg);
            else toast.error('Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = items.filter((item: any) =>
        Object.values(item).some((v) => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Header — only shown when a title is provided */}
            {title && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                        <p className="text-muted-foreground mt-1">
                            {subtitle ?? `Manage your ${title.toLowerCase()}`}
                        </p>
                    </div>
                    {!readOnly && (
                        <Button onClick={openCreateDialog}>
                            <Plus className="h-4 w-4 mr-2" /> Add New
                        </Button>
                    )}
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    className="pl-10"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
            </div>

            {/* Table */}
            <CrudTable
                title={title}
                columns={columns}
                items={paginated}
                loading={loading}
                readOnly={readOnly}
                extraAction={extraAction}
                onEdit={handleEdit}
                onDelete={(id) => void handleDelete(id)}
                onRefresh={fetchItems}
            />

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={filtered.length}
                onPageChange={(p) => setCurrentPage(p)}
            />

            {/* Create / Edit Dialog */}
            <CrudDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setFieldErrors({});
                        setTouched({});
                    }
                    setDialogOpen(open);
                }}
                title={editingItem ? editTitle : createTitle}
                formFields={formFields}
                formData={formData}
                touched={touched}
                fieldErrors={fieldErrors}
                submitting={submitting}
                submitLabel={editingItem ? "Update" : "Create"}
                submittingLabel={editingItem ? "Updating..." : "Creating..."}
                onSubmit={handleSubmit}
                onCancel={() => setDialogOpen(false)}
                onFieldChange={handleFieldChange}
                onFieldBlur={handleBlur}
            />
        </div>
    );
}

export default CRUDPage;
