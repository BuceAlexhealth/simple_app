"use client";

import { useState, useEffect } from "react";
import { Package, Edit2, Trash2, X, Layers, ChevronDown, ChevronUp, AlertTriangle, Clock, Plus, Save, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/Select";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { InventoryItemSchema, type InventoryItemInput, BatchSchema } from "@/lib/validations/inventory";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { createRepositories } from "@/lib/repositories";
import { isExpired as checkExpired, isExpiringSoon as checkExpiringSoon } from "@/lib/utils/date";

interface InventoryItem {
    id: string;
    name: string;
    brand_name?: string;
    form?: string;
    price: number;
    stock: number;
}

interface InventoryItemCardProps {
    item: InventoryItem;
    isEditing: boolean;
    onEditStart: () => void;
    onEditCancel: () => void;
    onUpdate: (id: string, data: InventoryItemInput) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onManageBatches?: (itemId: string) => void;
    batchCount?: number;
    totalStock?: number;
}

interface BatchSummary {
    id: string;
    batch_code: string;
    expiry_date: string;
    manufacturing_date?: string;
    remaining_qty: number;
    quantity: number;
}

function InventoryItemCardBase({
    item,
    isEditing,
    onEditStart,
    onEditCancel,
    onUpdate,
    onDelete,
    onManageBatches,
    batchCount = 0,
    totalStock
}: InventoryItemCardProps) {
    const [editForm, setEditForm] = useState<InventoryItemInput>({
        name: item.name,
        brand_name: item.brand_name,
        form: item.form || "",
        price: item.price,
        stock: item.stock
    });
    const [errors, setErrors] = useState<Partial<Record<keyof InventoryItemInput, string>>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showBatches, setShowBatches] = useState(false);
    const [batchDetails, setBatchDetails] = useState<BatchSummary[]>([]);
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [showAddBatch, setShowAddBatch] = useState(false);
    const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
    const [newBatch, setNewBatch] = useState({ batch_code: "", quantity: 0, expiry_date: "", manufacturing_date: "" });
    const [editBatch, setEditBatch] = useState({ batch_code: "", quantity: 0, expiry_date: "", manufacturing_date: "" });
    const [batchErrors, setBatchErrors] = useState<Record<string, string>>({});
    const [touchedBatchFields, setTouchedBatchFields] = useState<Record<string, boolean>>({});
    const [savingBatch, setSavingBatch] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const stockValue = totalStock ?? item.stock;
    const isLowStock = stockValue > 0 && stockValue <= 10;
    const isCriticalStock = stockValue > 0 && stockValue <= 3;
    const isOutOfStock = stockValue === 0;

    useEffect(() => {
        if (showBatches && batchDetails.length === 0) {
            const fetchBatches = async () => {
                setLoadingBatches(true);
                try {
                    const { batches } = createRepositories(supabase);
                    const data = await batches.getBatchesByInventoryId(item.id);
                    setBatchDetails(data);
                } catch (err) {
                    console.error("Failed to fetch batches", err);
                } finally {
                    setLoadingBatches(false);
                }
            };
            fetchBatches();
        }
    }, [showBatches, item.id, batchDetails.length]);

    const getBatchStatus = (batch: BatchSummary) => {
        if (batch.remaining_qty === 0) return 'depleted';
        if (checkExpired(batch.expiry_date)) return 'expired';
        if (checkExpiringSoon(batch.expiry_date)) return 'expiring';
        return 'active';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const validate = () => {
        try {
            InventoryItemSchema.parse(editForm);
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {};
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        fieldErrors[err.path[0] as string] = err.message;
                    }
                });
                setErrors(fieldErrors);
            }
            return false;
        }
    };

    const handleSave = async () => {
        if (!validate()) {
            toast.error("Please fix the validation errors");
            return;
        }

        setIsSaving(true);
        try {
            await onUpdate(item.id, editForm);
        } catch (error) {
            console.error("Failed to update item", error);
        } finally {
            setIsSaving(false);
        }
    };

    const validateBatchField = (field: keyof typeof newBatch, value: string | number) => {
        const fieldErrors: Record<string, string> = { ...batchErrors };
        
        switch (field) {
            case 'batch_code':
                if (!value || (typeof value === 'string' && value.length < 3)) {
                    fieldErrors.batch_code = 'Required (min 3 characters)';
                } else {
                    delete fieldErrors.batch_code;
                }
                break;
            case 'quantity':
                if (!value || (typeof value === 'number' && value <= 0)) {
                    fieldErrors.quantity = 'Must be greater than 0';
                } else {
                    delete fieldErrors.quantity;
                }
                break;
            case 'expiry_date':
                if (!value) {
                    fieldErrors.expiry_date = 'Required';
                } else {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const expiry = new Date(value as string);
                    if (expiry < today) {
                        fieldErrors.expiry_date = 'Must be in the future';
                    } else {
                        delete fieldErrors.expiry_date;
                    }
                }
                break;
            case 'manufacturing_date':
                if (!value) {
                    fieldErrors.manufacturing_date = 'Required';
                } else if (newBatch.expiry_date) {
                    const mfg = new Date(value as string);
                    const expiry = new Date(newBatch.expiry_date);
                    if (mfg >= expiry) {
                        fieldErrors.manufacturing_date = 'Must be before expiry';
                    } else {
                        delete fieldErrors.manufacturing_date;
                    }
                } else {
                    delete fieldErrors.manufacturing_date;
                }
                break;
        }
        
        setBatchErrors(fieldErrors);
        return Object.keys(fieldErrors).length === 0;
    };

    const isBatchFormValid = () => {
        return (
            newBatch.batch_code.length >= 3 &&
            newBatch.quantity > 0 &&
            newBatch.expiry_date &&
            newBatch.manufacturing_date
        );
    };

    const handleBatchFieldBlur = (field: keyof typeof newBatch) => {
        setTouchedBatchFields(prev => ({ ...prev, [field]: true }));
        validateBatchField(field, newBatch[field]);
    };

    const handleAddBatch = async () => {
        // Validate all fields
        const isValid = 
            validateBatchField('batch_code', newBatch.batch_code) &&
            validateBatchField('quantity', newBatch.quantity) &&
            validateBatchField('expiry_date', newBatch.expiry_date) &&
            validateBatchField('manufacturing_date', newBatch.manufacturing_date);

        if (!isValid) {
            toast.error("Please fix the validation errors");
            return;
        }

        setSavingBatch(true);
        try {
            const { batches } = createRepositories(supabase);
            await batches.addBatch({
                inventory_id: item.id,
                pharmacy_id: item.id,
                batch_code: newBatch.batch_code,
                manufacturing_date: newBatch.manufacturing_date,
                expiry_date: newBatch.expiry_date,
                quantity: newBatch.quantity || 0,
                created_by: item.id,
            });
            toast.success("Batch added");
            setNewBatch({ batch_code: "", quantity: 0, expiry_date: "", manufacturing_date: "" });
            setShowAddBatch(false);
            const data = await batches.getBatchesByInventoryId(item.id);
            setBatchDetails(data);
            if (onManageBatches) onManageBatches(item.id);
        } catch (error) {
            toast.error("Failed to add batch");
        } finally {
            setSavingBatch(false);
        }
    };

    const handleDeleteBatch = async (batchId: string) => {
        if (!confirm("Delete this batch?")) return;
        try {
            const { batches } = createRepositories(supabase);
            await batches.deleteBatch(batchId);
            toast.success("Batch deleted");
            const data = await batches.getBatchesByInventoryId(item.id);
            setBatchDetails(data);
            if (onManageBatches) onManageBatches(item.id);
        } catch (error) {
            toast.error("Failed to delete batch");
        }
    };

    const startEditBatch = (batch: BatchSummary) => {
        setEditBatch({
            batch_code: batch.batch_code,
            quantity: batch.quantity,
            expiry_date: batch.expiry_date ? batch.expiry_date.split('T')[0] : '',
            manufacturing_date: batch.manufacturing_date ? batch.manufacturing_date.split('T')[0] : '',
        });
        setEditingBatchId(batch.id);
    };

    const handleUpdateBatch = async (batchId: string) => {
        setSavingBatch(true);
        try {
            const { batches } = createRepositories(supabase);
            await batches.updateBatch(batchId, {
                batch_code: editBatch.batch_code,
                quantity: editBatch.quantity,
                expiry_date: editBatch.expiry_date,
            });
            toast.success("Batch updated");
            setEditingBatchId(null);
            const data = await batches.getBatchesByInventoryId(item.id);
            setBatchDetails(data);
            if (onManageBatches) onManageBatches(item.id);
        } catch (error) {
            toast.error("Failed to update batch");
        } finally {
            setSavingBatch(false);
        }
    };

    if (isEditing) {
        return (
            <div className="space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-sm text-[var(--primary)]">Edit Product</h3>
                    <Button variant="ghost" size="icon" onClick={onEditCancel} className="h-8 w-8 rounded-lg hover:bg-[var(--surface-bg)]">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-medium text-[var(--text-muted)]">Product Name</label>
                        <Input
                            className={`h-10 text-sm font-medium bg-[var(--surface-bg)]/50 ${errors.name ? 'border-[var(--error)]' : ''}`}
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        {errors.name && <p className="text-xs text-[var(--error)]">{errors.name}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-medium text-[var(--text-muted)]">Brand Name</label>
                        <Input
                            className={`h-10 text-sm font-medium bg-[var(--surface-bg)]/50 ${errors.brand_name ? 'border-[var(--error)]' : ''}`}
                            value={editForm.brand_name || ""}
                            onChange={(e) => setEditForm({ ...editForm, brand_name: e.target.value })}
                        />
                        {errors.brand_name && <p className="text-xs text-[var(--error)]">{errors.brand_name}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--text-muted)]">Form</label>
                        <Select
                            value={editForm.form || ""}
                            onChange={(value) => setEditForm({ ...editForm, form: value })}
                        >
                            <SelectTrigger className={`h-10 bg-[var(--surface-bg)]/50 text-sm ${errors.form ? 'border-[var(--error)]' : ''}`} placeholder="Select Form" />
                            <SelectContent>
                                <SelectItem value="Tablet">Tablet</SelectItem>
                                <SelectItem value="Capsule">Capsule</SelectItem>
                                <SelectItem value="Syrup">Syrup</SelectItem>
                                <SelectItem value="Injection">Injection</SelectItem>
                                <SelectItem value="Drop">Drop</SelectItem>
                                <SelectItem value="Cream">Cream</SelectItem>
                                <SelectItem value="Gel">Gel</SelectItem>
                                <SelectItem value="Ointment">Ointment</SelectItem>
                                <SelectItem value="Powder">Powder</SelectItem>
                                <SelectItem value="Spray">Spray</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.form && <p className="text-xs text-[var(--error)]">{errors.form}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--text-muted)]">Price (₹)</label>
                        <Input
                            type="number"
                            className={`h-10 text-sm font-medium bg-[var(--surface-bg)]/50 ${errors.price ? 'border-[var(--error)]' : ''}`}
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                        />
                        {errors.price && <p className="text-xs text-[var(--error)]">{errors.price}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                            Stock
                            <span className="text-[var(--text-muted)]/60">(auto-calculated from batches)</span>
                        </label>
                        <Input
                            type="number"
                            className="h-10 text-sm font-medium bg-[var(--surface-bg)]/50 text-[var(--text-muted)] cursor-not-allowed"
                            value={totalStock ?? editForm.stock}
                            disabled
                        />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3">
                    <Button variant="outline" className="w-full sm:w-auto px-5 h-9 rounded-lg text-sm" onClick={onEditCancel} disabled={isSaving}>Cancel</Button>
                    <Button
                        variant="default"
                        className="w-full sm:w-auto px-5 h-9 rounded-lg text-sm"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Top Row: Product Info + Price + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Product Icon & Name */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[var(--primary-light)] to-[var(--surface-bg)] rounded-xl flex-shrink-0 flex items-center justify-center text-[var(--primary)] shadow-sm">
                        <Package className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[var(--text-main)] text-base md:text-lg leading-tight break-words line-clamp-2" title={item.name}>
                            {item.name}
                        </h3>
                        {(item.brand_name || item.form) && (
                            <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-2 flex-wrap">
                                {item.brand_name && <span className="font-medium truncate max-w-[150px]">{item.brand_name}</span>}
                                {item.brand_name && item.form && <span className="text-[var(--border)]">|</span>}
                                {item.form && <span className="text-xs uppercase tracking-wide bg-[var(--surface-bg)] px-2 py-0.5 rounded-md flex-shrink-0">{item.form}</span>}
                            </p>
                        )}
                    </div>
                </div>

                {/* Price & Stock */}
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 sm:px-4 border-t sm:border-t-0 sm:border-x border-[var(--border)] pt-3 sm:pt-0">
                    <div className="text-left">
                        <p className="text-xs text-[var(--text-muted)] mb-0.5">Price</p>
                        <p className="text-lg md:text-xl font-bold text-[var(--text-main)]">₹{item.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right min-w-[90px]">
                        <p className="text-xs text-[var(--text-muted)] mb-0.5">Stock</p>
                        <Badge
                            variant={stockValue > 10 ? 'success' : isCriticalStock ? 'destructive' : isLowStock ? 'warning' : 'destructive'}
                            className="font-semibold text-xs px-2.5 py-1"
                        >
                            {stockValue} units
                        </Badge>
                        {batchCount > 0 && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                {batchCount} batch{batchCount !== 1 ? 'es' : ''}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBatches(!showBatches)}
                        className={`h-10 rounded-lg gap-1 transition-colors ${showBatches ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]'}`}
                    >
                        <Layers className="w-4 h-4" />
                        <span className="hidden sm:inline">{showBatches ? 'Hide' : 'Batches'}</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onEditStart}
                        className="h-10 w-10 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowDeleteModal(true)}
                        className="h-10 w-10 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Expandable Batch Details - Full Width */}
            <AnimatePresence>
                {showBatches && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden w-full"
                    >
                        <div className="pt-3 mt-3 border-t border-[var(--border)]">
                            {loadingBatches ? (
                                <p className="text-xs text-[var(--text-muted)] text-center py-2">Loading batches...</p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-[var(--text-muted)]">Batch Details</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowAddBatch(!showAddBatch)}
                                            className="h-7 text-xs gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Batch
                                        </Button>
                                    </div>

                                    {/* Add Batch Form */}
                                    {showAddBatch && (
                                        <div className="p-3 bg-[var(--surface-bg)] rounded-lg space-y-3 border border-[var(--border)]">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Input
                                                        placeholder="Batch code *"
                                                        value={newBatch.batch_code}
                                                        onChange={(e) => {
                                                            setNewBatch({ ...newBatch, batch_code: e.target.value });
                                                            if (touchedBatchFields.batch_code) {
                                                                validateBatchField('batch_code', e.target.value);
                                                            }
                                                        }}
                                                        onBlur={() => handleBatchFieldBlur('batch_code')}
                                                        className={`h-9 text-sm ${touchedBatchFields.batch_code && batchErrors.batch_code ? 'border-[var(--error)]' : ''}`}
                                                    />
                                                    {touchedBatchFields.batch_code && batchErrors.batch_code && (
                                                        <p className="text-xs text-[var(--error)]">{batchErrors.batch_code}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <Input
                                                        type="number"
                                                        placeholder="Quantity *"
                                                        value={newBatch.quantity || ''}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setNewBatch({ ...newBatch, quantity: val });
                                                            if (touchedBatchFields.quantity) {
                                                                validateBatchField('quantity', val);
                                                            }
                                                        }}
                                                        onBlur={() => handleBatchFieldBlur('quantity')}
                                                        className={`h-9 text-sm ${touchedBatchFields.quantity && batchErrors.quantity ? 'border-[var(--error)]' : ''}`}
                                                    />
                                                    {touchedBatchFields.quantity && batchErrors.quantity && (
                                                        <p className="text-xs text-[var(--error)]">{batchErrors.quantity}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Input
                                                        type="date"
                                                        placeholder="Manufacturing date *"
                                                        value={newBatch.manufacturing_date}
                                                        onChange={(e) => {
                                                            setNewBatch({ ...newBatch, manufacturing_date: e.target.value });
                                                            if (touchedBatchFields.manufacturing_date) {
                                                                validateBatchField('manufacturing_date', e.target.value);
                                                            }
                                                        }}
                                                        onBlur={() => handleBatchFieldBlur('manufacturing_date')}
                                                        className={`h-9 text-sm ${touchedBatchFields.manufacturing_date && batchErrors.manufacturing_date ? 'border-[var(--error)]' : ''}`}
                                                    />
                                                    {touchedBatchFields.manufacturing_date && batchErrors.manufacturing_date && (
                                                        <p className="text-xs text-[var(--error)]">{batchErrors.manufacturing_date}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <Input
                                                        type="date"
                                                        placeholder="Expiry date *"
                                                        value={newBatch.expiry_date}
                                                        onChange={(e) => {
                                                            setNewBatch({ ...newBatch, expiry_date: e.target.value });
                                                            if (touchedBatchFields.expiry_date) {
                                                                validateBatchField('expiry_date', e.target.value);
                                                            }
                                                        }}
                                                        onBlur={() => handleBatchFieldBlur('expiry_date')}
                                                        className={`h-9 text-sm ${touchedBatchFields.expiry_date && batchErrors.expiry_date ? 'border-[var(--error)]' : ''}`}
                                                    />
                                                    {touchedBatchFields.expiry_date && batchErrors.expiry_date && (
                                                        <p className="text-xs text-[var(--error)]">{batchErrors.expiry_date}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-1">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        setShowAddBatch(false);
                                                        setBatchErrors({});
                                                        setTouchedBatchFields({});
                                                        setNewBatch({ batch_code: "", quantity: 0, expiry_date: "", manufacturing_date: "" });
                                                    }} 
                                                    className="h-9 text-sm px-4"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    onClick={handleAddBatch} 
                                                    disabled={savingBatch || !isBatchFormValid()} 
                                                    className="h-9 text-sm px-4 gap-1"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Batch List */}
                                    <div className="grid gap-1.5 max-h-48 overflow-y-auto">
                                        {batchDetails.map((batch) => {
                                            const status = getBatchStatus(batch);
                                            const isEditing = editingBatchId === batch.id;
                                            
                                            if (isEditing) {
                                                return (
                                                    <div key={batch.id} className="p-2 rounded-lg border border-[var(--primary)] bg-[var(--surface-bg)]">
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            <div className="flex-1 min-w-[140px]">
                                                                <label className="text-[10px] text-[var(--text-muted)] block mb-1">Batch Code</label>
                                                                <Input
                                                                    value={editBatch.batch_code}
                                                                    onChange={(e) => setEditBatch({ ...editBatch, batch_code: e.target.value })}
                                                                    placeholder="BAT-001"
                                                                    className="h-7 text-xs"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-[80px] max-w-[100px]">
                                                                <label className="text-[10px] text-[var(--text-muted)] block mb-1">Qty</label>
                                                                <Input
                                                                    type="number"
                                                                    value={editBatch.quantity || ''}
                                                                    onChange={(e) => setEditBatch({ ...editBatch, quantity: parseInt(e.target.value) || 0 })}
                                                                    placeholder="0"
                                                                    className="h-7 text-xs"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-[140px]">
                                                                <label className="text-[10px] text-[var(--text-muted)] block mb-1">Mfg Date</label>
                                                                <Input
                                                                    type="date"
                                                                    value={editBatch.manufacturing_date}
                                                                    onChange={(e) => setEditBatch({ ...editBatch, manufacturing_date: e.target.value })}
                                                                    className="h-7 text-xs"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-[140px]">
                                                                <label className="text-[10px] text-[var(--text-muted)] block mb-1">Expiry Date</label>
                                                                <Input
                                                                    type="date"
                                                                    value={editBatch.expiry_date}
                                                                    onChange={(e) => setEditBatch({ ...editBatch, expiry_date: e.target.value })}
                                                                    className="h-7 text-xs"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-1">
                                                            <Button size="sm" variant="ghost" onClick={() => setEditingBatchId(null)} className="h-6 text-xs">Cancel</Button>
                                                            <Button size="sm" onClick={() => handleUpdateBatch(batch.id)} disabled={savingBatch} className="h-6 text-xs">Save</Button>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            
                                            return (
                                                <div 
                                                    key={batch.id}
                                                    className={`flex items-center justify-between text-xs p-2 rounded-lg ${
                                                        status === 'expired' ? 'bg-[var(--error-bg)]' :
                                                        status === 'expiring' ? 'bg-[var(--warning-bg)]' :
                                                        status === 'depleted' ? 'bg-[var(--surface-bg)]' :
                                                        'bg-[var(--success-bg)]'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{batch.batch_code}</span>
                                                        <span className="text-[var(--text-muted)]">Exp: {formatDate(batch.expiry_date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-semibold ${
                                                            status === 'expired' ? 'text-[var(--error)]' :
                                                            status === 'expiring' ? 'text-[var(--warning)]' :
                                                            status === 'depleted' ? 'text-[var(--text-muted)]' :
                                                            'text-[var(--success)]'
                                                        }`}>
                                                            {batch.remaining_qty}/{batch.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => startEditBatch(batch)}
                                                            className="p-2 hover:bg-white/50 rounded text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteBatch(batch.id)}
                                                            className="p-2 hover:bg-[var(--error-bg)] rounded text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationDialog
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={() => onDelete(item.id)}
                title="Delete Product"
                description="Are you sure you want to delete this product? This action cannot be undone."
                itemName={item.name}
            />
        </div>
    );
}

// Wrap with ErrorBoundary using the Higher Order Component
export const InventoryItemCard = withErrorBoundary(InventoryItemCardBase, undefined, (error) => {
    console.error("Inventory Card Error:", error);
});
