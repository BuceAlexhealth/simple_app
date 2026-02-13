"use client";

import { useState } from "react";
import { Package, Edit2, Trash2, X, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/Select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { InventoryItemSchema, type InventoryItemInput } from "@/lib/validations/inventory";
import { withErrorBoundary } from "@/components/ErrorBoundary";
import { z } from "zod";

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
                        <label className="text-xs font-medium text-[var(--text-muted)]">Stock</label>
                        <Input
                            type="number"
                            className="h-10 text-sm font-medium bg-[var(--surface-bg)]/50 text-[var(--text-muted)] cursor-not-allowed"
                            value={totalStock ?? editForm.stock}
                            disabled
                            title="Stock is managed via Batches"
                        />
                        <p className="text-[10px] text-[var(--text-muted)]">Managed via Batches</p>
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
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
            {/* Product Icon & Name */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[var(--primary-light)] to-[var(--surface-bg)] rounded-xl flex-shrink-0 flex items-center justify-center text-[var(--primary)] shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text-main)] text-base md:text-lg leading-tight group-hover:text-[var(--primary)] transition-colors break-words line-clamp-2" title={item.name}>
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
            <div className="flex flex-row items-center justify-between lg:justify-start gap-4 lg:gap-6 lg:px-6 lg:border-x border-[var(--border)] flex-shrink-0">
                <div className="text-left">
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Price</p>
                    <p className="text-lg md:text-xl font-bold text-[var(--text-main)]">₹{item.price.toFixed(2)}</p>
                </div>
                <div className="text-right lg:text-left min-w-[90px]">
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Stock</p>
                    <Badge
                        variant={(totalStock ?? item.stock) > 10 ? 'success' : (totalStock ?? item.stock) > 0 ? 'warning' : 'destructive'}
                        className="font-semibold text-xs px-2.5 py-1"
                    >
                        {totalStock ?? item.stock} units
                    </Badge>
                    {batchCount > 0 && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center justify-end lg:justify-start gap-1">
                            <Layers className="w-3 h-3" />
                            {batchCount} batch{batchCount !== 1 ? 'es' : ''}
                        </p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-1 flex-shrink-0">
                {onManageBatches && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageBatches(item.id)}
                        className="h-9 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors gap-1"
                    >
                        <Layers className="w-4 h-4" />
                        <span className="hidden sm:inline">Batches</span>
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEditStart}
                    className="h-9 w-9 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    className="h-9 w-9 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

// Wrap with ErrorBoundary using the Higher Order Component
export const InventoryItemCard = withErrorBoundary(InventoryItemCardBase, undefined, (error) => {
    console.error("Inventory Card Error:", error);
});
