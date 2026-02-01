"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Clock, CheckCircle2, ShoppingBag, ArrowRight, MessageSquare, X, Loader } from "lucide-react";
import Link from "next/link";

interface OrderItem {
    id: string;
    order_id: string;
    inventory_id: string;
    quantity: number;
    price_at_time: number;
    inventory?: {
        name: string;
    };
}

interface Order {
    id: string;
    status: 'placed' | 'ready' | 'complete' | 'cancelled';
    total_price: number;
    created_at: string;
    items?: OrderItem[];
}

export default function PatientOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});

    useEffect(() => {
        fetchOrders();

        // Check for hash navigation
        const hash = window.location.hash;
        if (hash.startsWith('#order-')) {
            const orderId = hash.replace('#order-', '');
            setExpandedOrderId(orderId);
        }

        // Subscribe to changes
        const channel = supabase
            .channel('patient-orders')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders' },
                (payload) => {
                    setOrders(current =>
                        current.map(o => o.id === payload.new.id ? { ...o, status: payload.new.status } : o)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchOrders() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("patient_id", user.id)
            .order("created_at", { ascending: false });

        if (error) console.error("Error fetching orders:", error);
        else {
            setOrders(data || []);
            // Fetch order items for all orders
            if (data && data.length > 0) {
                await fetchOrderItems(data);
            }
        }
        setLoading(false);
    }

    async function fetchOrderItems(orders: Order[]) {
        const orderIds = orders.map(o => o.id);
        const { data, error } = await supabase
            .from("order_items")
            .select("*, inventory:inventory_id(name)")
            .in("order_id", orderIds);

        if (error) {
            console.error("Error fetching order items:", error);
        } else {
            const itemsByOrder = (data || []).reduce((acc, item) => {
                if (!acc[item.order_id]) acc[item.order_id] = [];
                acc[item.order_id].push(item);
                return acc;
            }, {} as Record<string, OrderItem[]>);
            setOrderItems(itemsByOrder);
        }
    }

    const getStatusInfo = (status: Order['status']) => {
        switch (status) {
            case 'placed': return { text: "Pharmacist is reviewing", icon: <Clock className="w-4 h-4" />, style: "badge-warning" };
            case 'ready': return { text: "Ready for collection!", icon: <Package className="w-4 h-4" />, style: "badge-primary" };
            case 'complete': return { text: "Order fulfilled", icon: <CheckCircle2 className="w-4 h-4" />, style: "badge-success" };
            default: return { text: status, icon: null, style: "bg-slate-100" };
        }
    };

    const toggleOrderExpansion = (orderId: string) => {
        const newExpandedId = expandedOrderId === orderId ? null : orderId;
        setExpandedOrderId(newExpandedId);

        // Update URL hash without page reload
        if (newExpandedId) {
            window.history.pushState(null, '', `#order-${newExpandedId}`);
        } else {
            window.history.pushState(null, '', window.location.pathname);
        }
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#order-')) {
                const orderId = hash.replace('#order-', '');
                setExpandedOrderId(orderId);
                // Scroll to the expanded order
                setTimeout(() => {
                    const element = document.getElementById(`order-${orderId}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            } else {
                setExpandedOrderId(null);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return (
        <div className="space-y-8">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Purchase History</h2>
                    <p className="section-subtitle">Track and manage your medical orders.</p>
                </div>
                <Link href="/patient" className="btn-primary flex items-center gap-2 py-2 px-4 text-xs">
                    <ShoppingBag className="w-4 h-4" /> New Order
                </Link>
            </div>

            {loading ? (
                <div className="loading-container">
                    <Loader className="loading-spinner" />
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const status = getStatusInfo(order.status);
                        const isExpanded = expandedOrderId === order.id;
                        const items = orderItems[order.id] || [];

                        return (
                            <div key={order.id} id={`order-${order.id}`} className={`card-style border-none bg-white p-0 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference ID</span>
                                            <span className="font-bold text-slate-800">#{order.id.slice(0, 12)}</span>
                                        </div>
                                        <div className={`badge ${status.style} flex items-center gap-1.5`}>
                                            {status.icon}
                                            {order.status}
                                        </div>
                                    </div>

                                    <div className="msg-bubble msg-bubble-in w-full max-w-none mb-0 bg-slate-50 border-none">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-2xl ${order.status === 'ready' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                                <ShoppingBag className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800">{status.text}</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Updated {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Order Details */}
                                    {isExpanded && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-slate-800 text-sm">Order Details</h4>
                                                <button
                                                    onClick={() => toggleOrderExpansion(order.id)}
                                                    className="text-blue-600 hover:text-blue-700 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {items.map((item, index) => (
                                                    <div key={item.id} className="flex items-center justify-between text-sm bg-white p-2 rounded-lg">
                                                        <span className="font-medium text-slate-700">
                                                            {(item as any).inventory?.name || `Item ${index + 1}`}
                                                        </span>
                                                        <div className="text-right">
                                                            <span className="text-slate-600">Qty: {item.quantity}</span>
                                                            <span className="ml-4 text-slate-800 font-medium">
                                                                ₹{(item.price_at_time * item.quantity).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="border-t border-blue-200 pt-2 mt-2">
                                                    <div className="flex items-center justify-between font-bold text-slate-800">
                                                        <span>Total</span>
                                                        <span className="text-lg">₹{order.total_price.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Total</p>
                                            <p className="font-black text-slate-800 text-xl">₹{order.total_price}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleOrderExpansion(order.id)}
                                                className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1"
                                            >
                                                {isExpanded ? 'Hide' : 'View'} Details
                                                {isExpanded ? <X className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                                            </button>
                                            <Link href="/patient/chats" className="flex items-center gap-2 text-[var(--primary)] font-bold text-xs hover:underline">
                                                Contact Pharmacist <MessageSquare className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 flex justify-center text-[var(--primary)]">
                                    <button
                                        onClick={() => toggleOrderExpansion(order.id)}
                                        className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                                    >
                                        View Full Receipt <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {orders.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <ShoppingBag className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="empty-state-title">Your order history is empty</h3>
                            <p className="empty-state-text">Medications you order will appear here.</p>
                            <Link href="/patient" className="mt-6 inline-block btn-primary">
                                Start Shopping
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
