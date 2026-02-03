"use client";

import { useState } from "react";
import { Package, Edit2, Trash2, X } from "lucide-react";
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
}

function InventoryItemCardBase({
    item,
    isEditing,
    onEditStart,
    onEditCancel,
    onUpdate,
    onDelete
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
                const fieldErrors: any = {};
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        fieldErrors[err.path[0]] = err.message;
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
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-black text-xs uppercase tracking-widest text-[var(--primary)]">Edit Product</h3>
                    <Button variant="ghost" size="icon" onClick={onEditCancel} className="h-8 w-8 rounded-lg">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Product Name</label>
                        <Input
                            className={`h-12 text-base font-bold bg-white/50 ${errors.name ? 'border-red-500' : ''}`}
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Brand Name</label>
                        <Input
                            className={`h-12 text-base font-bold bg-white/50 ${errors.brand_name ? 'border-red-500' : ''}`}
                            value={editForm.brand_name || ""}
                            onChange={(e) => setEditForm({ ...editForm, brand_name: e.target.value })}
                        />
                        {errors.brand_name && <p className="text-xs text-red-500 font-medium">{errors.brand_name}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Form</label>
                        <Select
                            value={editForm.form || ""}
                            onChange={(value) => setEditForm({ ...editForm, form: value })}
                        >
                            <SelectTrigger className={`bg-white/50 font-bold ${errors.form ? 'border-red-500' : ''}`} placeholder="Select Form" />
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
                        {errors.form && <p className="text-xs text-red-500 font-medium">{errors.form}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Price (₹)</label>
                        <Input
                            type="number"
                            className={`h-12 text-base font-bold bg-white/50 ${errors.price ? 'border-red-500' : ''}`}
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                        />
                        {errors.price && <p className="text-xs text-red-500 font-medium">{errors.price}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Stock</label>
                        <Input
                            type="number"
                            className={`h-12 text-base font-bold bg-white/50 ${errors.stock ? 'border-red-500' : ''}`}
                            value={editForm.stock}
                            onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                        />
                        {errors.stock && <p className="text-xs text-red-500 font-medium">{errors.stock}</p>}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--border)] border-dashed">
                    <Button variant="ghost" className="w-full sm:w-auto px-6 h-11 rounded-xl font-bold" onClick={onEditCancel} disabled={isSaving}>Cancel</Button>
                    <Button
                        variant="default"
                        className="w-full sm:w-auto px-8 h-11 rounded-xl font-black uppercase tracking-widest text-xs glow-primary"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Product Icon & Name */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[var(--surface-bg)] rounded-2xl flex-shrink-0 flex items-center justify-center text-[var(--primary)] shadow-sm group-hover:scale-110 transition-transform duration-500 mt-1">
                    <Package className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-[var(--text-main)] text-lg md:text-xl italic break-words group-hover:text-[var(--primary)] transition-colors leading-tight">
                        {item.name}
                    </h3>
                    {item.brand_name && (
                        <p className="text-sm font-medium text-[var(--text-muted)] mt-1">
                            {item.brand_name} {item.form && <span className="text-[var(--primary)] mx-1">•</span>} {item.form}
                        </p>
                    )}
                    {!item.brand_name && item.form && (
                        <p className="text-sm font-medium text-[var(--text-muted)] mt-1">
                            {item.form}
                        </p>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 mt-1">ID: {item.id.slice(0, 8)}</p>
                </div>
            </div>

            {/* Price & Stock */}
            <div className="flex flex-row items-center justify-between lg:justify-start gap-8 lg:gap-12 px-2 lg:px-6 lg:border-x border-[var(--border)] border-dashed flex-shrink-0">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Price</p>
                    <p className="text-xl md:text-2xl font-black text-[var(--text-main)] whitespace-nowrap">₹{item.price}</p>
                </div>
                <div className="space-y-1.5 text-right lg:text-left min-w-[80px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Stock</p>
                    <Badge
                        variant={item.stock > 10 ? 'success' : item.stock > 0 ? 'warning' : 'destructive'}
                        className="font-black text-[10px] px-3 md:px-4 py-1.5 uppercase tracking-widest"
                    >
                        {item.stock} Units
                    </Badge>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 border-[var(--border)] border-dashed lg:border-none flex-shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEditStart}
                    className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
                >
                    <Edit2 className="w-5 h-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-all"
                >
                    <Trash2 className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}

// Wrap with ErrorBoundary using the Higher Order Component
export const InventoryItemCard = withErrorBoundary(InventoryItemCardBase, undefined, (error) => {
    console.error("Inventory Card Error:", error);
});
