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
            <div className="page-header">
                <div className="page-header-title">
                    <div className="page-header-breadcrumb">
                        <Package className="page-header-icon" />
                        <span className="page-header-label">Order History</span>
                    </div>
                    <h1 className="page-header-main">My Orders</h1>
                    <p className="page-header-subtitle">
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
                <div className="loading-container">
                    <Loader2 className="loading-spinner" />
                    <p className="loading-text">Loading orders...</p>
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
                                    <Card className={`overflow-hidden transition-all ${isExpanded ? 'order-card-expanded' : ''}`}>
                                        <CardContent className="p-5">
                                            {/* Order Header */}
                                            <div className="order-header">
                                                <div>
                                                    <p className="order-id-label">Order ID</p>
                                                    <p className="order-id-badge">
                                                        #{order.id.slice(0, 12)}
                                                    </p>
                                                </div>
                                                <Badge variant={status.variant} className="text-xs">
                                                    {status.icon}
                                                    <span className="ml-1">{order.status}</span>
                                                </Badge>
                                            </div>

                                            {/* Status Message */}
                                            <div className="order-status-message">
                                                <div className={`order-status-indicator ${
                                                    order.status === 'ready' 
                                                        ? 'order-status-ready' 
                                                        : 'order-status-default'
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
                                                        <div className="order-details-section">
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
                                                                    <div key={item.id} className="order-item-row">
                                                                        <span className="order-item-name">
                                                                            {item.inventory?.name || `Item ${index + 1}`}
                                                                        </span>
                                                                        <div className="flex items-center gap-4">
                                                                            <span className="order-item-quantity">Qty: {item.quantity}</span>
                                                                            <span className="order-item-price">
                                                                                ₹{(item.price_at_time * item.quantity).toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <div className="order-totals">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="order-total-label">Total</span>
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
                                            <div className="order-footer">
                                                <div>
                                                    <p className="order-total-label">Order Total</p>
                                                    <p className="order-total-amount">
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
                        <Card className="empty-state-card">
                            <CardContent className="empty-state-container">
                                <div className="empty-state-icon-large">
                                    <ShoppingBag className="empty-state-icon-large-icon" />
                                </div>
                                <h3 className="empty-state-title">
                                    Your order history is empty
                                </h3>
                                <p className="empty-state-description">
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
