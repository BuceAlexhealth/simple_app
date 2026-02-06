"use client";

import { useState, useMemo } from "react";
import { Plus, Package, X, Search, Boxes, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useInventory } from "@/hooks/useInventory";
import { useUser } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { handleAsyncError } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";
import { InventoryItemSchema, type InventoryItemInput } from "@/lib/validations/inventory";

// Reusable components
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  SearchInput,
  StatsGrid,
  AnimatedList
} from "@/components";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/Select";
import { AnimatePresence, motion } from "framer-motion";
import { InventoryItemCard } from "./InventoryItemCard";

interface InventoryItem {
    id: string;
    name: string;
    brand_name?: string;
    form?: string;
    price: number;
    stock: number;
    image_url?: string;
}

export default function InventoryPage() {
    const { user } = useUser();
    const { items, loading, refetch } = useInventory();
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState<InventoryItemInput>({ 
        name: "", 
        brand_name: "", 
        form: "", 
        price: 0, 
        stock: 0 
    });
    const [addItemErrors, setAddItemErrors] = useState<Partial<Record<keyof InventoryItemInput, string>>>({});
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const filteredItems = useMemo(() => {
        return items.filter((item: InventoryItem) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.brand_name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [items, search]);

    const stats = useMemo(() => [
        { label: "Total Products", value: items.length },
        { label: "Inventory Value", value: `₹${items.reduce((sum, item) => sum + (item.price * item.stock), 0).toLocaleString()}` },
        { label: "Low Stock", value: items.filter((i) => i.stock > 0 && i.stock <= 10).length, color: "warning" as const },
        { label: "Out of Stock", value: items.filter((i) => i.stock === 0).length, color: "error" as const },
    ], [items]);

    async function handleAddItem() {
        try {
            InventoryItemSchema.parse(newItem);
            setAddItemErrors({});
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: any = {};
                error.issues.forEach((err) => {
                    if (err.path[0]) fieldErrors[err.path[0]] = err.message;
                });
                setAddItemErrors(fieldErrors);
                toast.error("Please fix the validation errors");
                return;
            }
        }

        if (!user) return toast.error("You must be logged in to add items");

        const { inventory } = createRepositories(supabase);
        const success = await handleAsyncError(
            () => inventory.addItem({
                pharmacy_id: user.id,
                name: newItem.name,
                brand_name: newItem.brand_name,
                form: newItem.form,
                price: newItem.price,
                stock: newItem.stock,
            }),
            "Error adding item"
        );

        if (success) {
            toast.success("Item added successfully");
            setNewItem({ name: "", brand_name: "", form: "", price: 0, stock: 0 });
            setIsAdding(false);
            refetch();
        }
    }

    async function handleUpdateItem(id: string, data: InventoryItemInput) {
        const { inventory } = createRepositories(supabase);
        const success = await handleAsyncError(
            () => inventory.updateItem(id, {
                name: data.name,
                brand_name: data.brand_name,
                form: data.form,
                price: data.price,
                stock: data.stock
            }),
            "Error updating item"
        );

        if (success) {
            toast.success("Item updated successfully");
            setEditingItemId(null);
            refetch();
        }
    }

    async function handleDeleteItem(id: string) {
        if (!confirm("Are you sure you want to delete this item?")) return;

        const { inventory } = createRepositories(supabase);
        const success = await handleAsyncError(
            () => inventory.deleteItem(id),
            "Error deleting item"
        );

        if (success) {
            toast.success("Item deleted successfully");
            refetch();
        }
    }

    return (
        <PageContainer>
            {/* Header */}
            <PageHeader
                icon={Boxes}
                label="Inventory Management"
                title="Stock Control"
                subtitle="Manage your medicine availability and pricing"
            >
                <Button onClick={() => setIsAdding(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                </Button>
            </PageHeader>

            {/* Stats */}
            {!loading && items.length > 0 && (
                <StatsGrid stats={stats} columns={4} />
            )}

            {/* Search */}
            <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search products by name or brand..."
            />

            {/* Add Product Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="border-[var(--primary)]">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[var(--primary-light)] rounded-lg flex items-center justify-center">
                                            <Plus className="w-5 h-5 text-[var(--primary)]" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Add New Product</CardTitle>
                                            <CardDescription>Fill in the details below</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-muted)]">Product Name *</label>
                                        <Input
                                            placeholder="e.g., Paracetamol 500mg"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                            className={addItemErrors.name ? 'border-red-500' : ''}
                                        />
                                        {addItemErrors.name && <p className="text-xs text-red-500">{addItemErrors.name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-muted)]">Brand Name</label>
                                        <Input
                                            placeholder="e.g., Crocin"
                                            value={newItem.brand_name || ""}
                                            onChange={(e) => setNewItem({ ...newItem, brand_name: e.target.value })}
                                            className={addItemErrors.brand_name ? 'border-red-500' : ''}
                                        />
                                        {addItemErrors.brand_name && <p className="text-xs text-red-500">{addItemErrors.brand_name}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-muted)]">Form</label>
                                        <Select
                                            value={newItem.form || ""}
                                            onChange={(value) => setNewItem({ ...newItem, form: value })}
                                        >
                                            <SelectTrigger placeholder="Select form" className={addItemErrors.form ? 'border-red-500' : ''} />
                                            <SelectContent>
                                                {["Tablet", "Capsule", "Syrup", "Injection", "Drop", "Cream", "Gel", "Ointment", "Powder", "Spray", "Other"].map(form => (
                                                    <SelectItem key={form} value={form}>{form}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {addItemErrors.form && <p className="text-xs text-red-500">{addItemErrors.form}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-muted)]">Price (₹) *</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={newItem.price || ''}
                                            onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                                            className={addItemErrors.price ? 'border-red-500' : ''}
                                        />
                                        {addItemErrors.price && <p className="text-xs text-red-500">{addItemErrors.price}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-muted)]">Stock *</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={newItem.stock || ''}
                                            onChange={(e) => setNewItem({ ...newItem, stock: parseInt(e.target.value) || 0 })}
                                            className={addItemErrors.stock ? 'border-red-500' : ''}
                                        />
                                        {addItemErrors.stock && <p className="text-xs text-red-500">{addItemErrors.stock}</p>}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                                    <Button onClick={handleAddItem}>Add Product</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inventory List */}
            <AnimatedList
                items={filteredItems}
                keyExtractor={(item) => item.id}
                renderItem={(item) => (
                    <Card className={editingItemId === item.id ? 'ring-2 ring-[var(--primary)] border-[var(--primary)]' : ''}>
                        <CardContent className="p-5">
                            <InventoryItemCard
                                item={item}
                                isEditing={editingItemId === item.id}
                                onEditStart={() => setEditingItemId(item.id)}
                                onEditCancel={() => setEditingItemId(null)}
                                onUpdate={handleUpdateItem}
                                onDelete={handleDeleteItem}
                            />
                        </CardContent>
                    </Card>
                )}
                loading={loading}
                emptyIcon={search ? Search : Package}
                emptyTitle="Inventory Empty"
                emptyDescription="Start by adding your first product to the inventory."
                searchTerm={search}
                onClearSearch={() => setSearch("")}
                emptyAction={
                    <Button onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Product
                    </Button>
                }
            />
        </PageContainer>
    );
}
