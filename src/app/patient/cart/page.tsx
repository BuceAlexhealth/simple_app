"use client";

import { useEffect, useState } from "react";
import {
    ChevronLeft,
    Trash2,
    Plus,
    Minus,
    ShoppingBag,
    CreditCard,
    Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { createRepositories } from "@/lib/repositories";
import { useUser } from "@/hooks/useAuth";
import { useCart, useCartValidation } from "@/contexts/CartContext";
import { format, notifications } from "@/lib/notifications";

export default function PatientCartPage() {
    const [isOrdering, setIsOrdering] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user } = useUser();
    const { items: cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { canCheckout, itemCount } = useCartValidation();

    useEffect(() => {
        setLoading(false);
    }, []);

    const createOrder = async () => {
        if (!user || !canCheckout || cart.length === 0) return;

        setIsOrdering(true);
        try {
            const { orders: ordersRepo } = createRepositories(supabase);
            
            const orderData = {
                patient_id: user.id,
                pharmacy_id: cart[0].pharmacy_id,
                total_price: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                status: 'placed',
                initiator_type: 'patient' as const,
            };

            const order = await ordersRepo.createOrder(orderData);

            if (order) {
                const { data: orderItems, error: itemsError } = await supabase
                    .from('order_items')
                    .insert(
                        cart.map(item => ({
                            order_id: order.id,
                            inventory_id: item.id,
                            quantity: item.quantity,
                            price_at_time: item.price,
                        }))
                    )
                    .select();

                if (!itemsError && orderItems) {
                    clearCart();
                    notifications.order.created();
                    
                    await sendOrderNotificationToPharmacy(order, user.id, cart[0].pharmacy_id);
                    
                    setTimeout(() => {
                        router.push('/patient/orders');
                    }, 2000);
                } else {
                    throw new Error('Failed to create order items');
                }
            }
        } catch (error) {
            notifications.error('Failed to create order. Please try again.');
        } finally {
            setIsOrdering(false);
        }
    };

    const sendOrderNotificationToPharmacy = async (order: any, patientId: string, pharmacyId: string) => {
        const { messages: messagesRepo } = createRepositories(supabase);
        const orderItemsSummary = cart.map(item => `${item.name} (x${item.quantity})`).join(", ");
        const orderSummary = `New Order #${order.id.slice(0, 8)}: ${orderItemsSummary}\nTotal: ₹${order.total_price.toFixed(2)}`;
        const messageContent = orderSummary + `\n\nORDER_ID:${order.id}\nORDER_STATUS:placed\nORDER_TOTAL:${order.total_price}`;

        try {
            await messagesRepo.sendMessage({
                sender_id: patientId,
                receiver_id: pharmacyId,
                content: messageContent,
                order_id: order.id
            });
        } catch (error) {
            console.error('Failed to send order notification:', error);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
                <p className="text-sm text-[var(--text-muted)]">Loading cart...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/patient">
                    <Button variant="ghost" size="icon" className="rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShoppingBag className="w-5 h-5 text-[var(--primary)]" />
                        <span className="text-sm font-medium text-[var(--primary)]">Shopping Cart</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--text-main)]">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </h1>
                </div>
            </div>

            {cart.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-[var(--surface-bg)] rounded-2xl flex items-center justify-center mb-4">
                            <ShoppingBag className="w-8 h-8 text-[var(--primary)]" />
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--text-main)] mb-2">
                            Your cart is empty
                        </h3>
                        <p className="text-[var(--text-muted)] mb-6 max-w-sm">
                            Add some medications to your cart to proceed with checkout.
                        </p>
                        <Link href="/patient">
                            <Button>Browse Medications</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Cart Items */}
                    <div className="space-y-4">
                        <AnimatePresence>
                            {cart.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card>
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--primary-light)] to-[var(--surface-bg)] flex items-center justify-center text-[var(--primary)] font-bold text-xl">
                                                    {item.name.charAt(0)}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-[var(--text-main)] truncate">
                                                        {item.name}
                                                    </h3>
                                                    {item.brand_name && (
                                                        <p className="text-sm text-[var(--text-muted)]">
                                                            {item.brand_name}
                                                        </p>
                                                    )}
                                                    <p className="text-lg font-bold text-[var(--text-main)] mt-1">
                                                        {format.currency(item.price)}
                                                        <span className="text-sm font-normal text-[var(--text-muted)] ml-1">per unit</span>
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center bg-[var(--surface-bg)] rounded-lg border border-[var(--border)]">
                                                        <button
                                                            className="w-10 h-10 flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors rounded-l-lg"
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="w-12 text-center font-bold text-[var(--text-main)]">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            className="w-10 h-10 flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors rounded-r-lg"
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-[var(--error)] hover:bg-[var(--error-bg)]"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary */}
                    <Card>
                        <CardContent className="p-5">
                            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-4">
                                Order Summary
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">Subtotal ({itemCount} items)</span>
                                    <span className="font-medium text-[var(--text-main)]">
                                        {format.currency(
                                            cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">Delivery</span>
                                    <span className="font-medium text-[var(--text-main)]">Free</span>
                                </div>
                                <div className="h-px bg-[var(--border)] my-3" />
                                <div className="flex justify-between text-lg font-bold">
                                    <span className="text-[var(--text-main)]">Total</span>
                                    <span className="text-[var(--text-main)]">
                                        {format.currency(
                                            cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                                        )}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Checkout Actions */}
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/patient')}
                            className="flex-1"
                        >
                            Continue Shopping
                        </Button>
                        <Button
                            onClick={createOrder}
                            disabled={!canCheckout || isOrdering}
                            className="flex-1"
                        >
                            {isOrdering ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Place Order
                                </>
                            )}
                        </Button>
                    </div>
                </>
            )}
        </motion.div>
    );
}
