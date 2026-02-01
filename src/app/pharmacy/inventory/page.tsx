"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Package, Edit2, Trash2, X, Info, Check, Loader } from "lucide-react";
import { toast } from "sonner";

interface InventoryItem {
    id: string;
    name: string;
    price: number;
    stock: number;
    image_url?: string;
}

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ name: "", price: "", stock: "" });
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    async function fetchInventory() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("inventory")
            .select("*")
            .eq("pharmacy_id", user.id)
            .order("name");

        if (error) {
            console.error("Error fetching inventory:", error);
            toast.error("Failed to load inventory");
        } else {
            setItems(data || []);
        }
        setLoading(false);
    }

    async function handleAddItem() {
        if (!newItem.name || !newItem.price || !newItem.stock) {
            toast.error("Please fill in all fields");
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return toast.error("You must be logged in to add items");

        const { error } = await supabase.from("inventory").insert([
            {
                pharmacy_id: user.id,
                name: newItem.name,
                price: parseFloat(newItem.price),
                stock: parseInt(newItem.stock),
            },
        ]);

        if (error) {
            toast.error("Error adding item: " + error.message);
        } else {
            toast.success("Item added successfully");
            setNewItem({ name: "", price: "", stock: "" });
            setIsAdding(false);
            fetchInventory();
        }
    }

    async function handleUpdateItem() {
        if (!editingItem) return;

        const { error } = await supabase
            .from("inventory")
            .update({
                name: editingItem.name,
                price: editingItem.price,
                stock: editingItem.stock
            })
            .eq("id", editingItem.id);

        if (error) {
            toast.error("Error updating item: " + error.message);
        } else {
            toast.success("Item updated successfully");
            setEditingItem(null);
            fetchInventory();
        }
    }

    async function handleDeleteItem(id: string) {
        if (!confirm("Are you sure you want to delete this item?")) return;

        const { error } = await supabase
            .from("inventory")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Error deleting item: " + error.message);
        } else {
            toast.success("Item deleted successfully");
            fetchInventory();
        }
    }

    return (
        <div className="space-y-6">
            <div className="section-header flex items-center justify-between">
                <div>
                    <h2 className="section-title">Stock Inventory</h2>
                    <p className="section-subtitle">Manage your medicine availability and pricing.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Add New Item
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-[var(--radius-xl)] border-2 border-[var(--primary)] shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-lg text-slate-800">New Product Entry</h3>
                        <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1 mb-1 block">Medicine Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Amoxicillin 500mg"
                                className="input-field"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1 mb-1 block">Price (₹)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="input-field"
                                value={newItem.price}
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1 mb-1 block">Stock Quantity</label>
                            <input
                                type="number"
                                placeholder="0"
                                className="input-field"
                                value={newItem.stock}
                                onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <button onClick={() => setIsAdding(false)} className="btn-secondary">Cancel</button>
                        <button onClick={handleAddItem} className="btn-primary">Save Product</button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-container">
                    <Loader className="loading-spinner" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className={`card-style ${editingItem?.id === item.id ? 'ring-2 ring-[var(--primary)]' : ''}`}>
                            {editingItem?.id === item.id ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-black text-slate-800">Editing Item</h3>
                                        <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={editingItem.name}
                                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                        placeholder="Name"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                            <input
                                                type="number"
                                                className="input-field pl-7"
                                                value={editingItem.price}
                                                onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                                                placeholder="Price"
                                            />
                                        </div>
                                        <input
                                            type="number"
                                            className="input-field"
                                            value={editingItem.stock}
                                            onChange={(e) => setEditingItem({ ...editingItem, stock: parseInt(e.target.value) })}
                                            placeholder="Stock"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleUpdateItem} className="btn-primary flex-1 flex items-center justify-center gap-2 py-2">
                                            <Check className="w-4 h-4" /> Update
                                        </button>
                                        <button onClick={() => setEditingItem(null)} className="btn-secondary flex-1 py-2">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[var(--primary)]">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setEditingItem(item)}
                                                className="p-2 text-slate-300 hover:text-[var(--primary)] hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Edit Product"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Product"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Unit Price</span>
                                                <span className="font-black text-[var(--primary)] text-xl">₹{item.price}</span>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Available</span>
                                                <span className={`badge mt-1 ${item.stock > 10 ? 'badge-success' : item.stock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                                                    {item.stock} Units
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {items.length === 0 && !isAdding && (
                        <div className="md:col-span-2 empty-state">
                            <div className="empty-state-icon">
                                <Info className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="empty-state-title">Your inventory is currently empty</h3>
                            <p className="empty-state-text">Start by adding your first product to your pharmacy stock.</p>
                            <button onClick={() => setIsAdding(true)} className="mt-6 btn-primary">Add Your First Product</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
