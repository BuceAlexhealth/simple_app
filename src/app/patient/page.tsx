"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Plus, ShoppingCart, X, AlertCircle, Store, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InventoryItem {
    id: string;
    name: string;
    price: number;
    stock: number;
    pharmacy_id: string;
    profiles: {
        full_name: string;
    };
}

interface CartItem extends InventoryItem {
    quantity: number;
}

export default function PatientSearchPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isOrdering, setIsOrdering] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchInventory();
    }, []);

    async function fetchInventory() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // 1. Get connected pharmacies
        const { data: connections } = await supabase
            .from("connections")
            .select("pharmacy_id")
            .eq("patient_id", user.id);

        const connectedIds = connections?.map(c => c.pharmacy_id) || [];

        if (connectedIds.length === 0) {
            setItems([]);
            setLoading(false);
            return;
        }

        // 2. Fetch items ONLY from connected pharmacies
        const { data, error } = await supabase
            .from("inventory")
            .select("*, profiles:pharmacy_id(full_name)")
            .in("pharmacy_id", connectedIds)
            .order("name");

        if (!error) setItems(data as any[] || []);
        else console.error(error);
        setLoading(false);
    }

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().trim().includes(search.toLowerCase().trim())
    );

    const addToCart = (item: InventoryItem) => {
        if (item.stock <= 0) return;

        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const placeOrder = async () => {
        if (cart.length === 0) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Please sign in to place an order");
            router.push("/");
            return;
        }

        setIsOrdering(true);
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const pharmacyId = cart[0].pharmacy_id;

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert([{
                patient_id: user.id,
                pharmacy_id: pharmacyId,
                total_price: total,
                status: 'placed'
            }])
            .select()
            .single();

        if (orderError) {
            alert("Error placing order: " + orderError.message);
            setIsOrdering(false);
            return;
        }

        const orderItems = cart.map(item => ({
            order_id: order.id,
            inventory_id: item.id,
            quantity: item.quantity,
            price_at_time: item.price
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

        if (itemsError) {
            alert("Error adding order items: " + itemsError.message);
        } else {
            setCart([]);
            router.push("/patient/orders");
        }
        setIsOrdering(false);
    };

    return (
        <div className="space-y-6">
            <div className="text-left">
                <h1 className="text-2xl font-black text-slate-800">Find Medication</h1>
                <p className="text-[var(--text-muted)] text-sm">Search and discover medication from trusted pharmacies.</p>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search medicines (e.g. Aspirin)..."
                    className="input-field pl-12 h-14"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button onClick={() => setSearch("")} className="absolute inset-y-0 right-4 flex items-center">
                        <X className="h-4 w-4 text-slate-400" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-[var(--primary)]" /></div>
                ) : (
                    filteredItems.map((item) => (
                        <div key={item.id} className={`app-card flex justify-between items-center ${item.stock <= 0 ? 'bg-slate-50 border-slate-200' : ''}`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                                    {item.stock <= 0 && (
                                        <span className="badge badge-danger lowercase">Out of Stock</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[var(--text-muted)] mt-1">
                                    <Store className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">
                                        {item.profiles?.full_name || "Authorized Pharmacy"}
                                    </span>
                                </div>
                                <p className="text-[var(--primary)] font-black mt-2 text-2xl">${item.price}</p>
                            </div>

                            <button
                                onClick={() => addToCart(item)}
                                disabled={item.stock <= 0}
                                className={`p-4 rounded-2xl transition-all shadow-sm ${item.stock > 0
                                    ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                title={item.stock > 0 ? "Add to Cart" : "Item Unavailable"}
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                    ))
                )}

                {!loading && filteredItems.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">
                            {items.length === 0 ? "You're not connected to any pharmacies yet." : `No results found for "${search}"`}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                            {items.length === 0 ? "Use an invite link from your pharmacist to view their inventory." : "Try searching for a different drug name."}
                        </p>
                        {items.length === 0 && (
                            <Link href="/patient/pharmacies" className="mt-6 inline-block btn-primary py-2 px-6 text-xs">
                                Browse All Pharmacies
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
                <div className="fixed bottom-8 left-6 right-6 z-50">
                    <button
                        onClick={placeOrder}
                        disabled={isOrdering}
                        className="w-full btn-primary h-20 shadow-2xl flex items-center justify-between px-8"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-xl relative">
                                <ShoppingCart className="w-6 h-6" />
                                <span className="absolute -top-1 -right-1 bg-white text-[var(--primary)] text-[10px] font-black w-5 h-5 rounded-md flex items-center justify-center border-2 border-[var(--primary)]">
                                    {cart.reduce((s, i) => s + i.quantity, 0)}
                                </span>
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-black uppercase">Confirm & Order</span>
                                <span className="text-xs opacity-80">{cart.length} item types</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black">
                                ${cart.reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}
                            </span>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
