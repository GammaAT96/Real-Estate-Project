import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Plus, Edit, Trash2, Search,
    ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';

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

// ─── Inline field error component ─────────────────────────────────────────────
const FieldError: React.FC<{ message?: string }> = ({ message }) => {
    if (!message) return null;
    return (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            {message}
        </p>
    );
};

// ─── Built-in validators ──────────────────────────────────────────────────────
function runBuiltInValidation(field: FieldDef, value: any): string | undefined {
    // Required check
    if (field.required && (value === '' || value === null || value === undefined)) {
        return `${field.label} is required`;
    }
    // Email format
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Enter a valid email address';
    }
    // Number min
    if (field.type === 'number' && field.min !== undefined && Number(value) < field.min) {
        return `${field.label} must be at least ${field.min}`;
    }
    // Number check
    if (field.type === 'number' && value !== '' && isNaN(Number(value))) {
        return `${field.label} must be a number`;
    }
    return undefined;
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
            toast.error(`Failed to fetch ${title.toLowerCase() || 'items'}`);
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

    // Validate a single field and return error message or undefined
    const validateField = (field: FieldDef, value: any): string | undefined => {
        const builtIn = runBuiltInValidation(field, value);
        if (builtIn) return builtIn;
        return field.validate?.(value, formData);
    };

    // Validate all fields — returns true if valid
    const validateAll = (): boolean => {
        const errors: Record<string, string> = {};
        for (const field of formFields) {
            const err = validateField(field, formData[field.name]);
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
            const err = validateField(field, formData[fieldName]);
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
                const err = validateField(field, value);
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
                                <TableRow>
                                    <TableCell colSpan={columns.length + 1} className="text-center py-12">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                            Loading...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 1} className="text-center py-12 text-muted-foreground">
                                        No {title ? `${title.toLowerCase()} ` : ''}found
                                    </TableCell>
                                </TableRow>
                            ) : paginated.map((item) => (
                                <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                                    {columns.map((col) => (
                                        <TableCell key={col.key}>
                                            {col.render ? col.render(item) : (item as any)[col.key] ?? '—'}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {extraAction?.(item, fetchItems)}
                                            {!readOnly && (
                                                <>
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => {
                if (!open) { setFieldErrors({}); setTouched({}); }
                setDialogOpen(open);
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? editTitle : createTitle}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {formFields.map((field) => (
                            <div key={field.name} className="space-y-1">
                                <Label htmlFor={field.name}>
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                </Label>

                                {field.type === 'select' ? (
                                    <>
                                        <Select
                                            value={formData[field.name] || ''}
                                            onValueChange={(v) => {
                                                handleFieldChange(field.name, v);
                                                handleBlur(field.name);
                                            }}
                                        >
                                            <SelectTrigger className={touched[field.name] && fieldErrors[field.name] ? 'border-red-400 focus:ring-red-400' : ''}>
                                                <SelectValue placeholder={`Select ${field.label}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options?.map((o) => (
                                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {touched[field.name] && <FieldError message={fieldErrors[field.name]} />}
                                    </>
                                ) : field.type === 'textarea' ? (
                                    <>
                                        <textarea
                                            id={field.name}
                                            className={`w-full min-h-[80px] px-3 py-2 rounded-md border bg-background text-sm resize-none transition-colors focus:outline-none focus:ring-1 focus:ring-ring ${touched[field.name] && fieldErrors[field.name] ? 'border-red-400 focus:ring-red-400' : 'border-input'}`}
                                            value={formData[field.name] || ''}
                                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                            onBlur={() => handleBlur(field.name)}
                                            placeholder={field.placeholder}
                                        />
                                        {touched[field.name] && <FieldError message={fieldErrors[field.name]} />}
                                    </>
                                ) : (
                                    <>
                                        <Input
                                            id={field.name}
                                            type={field.type}
                                            value={formData[field.name] ?? ''}
                                            placeholder={field.placeholder}
                                            className={touched[field.name] && fieldErrors[field.name] ? 'border-red-400 focus-visible:ring-red-400' : ''}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    field.name,
                                                    field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value,
                                                )
                                            }
                                            onBlur={() => handleBlur(field.name)}
                                        />
                                        {touched[field.name] && <FieldError message={fieldErrors[field.name]} />}
                                    </>
                                )}
                            </div>
                        ))}
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        {editingItem ? 'Updating...' : 'Creating...'}
                                    </span>
                                ) : (editingItem ? 'Update' : 'Create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default CRUDPage;
