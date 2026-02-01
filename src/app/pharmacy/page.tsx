"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Clock, Package, AlertCircle, RefreshCw, Share2, Copy, Store, Loader, X, ArrowRight, Plus, Filter } from "lucide-react";
import Link from "next/link";
import { Order, InventoryItem, OrderStatus, InitiatorType, AcceptanceStatus } from "@/types";

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
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

export default function PharmacyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [offlineItems, setOfflineItems] = useState<InventoryItem[]>([]);
    const [adjustments, setAdjustments] = useState<Record<string, number>>({});
    const [isProcessingEOD, setIsProcessingEOD] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
    const [orderFilter, setOrderFilter] = useState<'all' | 'patient' | 'pharmacy'>('all');

    useEffect(() => {
        setupInviteLink();
        fetchOrders();
        fetchInventory();

        // Check for hash navigation
        const hash = window.location.hash;
        if (hash.startsWith('#order-')) {
            const orderId = hash.replace('#order-', '');
            setExpandedOrderId(orderId);
        }
    }, []);

    async function setupInviteLink() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const baseUrl = window.location.origin;
            setInviteLink(`${baseUrl}/invite/${user.id}`);
        }
    }

    async function fetchInventory() {
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
            setOfflineItems((data as unknown as InventoryItem[]) || []);
        }
    }

    async function fetchOrders() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("pharmacy_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to fetch orders");
        } else {
            const orderData = (data as unknown as Order[]) || [];
            setOrders(orderData);
            // Fetch order items for all orders
            if (orderData.length > 0) {
                await fetchOrderItems(orderData);
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

    async function updateStatus(orderId: string, newStatus: OrderStatus) {
        const { error } = await supabase
            .from("orders")
            .update({ status: newStatus })
            .eq("id", orderId);

        if (error) {
            toast.error("Error updating status: " + error.message);
        } else {
            // Update related chat message for any status change
            await updateOrderChatMessage(orderId, newStatus);
            toast.success(`Order status updated to ${newStatus}`);
            fetchOrders();
        }
    }

    async function updateOrderChatMessage(orderId: string, status: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Find the order-related message and update its content with new status
        const { data: order } = await supabase
            .from("orders")
            .select("patient_id")
            .eq("id", orderId)
            .single();

        if (order?.patient_id) {
            // Find the message containing this order ID
            const { data: message } = await supabase
                .from("messages")
                .select("id, content")
                .eq("sender_id", order.patient_id)
                .eq("receiver_id", user.id)
                .like("content", `%ORDER_ID:${orderId}%`)
                .single();

            if (message?.content) {
                // Update the ORDER_STATUS line in the message content
                const updatedContent = message.content.replace(
                    /ORDER_STATUS:[^\n]+/,
                    `ORDER_STATUS:${status}`
                );

                const { error: updateError } = await supabase
                    .from("messages")
                    .update({ content: updatedContent })
                    .eq("id", message.id);

                if (updateError) {
                    console.error("Error updating chat message:", updateError);
                }
            }
        }
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
        toast.success("EOD adjustments applied successfully!");
    }

    const getBadgeVariant = (status: OrderStatus, acceptanceStatus?: AcceptanceStatus, initiatorType?: InitiatorType) => {
        // Handle pharmacy-initiated orders with pending acceptance
        if (initiatorType === 'pharmacy' && acceptanceStatus === 'pending') {
            return "secondary"; // gray for pending
        }
        
        switch (status) {
            case 'placed': return "warning";
            case 'ready': return "default"; // blue/primary
            case 'complete': return "success";
            case 'cancelled': return "destructive";
            default: return "secondary";
        }
    };

    const getOrderStatusText = (order: Order) => {
        if (order.initiator_type === 'pharmacy') {
            if (order.acceptance_status === 'pending') return 'Pending Acceptance';
            if (order.acceptance_status === 'rejected') return 'Rejected';
        }
        return order.status;
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
        <div className="space-y-8 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Active Orders</h2>
                    <p className="text-slate-500">Track and fulfill prescriptions from your patients.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                        <button
                            onClick={() => setOrderFilter('all')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                orderFilter === 'all' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            All Orders
                        </button>
                        <button
                            onClick={() => setOrderFilter('patient')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                orderFilter === 'patient' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Patient Orders
                        </button>
                        <button
                            onClick={() => setOrderFilter('pharmacy')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                orderFilter === 'pharmacy' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Your Orders
                        </button>
                    </div>
                    <Link href="/pharmacy/create-order">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Order
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Branded Share Card */}
            <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="relative z-10 w-full md:w-auto">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Share2 className="w-5 h-5" /> Share Your Store
                    </h3>
                    <p className="text-indigo-100 text-sm mt-1">Invite patients to connect and browse your live inventory.</p>

                    <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-2 flex items-center justify-between gap-3 border border-white/20">
                        <code className="text-xs font-mono opacity-90 truncate overflow-hidden px-2">
                            {inviteLink || "Generating link..."}
                        </code>
                        <Button
                            size="icon"
                            variant="ghost"
                            className={`h-8 w-8 text-white hover:bg-white/20 ${copied ? "text-green-300" : ""}`}
                            onClick={() => {
                                navigator.clipboard.writeText(inviteLink);
                                setCopied(true);
                                toast.success("Link copied to clipboard");
                                setTimeout(() => setCopied(false), 2000);
                            }}
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                <div className="hidden md:block opacity-20 rotate-12 scale-125">
                    <Store className="w-24 h-24" />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {orders
                        .filter(order => {
                            if (orderFilter === 'all') return true;
                            if (orderFilter === 'patient') return order.initiator_type !== 'pharmacy';
                            if (orderFilter === 'pharmacy') return order.initiator_type === 'pharmacy';
                            return true;
                        })
                        .map((order) => {
                        const isExpanded = expandedOrderId === order.id;
                        const items = orderItems[order.id] || [];

                        return (
                            <Card key={order.id} id={`order-${order.id}`} className={`border-l-4 border-l-blue-600 transition-all duration-300 ${isExpanded ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}>
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xs font-mono font-bold text-slate-400">
                                                    #{order.id.slice(0, 8)}
                                                </span>
                                                <Badge variant={getBadgeVariant(order.status, order.acceptance_status, order.initiator_type)}>
                                                    {getOrderStatusText(order)}
                                                </Badge>
                                            </div>
                                            <p className="text-2xl font-bold text-slate-900">₹{order.total_price}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-slate-500 mb-1">Received</p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expanded Order Details */}
                                    {isExpanded && (
                                        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
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

                                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => toggleOrderExpansion(order.id)}
                                            className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1"
                                        >
                                            {isExpanded ? 'Hide' : 'View'} Details
                                            {isExpanded ? <X className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                                        </button>
                                        {order.initiator_type === 'pharmacy' && order.acceptance_status === 'pending' && (
                                            <div className="flex-1 text-center">
                                                <div className="text-sm text-slate-500 font-medium">
                                                    <Clock className="w-4 h-4 inline mr-1" />
                                                    Waiting for customer acceptance
                                                </div>
                                            </div>
                                        )}
                                        {order.status === 'placed' && order.initiator_type !== 'pharmacy' && (
                                            <Button
                                                className="flex-1"
                                                onClick={() => updateStatus(order.id, 'ready')}
                                            >
                                                <Package className="w-4 h-4 mr-2" /> Ready for Pickup
                                            </Button>
                                        )}
                                        {order.status === 'ready' && (
                                            <Button
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => updateStatus(order.id, 'complete')}
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Finalize Delivery
                                            </Button>
                                        )}
                                        <Link href="/pharmacy/chats" className="flex-1">
                                            <Button variant="outline" className="w-full">
                                                Message Patient
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {orders.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No orders at the moment.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Offline Adjustment Section */}
            <div className="mt-12">
                <div className="flex items-center gap-2 mb-6">
                    <h3 className="text-2xl font-bold text-slate-900">EOD Inventory Check</h3>
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daily Reconciliation</CardTitle>
                        <CardDescription>Record offline physical sales to keep your online inventory synchronized.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {offlineItems.length > 0 ? (
                            <div className="space-y-3">
                                {offlineItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-500 uppercase font-medium tracking-wide">Stock: {item.stock}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-slate-500">Sold Offline:</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                max={item.stock}
                                                placeholder="0"
                                                className="w-24 h-9"
                                                onChange={(e) => setAdjustments({ ...adjustments, [item.id]: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-2" />
                                <p className="text-sm text-slate-400">Loading catalog...</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 mt-4">
                            <Button
                                className="w-full h-12 text-base"
                                variant="default" // Using default (blue) or could use a custom dark variant if preferred
                                onClick={recordOfflineSales}
                                isLoading={isProcessingEOD}
                                disabled={Object.values(adjustments).every(v => v === 0) || offlineItems.length === 0}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" /> Confirm Sync & Close Day
                            </Button>
                            <p className="text-center text-xs text-slate-400 mt-3 font-medium uppercase tracking-wider">
                                Updates inventory counts immediately
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

