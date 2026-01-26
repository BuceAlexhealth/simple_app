"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Clock, Truck, Package, AlertCircle, RefreshCw, Share2, Copy, Store } from "lucide-react";
import Link from "next/link";

interface Order {
    id: string;
    patient_id: string;
    status: 'placed' | 'ready' | 'complete' | 'cancelled';
    total_price: number;
    created_at: string;
}

export default function PharmacyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [offlineItems, setOfflineItems] = useState<any[]>([]);
    const [adjustments, setAdjustments] = useState<Record<string, number>>({});
    const [isProcessingEOD, setIsProcessingEOD] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setupInviteLink();
        fetchOrders();
        fetchInventory();
    }, []);

    async function setupInviteLink() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const baseUrl = window.location.origin;
            setInviteLink(`${baseUrl}/invite/${user.id}`);
        }
    }

    async function fetchInventory() {
        const { data } = await supabase.from("inventory").select("*").order("name");
        setOfflineItems(data || []);
    }

    async function fetchOrders() {
        setLoading(true);
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) console.error("Error fetching orders:", error);
        else setOrders(data || []);
        setLoading(false);
    }

    async function updateStatus(orderId: string, newStatus: Order['status']) {
        const { error } = await supabase
            .from("orders")
            .update({ status: newStatus })
            .eq("id", orderId);

        if (error) alert("Error updating status: " + error.message);
        else fetchOrders();
    }

    async function recordOfflineSales() {
        setIsProcessingEOD(true);
        const promises = Object.entries(adjustments).map(async ([id, qty]) => {
            if (qty <= 0) return;
            const item = offlineItems.find(i => i.id === id);
            if (!item) return;

            return supabase
                .from("inventory")
                .update({ stock: Math.max(0, item.stock - qty) })
                .eq("id", id);
        });

        await Promise.all(promises);
        setAdjustments({});
        await fetchInventory();
        setIsProcessingEOD(false);
        alert("EOD adjustments applied successfully!");
    }

    const getStatusStyles = (status: Order['status']) => {
        switch (status) {
            case 'placed': return "badge-warning";
            case 'ready': return "badge-primary";
            case 'complete': return "badge-success";
            default: return "bg-slate-200 text-slate-700";
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Active Orders</h2>
                    <p className="text-sm text-slate-500">Track and fulfill prescriptions from your patients.</p>
                </div>
            </div>

            {/* Branded Share Card */}
            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="relative z-10 w-full md:w-auto">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Share2 className="w-5 h-5" /> Share Your Store
                    </h3>
                    <p className="text-indigo-100 text-xs mt-1">Invite patients to connect and browse your live inventory.</p>

                    <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center justify-between gap-3 border border-white/20">
                        <code className="text-[10px] font-mono opacity-90 truncate overflow-hidden">
                            {inviteLink || "Generating link..."}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(inviteLink);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className={`p-2 rounded-lg transition-all flex-shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="hidden md:block opacity-20 rotate-6 scale-125">
                    <Store className="w-20 h-20" />
                </div>

                {/* Decorative background element */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400 font-medium">Fetching orders...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {orders.map((order) => (
                        <div key={order.id} className="app-card border-l-8 border-l-[var(--primary)]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">
                                            ref #{order.id.slice(0, 8)}
                                        </span>
                                        <span className={`badge ${getStatusStyles(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-800 mt-2">${order.total_price}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Received</p>
                                    <p className="text-sm font-bold text-slate-600">
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3 border-t pt-4">
                                {order.status === 'placed' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'ready')}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Package className="w-4 h-4" /> Ready for Pickup
                                    </button>
                                )}
                                {order.status === 'ready' && (
                                    <button
                                        onClick={() => updateStatus(order.id, 'complete')}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Finalize Delivery
                                    </button>
                                )}
                                <Link
                                    href="/pharmacy/chats"
                                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    Message Patient
                                </Link>
                            </div>
                        </div>
                    ))}
                    {orders.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No orders at the moment.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Offline Adjustment Section */}
            <div className="mt-12">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-xl font-black text-slate-800">EOD Inventory Check</h3>
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 mb-6">Record offline physical sales to keep your online inventory synchronized.</p>

                    <div className="space-y-3 mb-8">
                        {offlineItems.length > 0 ? (
                            offlineItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                                    <div>
                                        <p className="font-bold text-slate-800">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">Current Stock: {item.stock}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-slate-400">Sold Offline:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.stock}
                                            placeholder="0"
                                            className="w-20 bg-white rounded-xl px-3 py-2 text-sm font-bold border border-slate-200 focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                            onChange={(e) => setAdjustments({ ...adjustments, [item.id]: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <RefreshCw className="w-8 h-8 text-slate-200 animate-spin mx-auto mb-2" />
                                <p className="text-xs text-slate-400">Loading catalog...</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={recordOfflineSales}
                        disabled={isProcessingEOD || Object.values(adjustments).every(v => v === 0) || offlineItems.length === 0}
                        className="w-full btn-primary h-14 bg-slate-800 hover:bg-black text-white rounded-2xl flex items-center justify-center gap-2"
                    >
                        {isProcessingEOD ? "Synchronizing..." : <><RefreshCw className="w-5 h-5" /> Confirm Sync & Close Day</>}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-black tracking-widest">
                        Process is irreversible • updates inventory counts immediately
                    </p>
                </div>
            </div>
        </div>
    );
}
