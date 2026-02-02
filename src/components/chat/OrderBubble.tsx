"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { User, Store, ShoppingCart, Check, ExternalLink, Clock, AlertCircle, Package } from "lucide-react";
import { motion } from "framer-motion";

interface OrderBubbleProps {
    msg: any;
    role: 'patient' | 'pharmacy';
    currentUser: any;
    selectedConnection: any;
}

export function OrderBubble({ msg, role, currentUser, selectedConnection }: OrderBubbleProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderStatus, setOrderStatus] = useState<string | null>(null);

    // Identify message type
    const isPharmacyOrder = msg.content.includes("PHARMACY_ORDER_REQUEST");
    // const isOrderResponse = msg.content.includes("ORDER_ACCEPTED") || msg.content.includes("ORDER_REJECTED") || msg.content.includes("ORDER_EXPIRED"); // implied by logic below or explicitly checked

    // Parse content
    const orderId = msg.content.match(/ORDER_ID:([0-9a-f-]{36})/)?.[1];
    const total = msg.content.match(/TOTAL:₹([^\\n]+)/)?.[1] || '0.00';
    const items = msg.content.match(/ITEMS:([^\\n]+)/)?.[1] || 'Items';
    const notes = msg.content.match(/NOTES:([^\\n]+)/)?.[1] || 'None';
    const statusLine = msg.content.match(/STATUS:([^\\n]+)/)?.[1] || 'Unknown';
    
    const lines = msg.content.split('\n\n')[0]; // First section of text
    const responseText = msg.content.match(/RESPONSE:([^\\n]+)/)?.[1];

    const isCancelled = msg.content.includes("ORDER_STATUS:cancelled");

    // --- SHARED / GENERIC ORDER NOTIFICATION (User placed order) ---
    // This handles the "Order Placed" / "Order Cancelled" notification seen by both parties mostly
    // But specifically logic from Patient's "Regular order notification" and Pharmacy's "Regular order notification"
    // They are almost identical.
    if (!isPharmacyOrder && !msg.content.includes("ORDER_ACCEPTED") && !msg.content.includes("ORDER_REJECTED") && !msg.content.includes("ORDER_EXPIRED")) {
        // Standard "Order Placed" message
        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => orderId && (window.location.href = role === 'patient' ? `/patient/orders#order-${orderId}` : `/pharmacy#order-${orderId}`)}
                className={`w-full max-w-sm rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${isCancelled ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}
            >
                <div className={`p-3 flex items-center justify-between ${isCancelled ? 'bg-red-100/50' : 'bg-emerald-100/50'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isCancelled ? 'bg-white text-red-500' : 'bg-white text-emerald-500'}`}>
                            {role === 'patient' ? <ShoppingCart className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${isCancelled ? 'text-red-700' : 'text-emerald-700'}`}>
                            {isCancelled ? 'Order Cancelled' : (role === 'patient' ? 'Order Placed' : 'New Order')}
                        </span>
                    </div>
                    <ExternalLink className={`w-3.5 h-3.5 ${isCancelled ? 'text-red-400' : 'text-emerald-400'}`} />
                </div>

                <div className="p-4 bg-white/50 space-y-3">
                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                        {lines}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                        <div className="text-xs text-slate-500">{role === 'patient' ? 'View Details' : `Order #${orderId?.slice(0, 8)}`}</div>
                        <div className="font-bold text-slate-900 italic">₹{total}</div>
                    </div>
                </div>
            </motion.div>
        );
    }


    // --- PHARMACY ORDER REQUEST LOGIC ---

    // 1. PATIENT VIEW: Sees "Accept/Reject" buttons or status
    if (role === 'patient' && isPharmacyOrder) {

        // Local check for status if it's a dynamic order card interacting with DB
        useEffect(() => {
            if (isPharmacyOrder && orderId) {
                checkOrderStatus();
            }
        }, [isPharmacyOrder, orderId]);

        async function checkOrderStatus() {
            const { data } = await supabase
                .from("orders")
                .select("acceptance_status")
                .eq("id", orderId)
                .single();

            if (data) {
                setOrderStatus(data.acceptance_status);
            }
        }

        async function handleOrderAction(action: 'accept' | 'reject') {
            if (!orderId) return;
            setIsProcessing(true);
            try {
                if (action === 'accept') {
                    const { error: updateError } = await supabase
                        .from("orders")
                        .update({ acceptance_status: 'accepted', status: 'placed' })
                        .eq("id", orderId);
                    if (updateError) throw updateError;

                    await supabase.from("messages").insert({
                        sender_id: currentUser.id,
                        receiver_id: selectedConnection.id,
                        content: `ORDER_ACCEPTED\nORDER_ID:${orderId}\nRESPONSE:Customer has accepted the order\nSTATUS:Ready for fulfillment`
                    });
                    toast.success("Order accepted!");
                } else {
                    const { error: updateError } = await supabase
                        .from("orders")
                        .update({ acceptance_status: 'rejected', status: 'cancelled' })
                        .eq("id", orderId);
                    if (updateError) throw updateError;

                    await supabase.from("messages").insert({
                        sender_id: currentUser.id,
                        receiver_id: selectedConnection.id,
                        content: `ORDER_REJECTED\nORDER_ID:${orderId}\nRESPONSE:Customer has rejected the order\nSTATUS:Cancelled`
                    });
                    toast.success("Order rejected.");
                }
                setOrderStatus(action === 'accept' ? 'accepted' : 'rejected');
            } catch (error: any) {
                toast.error("Error: " + error.message);
            } finally {
                setIsProcessing(false);
            }
        }

        const isPending = orderStatus === 'pending' || (!orderStatus && statusLine.includes('Pending'));
        const isExpired = false; // Remove expiry logic - orders no longer expire
        const isAccepted = orderStatus === 'accepted';
        const isRejected = orderStatus === 'rejected';

        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                className={`w-full max-w-sm rounded-2xl overflow-hidden border-2 transition-all ${isRejected ? 'bg-red-50 border-red-100' :
                    isAccepted ? 'bg-emerald-50 border-emerald-100' :
                        isExpired ? 'bg-amber-50 border-amber-100' :
                            'bg-indigo-50 border-indigo-100'
                    }`}
            >
                <div className={`p-3 flex items-center justify-between ${isRejected ? 'bg-red-100/50' :
                    isAccepted ? 'bg-emerald-100/50' :
                        isExpired ? 'bg-amber-100/50' :
                            'bg-indigo-100/50'
                    }`}>
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isRejected ? 'bg-white text-red-500' :
                            isAccepted ? 'bg-white text-emerald-500' :
                                isExpired ? 'bg-white text-amber-500' :
                                    'bg-white text-indigo-500'
                            }`}>
                            {isRejected ? <AlertCircle className="w-4 h-4" /> :
                                isAccepted ? <Check className="w-4 h-4" /> :
                                    isExpired ? <Clock className="w-4 h-4" /> :
                                        <ShoppingCart className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${isRejected ? 'text-red-700' :
                            isAccepted ? 'text-emerald-700' :
                                isExpired ? 'text-amber-700' :
                                    'text-indigo-700'
                            }`}>
                            {isRejected ? 'Order Rejected' :
                                isAccepted ? 'Order Accepted' :
                                    isExpired ? 'Order Expired' :
                                        'Order Request'}
                        </span>
                    </div>
{isPending && (
                        <div className="text-xs text-indigo-600 font-medium">
                            Pending Acceptance
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white/50 space-y-3">
                    <div className="space-y-2">
                        <div className="text-xs text-slate-500 font-medium">ORDER DETAILS</div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Total:</span>
                                <span className="font-semibold text-slate-900">₹{total}</span>
                            </div>
                            <div className="text-sm text-slate-600">
                                <span className="font-medium">Items:</span> {items}
                            </div>
                            {notes !== 'None' && (
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium">Notes:</span> {notes}
                                </div>
                            )}
                        </div>
                    </div>

                    {isPending && !isExpired && (
                        <div className="flex gap-2 pt-3 border-t border-slate-200/50">
                            <button
                                onClick={() => handleOrderAction('accept')}
                                disabled={isProcessing}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                            >
                                {isProcessing ? 'Processing...' : 'Accept'}
                            </button>
                            <button
                                onClick={() => handleOrderAction('reject')}
                                disabled={isProcessing}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                            >
                                {isProcessing ? 'Processing...' : 'Reject'}
                            </button>
                        </div>
                    )}

                    {isExpired && (
                        <div className="pt-3 border-t border-slate-200/50">
                            <div className="text-xs text-amber-600 font-medium text-center">
                                This order has expired.
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }

    // 2. PHARMACY VIEW: Sees "Request Sent" or "Customer Response"
    if (role === 'pharmacy') {
        const isAccepted = msg.content.includes("ORDER_ACCEPTED");
        const isRejected = msg.content.includes("ORDER_REJECTED");
        const isExpired = msg.content.includes("ORDER_EXPIRED");

        if (isAccepted || isRejected || isExpired) {
            return (
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`w-full max-w-sm rounded-2xl overflow-hidden border-2 transition-all ${isRejected || isExpired ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}
                >
                    <div className={`p-3 flex items-center justify-between ${isRejected || isExpired ? 'bg-red-100/50' : 'bg-emerald-100/50'}`}>
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${isRejected || isExpired ? 'bg-white text-red-500' : 'bg-white text-emerald-500'}`}>
                                {isExpired ? '⏰' : isRejected ? '❌' : '✓'}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isRejected || isExpired ? 'text-red-700' : 'text-emerald-700'}`}>
                                {isExpired ? 'Order Expired' : isRejected ? 'Order Rejected' : 'Order Accepted'}
                            </span>
                        </div>
                        <ExternalLink className={`w-3.5 h-3.5 ${isRejected ? 'text-red-400' : 'text-emerald-400'}`} />
                    </div>

                    <div className="p-4 bg-white/50 space-y-3">
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                            {responseText ? `Customer response: ${responseText}` : 'Status updated.'}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                            <div className="text-xs text-slate-500">Order #{orderId?.slice(0, 8)}</div>
                            <div className="font-bold text-slate-900">₹{total}</div>
                        </div>
                    </div>
                </motion.div>
            )
        }

        // The initial request sent by pharmacy
        if (isPharmacyOrder) {
            return (
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => orderId && (window.location.href = `/pharmacy#order-${orderId}`)}
                    className="w-full max-w-sm rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-indigo-50 border-indigo-100"
                >
                    <div className="p-3 flex items-center justify-between bg-indigo-100/50">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-white text-indigo-500">
                                <Package className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                                Your Order Request
                            </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="p-4 bg-white/50 space-y-3">
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                            Order sent to customer for acceptance
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                            <div className="text-xs text-slate-500">
                                Order <span className="font-mono text-slate-700">#{orderId?.slice(0, 8)}</span>
                            </div>
                            <div className="font-bold text-slate-900">₹{total}</div>
                        </div>
                    </div>
                </motion.div>
            );
        }
    }

    return null; // Fallback
}
