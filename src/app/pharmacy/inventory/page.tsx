"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Package, Edit2, Trash2, X, Info, Check, Loader, Search, Sparkles, Filter, MoreVertical, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { handleAsyncError } from "@/lib/error-handling";
import { createRepositories } from "@/lib/repositories";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/Select";
import { motion, AnimatePresence } from "framer-motion";

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
    const [newItem, setNewItem] = useState({ name: "", brand_name: "", form: "", price: "", stock: "" });
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
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
        if (!newItem.name || !newItem.price || !newItem.stock) {
            toast.error("Please fill in all fields");
            return;
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
                price: parseFloat(newItem.price),
                stock: parseInt(newItem.stock),
            }),
            "Error adding item"
        );

        if (success) {
            toast.success("Item added successfully");
            setNewItem({ name: "", brand_name: "", form: "", price: "", stock: "" });
            setIsAdding(false);
            fetchInventory();
        }
    }

    async function handleUpdateItem() {
        if (!editingItem) return;

        const { inventory } = createRepositories(supabase);
        const success = await handleAsyncError(
            () => inventory.updateItem(editingItem.id, {
                name: editingItem.name,
                brand_name: editingItem.brand_name,
                form: editingItem.form,
                price: editingItem.price,
                stock: editingItem.stock
            }),
            "Error updating item"
        );

        if (success) {
            toast.success("Item updated successfully");
            setEditingItem(null);
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
                        variant="gradient"
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
                                            className="h-12 rounded-xl focus:ring-2 focus:ring-[var(--primary-glow)]"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest ml-1">Brand Name</label>
                                        <Input
                                            placeholder="e.g. Crocin"
                                            className="h-12 rounded-xl focus:ring-2 focus:ring-[var(--primary-glow)]"
                                            value={newItem.brand_name}
                                            onChange={(e) => setNewItem({ ...newItem, brand_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-1 space-y-2">
                                        <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest ml-1">Form</label>
                                        <Select
                                            value={newItem.form || ""}
                                            onChange={(value) => setNewItem({ ...newItem, form: value })}
                                        >
                                            <SelectTrigger placeholder="Select Form" />
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
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest ml-1">Price (₹)</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="h-12 rounded-xl"
                                            value={newItem.price}
                                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest ml-1">Initial Stock</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            className="h-12 rounded-xl"
                                            value={newItem.stock}
                                            onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-10">
                                    <Button variant="ghost" className="w-full sm:w-auto px-8 rounded-xl font-bold" onClick={() => setIsAdding(false)}>Dismiss</Button>
                                    <Button variant="gradient" className="w-full sm:w-auto px-10 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg glow-primary" onClick={handleAddItem}>Register Product</Button>
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
                                    variant={editingItem?.id === item.id ? "interactive" : "default"}
                                    className={`w-full group border-[var(--border)] transition-all duration-300 ${editingItem?.id === item.id ? 'ring-2 ring-[var(--primary)]' : 'hover:border-[var(--primary)] hover:shadow-lg'}`}
                                >
                                    <CardContent className="p-4 md:p-6">
                                        {editingItem?.id === item.id ? (
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-black text-xs uppercase tracking-widest text-[var(--primary)]">Edit Product</h3>
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingItem(null)} className="h-8 w-8 rounded-lg">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Product Name</label>
                                                        <Input
                                                            className="h-12 text-base font-bold bg-white/50"
                                                            value={editingItem.name}
                                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Brand Name</label>
                                                        <Input
                                                            className="h-12 text-base font-bold bg-white/50"
                                                            value={editingItem.brand_name || ""}
                                                            onChange={(e) => setEditingItem({ ...editingItem, brand_name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Form</label>
                                                        <Select
                                                            value={editingItem.form || ""}
                                                            onChange={(value) => setEditingItem({ ...editingItem, form: value })}
                                                        >
                                                            <SelectTrigger className="bg-white/50 font-bold" placeholder="Select Form" />
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
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Price (₹)</label>
                                                        <Input
                                                            type="number"
                                                            className="h-12 text-base font-bold bg-white/50"
                                                            value={editingItem.price}
                                                            onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Stock</label>
                                                        <Input
                                                            type="number"
                                                            className="h-12 text-base font-bold bg-white/50"
                                                            value={editingItem.stock}
                                                            onChange={(e) => setEditingItem({ ...editingItem, stock: parseInt(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--border)] border-dashed">
                                                    <Button variant="ghost" className="w-full sm:w-auto px-6 h-11 rounded-xl font-bold" onClick={() => setEditingItem(null)}>Cancel</Button>
                                                    <Button
                                                        variant="gradient"
                                                        className="w-full sm:w-auto px-8 h-11 rounded-xl font-black uppercase tracking-widest text-xs glow-primary"
                                                        onClick={handleUpdateItem}
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
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
                                                        onClick={() => setEditingItem(item)}
                                                        className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
                                                    >
                                                        <Edit2 className="w-5 h-5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="h-10 w-10 md:h-12 md:w-12 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
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
                                variant="gradient"
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
