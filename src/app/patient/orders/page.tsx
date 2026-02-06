"use client";

import { useEffect, useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import { Package, Clock, CheckCircle2, ShoppingBag, ArrowRight, MessageSquare, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";

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
    const { orders, orderItems, loading } = useOrders({ role: 'patient' });
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash.startsWith('#order-')) {
            const orderId = hash.replace('#order-', '');
            setExpandedOrderId(orderId);
        }
    }, []);

    const toggleOrderExpansion = (orderId: string) => {
        const newExpandedId = expandedOrderId === orderId ? null : orderId;
        setExpandedOrderId(newExpandedId);

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

    const getStatusInfo = (status: Order['status']) => {
        switch (status) {
            case 'placed': return { 
                text: "Pharmacist is reviewing", 
                icon: <Clock className="w-3 h-3" />, 
                variant: "warning" as const
            };
            case 'ready': return { 
                text: "Ready for collection!", 
                icon: <Package className="w-3 h-3" />, 
                variant: "default" as const
            };
            case 'complete': return { 
                text: "Order fulfilled", 
                icon: <CheckCircle2 className="w-3 h-3" />, 
                variant: "success" as const
            };
            default: return { 
                text: status, 
                icon: null, 
                variant: "secondary" as const
            };
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-[var(--primary)]" />
                        <span className="text-sm font-medium text-[var(--primary)]">Order History</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--text-main)]">My Orders</h1>
                    <p className="text-[var(--text-muted)] mt-1">
                        Track and manage your medical orders
                    </p>
                </div>

                <Link href="/patient">
                    <Button className="gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        New Order
                    </Button>
                </Link>
            </div>

            {/* Orders List */}
            {loading && orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                    <p className="text-sm text-[var(--text-muted)]">Loading orders...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {orders.map((order: Order) => {
                            const status = getStatusInfo(order.status);
                            const isExpanded = expandedOrderId === order.id;
                            const items = orderItems[order.id] || [];

                            return (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    id={`order-${order.id}`}
                                >
                                    <Card className={`overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-[var(--primary)]' : ''}`}>
                                        <CardContent className="p-5">
                                            {/* Order Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-xs text-[var(--text-muted)] mb-1">Order ID</p>
                                                    <p className="font-mono text-sm text-[var(--text-main)]">
                                                        #{order.id.slice(0, 12)}
                                                    </p>
                                                </div>
                                                <Badge variant={status.variant} className="text-xs">
                                                    {status.icon}
                                                    <span className="ml-1">{order.status}</span>
                                                </Badge>
                                            </div>

                                            {/* Status Message */}
                                            <div className="flex items-start gap-3 p-3 bg-[var(--surface-bg)] rounded-lg mb-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                    order.status === 'ready' 
                                                        ? 'bg-[var(--primary-light)] text-[var(--primary)]' 
                                                        : 'bg-[var(--border)] text-[var(--text-muted)]'
                                                }`}>
                                                    <ShoppingBag className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--text-main)] text-sm">
                                                        {status.text}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="p-4 bg-[var(--surface-bg)] rounded-lg border border-[var(--border)] mb-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="font-medium text-[var(--text-main)] text-sm">Order Details</h4>
                                                                <button
                                                                    onClick={() => toggleOrderExpansion(order.id)}
                                                                    className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {items.map((item: OrderItem, index: number) => (
                                                                    <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]">
                                                                        <span className="font-medium text-[var(--text-main)]">
                                                                            {item.inventory?.name || `Item ${index + 1}`}
                                                                        </span>
                                                                        <div className="flex items-center gap-4">
                                                                            <span className="text-xs text-[var(--text-muted)]">Qty: {item.quantity}</span>
                                                                            <span className="font-semibold text-[var(--text-main)]">
                                                                                ₹{(item.price_at_time * item.quantity).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <div className="pt-3 border-t border-[var(--border)]">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-sm text-[var(--text-muted)]">Total</span>
                                                                        <span className="text-lg font-bold text-[var(--text-main)]">
                                                                            ₹{order.total_price.toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Order Footer */}
                                            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                                                <div>
                                                    <p className="text-xs text-[var(--text-muted)]">Order Total</p>
                                                    <p className="text-xl font-bold text-[var(--text-main)]">
                                                        ₹{order.total_price.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleOrderExpansion(order.id)}
                                                        className="text-[var(--primary)] hover:bg-[var(--primary-light)]"
                                                    >
                                                        {isExpanded ? 'Hide' : 'Details'}
                                                        {isExpanded ? <X className="w-4 h-4 ml-1" /> : <ArrowRight className="w-4 h-4 ml-1" />}
                                                    </Button>
                                                    <Link href="/patient/chats">
                                                        <Button variant="outline" size="sm" className="gap-1.5">
                                                            <MessageSquare className="w-4 h-4" />
                                                            Contact
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {orders.length === 0 && (
                        <Card className="border-dashed">
                            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-[var(--surface-bg)] rounded-2xl flex items-center justify-center mb-4">
                                    <ShoppingBag className="w-8 h-8 text-[var(--text-muted)]" />
                                </div>
                                <h3 className="text-xl font-semibold text-[var(--text-main)] mb-2">
                                    Your order history is empty
                                </h3>
                                <p className="text-[var(--text-muted)] max-w-sm mb-6">
                                    Medications you order will appear here.
                                </p>
                                <Link href="/patient">
                                    <Button>Start Shopping</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </motion.div>
    );
}
