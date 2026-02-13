"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Package, X, Search, Boxes, Loader2, Layers } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useInventory } from "@/hooks/useInventory";
import { useBatches } from "@/hooks/useBatches";
import { useUser } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { handleAsyncError } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";
import { InventoryItemSchema, type InventoryItemInput, BatchSchema } from "@/lib/validations/inventory";

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
import { BatchManagementModal } from "@/components/pharmacy/BatchManagementModal";

interface InventoryItem {
    id: string;
    name: string;
    brand_name?: string;
    form?: string;
    price: number;
    stock: number;
    image_url?: string;
}

interface BatchInfo {
    [itemId: string]: {
        count: number;
        totalStock: number;
    };
}

export default function InventoryPage() {
    const { user } = useUser();
    const { items, loading, refetch } = useInventory();
    const [isAdding, setIsAdding] = useState(false);
    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [selectedItemForBatch, setSelectedItemForBatch] = useState<{ id: string; name: string } | null>(null);
    const [batchInfo, setBatchInfo] = useState<BatchInfo>({});

    const [newItem, setNewItem] = useState<InventoryItemInput>({
        name: "",
        brand_name: "",
        form: "",
        price: 0,
        stock: 0
    });

    const [newBatch, setNewBatch] = useState({
        batch_code: "",
        manufacturing_date: "",
        expiry_date: "",
        quantity: 0,
    });

    const [addItemErrors, setAddItemErrors] = useState<Partial<Record<keyof InventoryItemInput, string>>>({});
    const [addBatchErrors, setAddBatchErrors] = useState<Partial<Record<keyof typeof newBatch, string>>>({});
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [isAddingWithBatch, setIsAddingWithBatch] = useState(false);

    // Fetch batch info for all items
    useEffect(() => {
        const fetchBatchInfo = async () => {
            const info: BatchInfo = {};
            for (const item of items) {
                const { batches } = createRepositories(supabase);
                const itemBatches = await batches.getBatchesByInventoryId(item.id);
                info[item.id] = {
                    count: itemBatches.length,
                    totalStock: itemBatches.reduce((sum, b) => sum + b.remaining_qty, 0),
                };
            }
            setBatchInfo(info);
        };
        if (items.length > 0) {
            fetchBatchInfo();
        }
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter((item: InventoryItem) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.brand_name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [items, search]);

    const stats = useMemo(() => [
        { label: "Total Products", value: items.length },
        {
            label: "Inventory Value", value: `₹${items.reduce((sum, item) => {
                const info = batchInfo[item.id];
                const stock = info?.totalStock ?? item.stock;
                return sum + (item.price * stock);
            }, 0).toLocaleString()}`
        },
        {
            label: "Low Stock", value: items.filter((i) => {
                const info = batchInfo[i.id];
                const stock = info?.totalStock ?? i.stock;
                return stock > 0 && stock <= 10;
            }).length, color: "warning" as const
        },
        {
            label: "Out of Stock", value: items.filter((i) => {
                const info = batchInfo[i.id];
                const stock = info?.totalStock ?? i.stock;
                return stock === 0;
            }).length, color: "error" as const
        },
    ], [items, batchInfo]);

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

        // If adding with batch, validate batch
        if (isAddingWithBatch) {
            try {
                BatchSchema.parse(newBatch);
                setAddBatchErrors({});
            } catch (error) {
                if (error instanceof z.ZodError) {
                    const fieldErrors: any = {};
                    error.issues.forEach((err) => {
                        if (err.path[0]) fieldErrors[err.path[0]] = err.message;
                    });
                    setAddBatchErrors(fieldErrors);
                    toast.error("Please fix batch validation errors");
                    return;
                }
            }
        }

        const { inventory, batches } = createRepositories(supabase);

        // First create the inventory item with 0 stock (will be managed by batches)
        const success = await handleAsyncError(
            () => inventory.addItem({
                pharmacy_id: user.id,
                name: newItem.name,
                brand_name: newItem.brand_name,
                form: newItem.form,
                price: newItem.price,
                stock: 0, // Stock will be managed by batches
            }),
            "Error adding item"
        );

        if (success) {
            // If adding with batch, create the batch
            if (isAddingWithBatch && newBatch.batch_code && newBatch.manufacturing_date && newBatch.expiry_date) {
                // Get the newly created item
                const { data: items } = await supabase
                    .from("inventory")
                    .select("id")
                    .eq("pharmacy_id", user.id)
                    .eq("name", newItem.name)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                if (items) {
                    await batches.addBatch({
                        inventory_id: items.id,
                        pharmacy_id: user.id,
                        batch_code: newBatch.batch_code,
                        manufacturing_date: newBatch.manufacturing_date,
                        expiry_date: newBatch.expiry_date,
                        quantity: newBatch.quantity || 0,
                        created_by: user.id,
                    });
                }
            }

            toast.success("Item added successfully");
            setNewItem({ name: "", brand_name: "", form: "", price: 0, stock: 0 });
            setNewBatch({ batch_code: "", manufacturing_date: "", expiry_date: "", quantity: 0 });
            setIsAddingWithBatch(false);
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
                                            className={addItemErrors.name ? 'border-[var(--error)]' : ''}
                                        />
                                        {addItemErrors.name && <p className="text-xs text-[var(--error)]">{addItemErrors.name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-muted)]">Brand Name</label>
                                        <Input
                                            placeholder="e.g., Crocin"
                                            value={newItem.brand_name || ""}
                                            onChange={(e) => setNewItem({ ...newItem, brand_name: e.target.value })}
                                            className={addItemErrors.brand_name ? 'border-[var(--error)]' : ''}
                                        />
                                        {addItemErrors.brand_name && <p className="text-xs text-[var(--error)]">{addItemErrors.brand_name}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-muted)]">Form</label>
                                        <Select
                                            value={newItem.form || ""}
                                            onChange={(value) => setNewItem({ ...newItem, form: value })}
                                        >
                                            <SelectTrigger placeholder="Select form" className={addItemErrors.form ? 'border-[var(--error)]' : ''} />
                                            <SelectContent>
                                                {["Tablet", "Capsule", "Syrup", "Injection", "Drop", "Cream", "Gel", "Ointment", "Powder", "Spray", "Other"].map(form => (
                                                    <SelectItem key={form} value={form}>{form}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {addItemErrors.form && <p className="text-xs text-[var(--error)]">{addItemErrors.form}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-muted)]">Price (₹) *</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={newItem.price || ''}
                                            onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                                            className={addItemErrors.price ? 'border-[var(--error)]' : ''}
                                        />
                                        {addItemErrors.price && <p className="text-xs text-[var(--error)]">{addItemErrors.price}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-muted)]">Add Initial Batch</label>
                                        <Button
                                            type="button"
                                            variant={isAddingWithBatch ? "default" : "outline"}
                                            onClick={() => setIsAddingWithBatch(!isAddingWithBatch)}
                                            className="w-full"
                                        >
                                            <Layers className="w-4 h-4 mr-2" />
                                            {isAddingWithBatch ? "With Initial Batch" : "No Initial Stock"}
                                        </Button>
                                    </div>
                                </div>

                                {!isAddingWithBatch && (
                                    <div className="p-3 bg-[var(--info-bg)] text-[var(--info)] text-sm rounded-lg flex gap-2 items-start">
                                        <Layers className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p>New products start with 0 stock. You can add batches later to increase stock.</p>
                                    </div>
                                )}

                                {/* Batch Fields */}
                                {isAddingWithBatch && (
                                    <div className="p-4 bg-[var(--surface-bg)] rounded-lg space-y-4 border border-[var(--border)]">
                                        <p className="text-sm font-medium text-[var(--text-muted)]">Initial Batch Details</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-[var(--text-muted)]">Batch Code *</label>
                                                <Input
                                                    placeholder="e.g., BAT-2026-001"
                                                    value={newBatch.batch_code}
                                                    onChange={(e) => setNewBatch({ ...newBatch, batch_code: e.target.value })}
                                                    className={addBatchErrors.batch_code ? 'border-[var(--error)]' : ''}
                                                />
                                                {addBatchErrors.batch_code && <p className="text-xs text-[var(--error)]">{addBatchErrors.batch_code}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-[var(--text-muted)]">Quantity *</label>
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={newBatch.quantity || ''}
                                                    onChange={(e) => setNewBatch({ ...newBatch, quantity: parseInt(e.target.value) || 0 })}
                                                    className={addBatchErrors.quantity ? 'border-[var(--error)]' : ''}
                                                />
                                                {addBatchErrors.quantity && <p className="text-xs text-[var(--error)]">{addBatchErrors.quantity}</p>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-[var(--text-muted)]">Manufacturing Date *</label>
                                                <Input
                                                    type="date"
                                                    value={newBatch.manufacturing_date}
                                                    onChange={(e) => setNewBatch({ ...newBatch, manufacturing_date: e.target.value })}
                                                    className={addBatchErrors.manufacturing_date ? 'border-[var(--error)]' : ''}
                                                />
                                                {addBatchErrors.manufacturing_date && <p className="text-xs text-[var(--error)]">{addBatchErrors.manufacturing_date}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-[var(--text-muted)]">Expiry Date *</label>
                                                <Input
                                                    type="date"
                                                    value={newBatch.expiry_date}
                                                    onChange={(e) => setNewBatch({ ...newBatch, expiry_date: e.target.value })}
                                                    className={addBatchErrors.expiry_date ? 'border-[var(--error)]' : ''}
                                                />
                                                {addBatchErrors.expiry_date && <p className="text-xs text-[var(--error)]">{addBatchErrors.expiry_date}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

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
                                batchCount={batchInfo[item.id]?.count || 0}
                                totalStock={batchInfo[item.id]?.totalStock}
                                onManageBatches={(itemId) => {
                                    const itemInfo = items.find((i: InventoryItem) => i.id === itemId);
                                    if (itemInfo) {
                                        setSelectedItemForBatch({ id: itemId, name: itemInfo.name });
                                        setBatchModalOpen(true);
                                    }
                                }}
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

            {/* Batch Management Modal */}
            {selectedItemForBatch && (
                <BatchManagementModal
                    isOpen={batchModalOpen}
                    onClose={() => {
                        setBatchModalOpen(false);
                        setSelectedItemForBatch(null);
                    }}
                    inventoryId={selectedItemForBatch.id}
                    productName={selectedItemForBatch.name}
                />
            )}
        </PageContainer>
    );
}
