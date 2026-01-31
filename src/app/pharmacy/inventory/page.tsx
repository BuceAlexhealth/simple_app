"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Package, Edit2, Trash2, X, Info } from "lucide-react";

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

    useEffect(() => {
        fetchInventory();
    }, []);

    async function fetchInventory() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("inventory")
            .select("*")
            .eq("pharmacy_id", user.id)
            .order("name");

        if (error) console.error("Error fetching inventory:", error);
        else setItems(data || []);
        setLoading(false);
    }

    async function handleAddItem() {
        if (!newItem.name || !newItem.price || !newItem.stock) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert("You must be logged in to add items");

        const { error } = await supabase.from("inventory").insert([
            {
                pharmacy_id: user.id,
                name: newItem.name,
                price: parseFloat(newItem.price),
                stock: parseInt(newItem.stock),
            },
        ]);

        if (error) {
            alert("Error adding item: " + error.message);
        } else {
            setNewItem({ name: "", price: "", stock: "" });
            setIsAdding(false);
            fetchInventory();
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Stock Inventory</h2>
                    <p className="text-sm text-slate-500">Manage your medicine availability and pricing.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Add New Item
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-3xl border-2 border-[var(--primary)] shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-lg text-slate-800">New Product Entry</h3>
                        <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1 mb-1 block">Medicine Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Amoxicillin 500mg"
                                className="input-field"
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1 mb-1 block">Price (₹)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="input-field"
                                value={newItem.price}
                                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400 ml-1 mb-1 block">Stock Quantity</label>
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
                        <button onClick={() => setIsAdding(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                        <button onClick={handleAddItem} className="btn-primary">Save Product</button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-20 text-slate-400 font-medium">Synchronizing list...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="app-card hover:scale-[1.02] transition-transform">
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[var(--primary)]">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1">
                                    <button className="p-2 text-slate-300 hover:text-[var(--primary)] hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                                    <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
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
                        </div>
                    ))}
                    {items.length === 0 && !isAdding && (
                        <div className="sm:col-span-2 text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <Info className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">Your inventory is currently empty.</p>
                            <button onClick={() => setIsAdding(true)} className="text-[var(--primary)] font-bold mt-2 hover:underline">Click here to add your first product</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
