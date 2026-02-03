"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Package, X, Loader, Search, Sparkles, Filter } from "lucide-react";
import { toast } from "sonner";
import { handleAsyncError } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/Select";
import { motion, AnimatePresence } from "framer-motion";
import { InventoryItemCard } from "./InventoryItemCard";
import { InventoryItemSchema, type InventoryItemInput } from "@/lib/validations/inventory";
import { z } from "zod";

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
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState<InventoryItemInput>({ name: "", brand_name: "", form: "", price: 0, stock: 0 });
    const [addItemErrors, setAddItemErrors] = useState<Partial<Record<keyof InventoryItemInput, string>>>({});

    // Track which item is currently being edited by ID
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { inventory } = createRepositories(supabase);
        const data = await handleAsyncError(
            () => inventory.getInventoryByPharmacyId(user.id),
            "Failed to load inventory"
        );

        if (data) {
            setItems(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [items, search]);

    async function handleAddItem() {
        // Validate with Zod
        try {
            InventoryItemSchema.parse(newItem);
            setAddItemErrors({});
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: any = {};
                error.issues.forEach((err) => {
                    if (err.path[0]) {
                        fieldErrors[err.path[0]] = err.message;
                    }
                });
                setAddItemErrors(fieldErrors);
                toast.error("Please fix the validation errors");
                return;
            }
        }

        const { data: { user } } = await supabase.auth.getUser();
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
            fetchInventory();
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
            fetchInventory();
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
            fetchInventory();
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
        >
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 px-3 py-1 bg-[var(--primary-light)] rounded-full w-fit">
                        <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">Inventory Management</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-[var(--text-main)] tracking-tight">
                        Stock <span className="text-[var(--primary)]">Control</span>
                    </h2>
                    <p className="text-sm font-medium text-[var(--text-muted)]">
                        Manage your medicine availability and pricing with real-time updates.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant="default"
                        onClick={() => setIsAdding(true)}
                        className="h-12 w-full sm:w-auto px-8 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg glow-primary scale-in"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 slide-up">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors w-5 h-5" />
                    <Input
                        placeholder="Find products by name..."
                        className="pl-12 h-14 bg-white/50 backdrop-blur-sm border-[var(--border)] hover:border-[var(--primary)] focus:border-[var(--primary)] transition-all text-base rounded-2xl shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-14 px-6 rounded-2xl w-full sm:w-auto font-bold text-sm bg-white/50 backdrop-blur-sm border-[var(--border)]">
                    <Filter className="w-4 h-4 mr-2" /> Filters
                </Button>
            </div>

            <AnimatePresence mode="wait">
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative"
                    >
                        <Card className="border-2 border-[var(--primary)] shadow-2xl bg-white/80 backdrop-blur-xl mb-10 relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--primary)]"></div>
                            <CardContent className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-black text-xl text-[var(--text-main)] italic">New Product Registration</h3>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="rounded-full">
                                        <X className="w-6 h-6" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest ml-1">Product Name</label>
                                        <Input
                                            placeholder="e.g. Paracetamol 500mg"
                                            className={`h-12 rounded-xl focus:ring-2 focus:ring-[var(--primary-glow)] ${addItemErrors.name ? 'border-red-500' : ''}`}
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        />
                                        {addItemErrors.name && <p className="text-xs text-red-500 font-medium">{addItemErrors.name}</p>}
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest ml-1">Brand Name</label>
                                        <Input
                                            placeholder="e.g. Crocin"
                                            className={`h-12 rounded-xl focus:ring-2 focus:ring-[var(--primary-glow)] ${addItemErrors.brand_name ? 'border-red-500' : ''}`}
                                            value={newItem.brand_name || ""}
                                            onChange={(e) => setNewItem({ ...newItem, brand_name: e.target.value })}
                                        />
                                        {addItemErrors.brand_name && <p className="text-xs text-red-500 font-medium">{addItemErrors.brand_name}</p>}
                                    </div>
                                    <div className="md:col-span-1 space-y-2">
                                        <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest ml-1">Form</label>
                                        <Select
                                            value={newItem.form || ""}
                                            onChange={(value) => setNewItem({ ...newItem, form: value })}
                                        >
                                            <SelectTrigger placeholder="Select Form" className={addItemErrors.form ? 'border-red-500' : ''} />
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
                                        {addItemErrors.form && <p className="text-xs text-red-500 font-medium">{addItemErrors.form}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest ml-1">Price (₹)</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className={`h-12 rounded-xl ${addItemErrors.price ? 'border-red-500' : ''}`}
                                            value={newItem.price || ''}
                                            onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                                        />
                                        {addItemErrors.price && <p className="text-xs text-red-500 font-medium">{addItemErrors.price}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest ml-1">Initial Stock</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className={`h-12 rounded-xl ${addItemErrors.stock ? 'border-red-500' : ''}`}
                                            value={newItem.stock || ''}
                                            onChange={(e) => setNewItem({ ...newItem, stock: parseInt(e.target.value) || 0 })}
                                        />
                                        {addItemErrors.stock && <p className="text-xs text-red-500 font-medium">{addItemErrors.stock}</p>}
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-10">
                                    <Button variant="ghost" className="w-full sm:w-auto px-8 rounded-xl font-bold" onClick={() => setIsAdding(false)}>Dismiss</Button>
                                    <Button variant="default" className="w-full sm:w-auto px-10 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg glow-primary" onClick={handleAddItem}>Register Product</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-[var(--surface-bg)] flex items-center justify-center shadow-inner">
                        <Loader className="w-8 h-8 animate-spin text-[var(--primary)]" />
                    </div>
                    <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px]">Loading Inventory</p>
                </div>
            ) : (
                <motion.div
                    layout
                    className="flex flex-col gap-4"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item) => (
                            <motion.div
                                layout
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full"
                            >
                                <Card
                                    className={`w-full group border-[var(--border)] transition-all duration-300 ${editingItemId === item.id ? 'ring-2 ring-[var(--primary)]' : 'hover:border-[var(--primary)] hover:shadow-lg'}`}
                                >
                                    <CardContent className="p-4 md:p-6">
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
                            </motion.div>
                        ))}
                    </AnimatePresence>


                    {/* Empty States */}
                    {filteredItems.length === 0 && !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-6 glass-card rounded-[3rem] border-dashed border-2 border-[var(--border)]"
                        >
                            <div className="w-24 h-24 rounded-full bg-[var(--surface-bg)] flex items-center justify-center text-[var(--text-muted)] shadow-inner">
                                <Search className="w-10 h-10 opacity-20" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-[var(--text-main)]">No matches found</h3>
                                <p className="text-[var(--text-muted)] font-medium max-w-sm mx-auto">
                                    We couldn't find any products matching "{search}". Try a different keyword.
                                </p>
                            </div>
                            {search && (
                                <Button variant="outline" onClick={() => setSearch("")} className="rounded-xl h-12 px-8 font-bold border-[var(--border)]">
                                    Clear Search
                                </Button>
                            )}
                        </motion.div>
                    )}

                    {items.length === 0 && !isAdding && !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-8 glass-card rounded-[3rem] border-dashed border-2 border-[var(--border)]"
                        >
                            <div className="w-24 h-24 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] shadow-lg glow-primary">
                                <Package className="w-12 h-12" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-[var(--text-main)] italic">Inventory Empty</h3>
                                <p className="text-[var(--text-muted)] font-medium max-w-md mx-auto">
                                    Your digital shelf is currently empty. Start loading your medicine stock to go live.
                                </p>
                            </div>
                            <Button
                                variant="default"
                                onClick={() => setIsAdding(true)}
                                className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl glow-primary"
                            >
                                <Plus className="w-5 h-5 mr-2" /> Start Adding Products
                            </Button>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}
