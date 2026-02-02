"use client";

import { CheckCircle2, Clock, Package, X, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Order, OrderStatus } from "@/types";
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

interface OrderCardProps {
  order: Order;
  items: OrderItem[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export function OrderCard({
  order,
  items,
  isExpanded,
  onToggleExpand,
  onUpdateStatus
}: OrderCardProps) {
const getBadgeVariant = (status: OrderStatus, initiatorType?: string) => {
    if (initiatorType === 'pharmacy' && status === 'placed') {
      return "secondary"; // Waiting for patient acceptance
    }

    switch (status) {
      case 'placed': return "warning";
      case 'ready': return "default"; // Changed from "primary" to "default"
      case 'complete': return "success";
      case 'cancelled': return "destructive";
      default: return "secondary";
    }
  };

const getOrderStatusText = (order: Order) => {
    if (order.initiator_type === 'pharmacy') {
      // For pharmacy-initiated orders, check if status is still 'placed' (pending acceptance)
      if (order.status === 'placed') return 'Waiting for Patient';
      if (order.status === 'cancelled') return 'Rejected';
    }
    return order.status.toUpperCase();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
<Card
        id={`order-${order.id}`}
        className={`border-l-4 ${order.status === 'complete' ? 'border-l-emerald-500' :
            order.status === 'ready' ? 'border-l-[var(--primary)]' :
              'border-l-amber-500'
          } transition-all duration-500 overflow-hidden`}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black font-mono bg-[var(--border-light)] text-[var(--text-muted)] px-2 py-0.5 rounded-md tracking-wider">
                  #{order.id.slice(0, 8)}
                </span>
                <Badge variant={getBadgeVariant(order.status, order.initiator_type)} className="font-black text-[10px] px-2 py-0.5 uppercase tracking-widest">
                  {order.status === 'placed' && <Clock className="w-3 h-3 mr-1" />}
                  {order.status === 'ready' && <Package className="w-3 h-3 mr-1" />}
                  {order.status === 'complete' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {getOrderStatusText(order)}
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[var(--text-main)]">₹{order.total_price}</span>
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Amount</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-[var(--surface-bg)] p-3 rounded-2xl border border-[var(--border)]">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[var(--text-muted)] shadow-sm">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Received At</p>
                <p className="text-sm font-black text-[var(--text-main)]">
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-6 p-5 bg-[var(--primary-light)] rounded-2xl border border-[var(--primary)] border-opacity-20">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-[var(--primary)] text-xs uppercase tracking-widest flex items-center gap-2">
                      <Package className="w-4 h-4" /> Ordered Items
                    </h4>
                    <button
                      onClick={onToggleExpand}
                      className="text-[var(--primary)] hover:opacity-70 p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between text-sm bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-white/50 hover:bg-white transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-[var(--primary)] text-xs shadow-sm">
                            {index + 1}
                          </div>
                          <span className="font-bold text-[var(--text-main)]">
                            {item.inventory?.name || `Product #${index + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-tighter">Qty: {item.quantity}</span>
                          <span className="text-sm font-black text-[var(--text-main)] min-w-[60px] text-right">
                            ₹{(item.price_at_time * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 mt-2 border-t border-[var(--primary)] border-dashed border-opacity-30">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-[var(--primary)] opacity-70">Subtotal Amount</span>
                        <span className="text-xl font-black text-[var(--text-main)] underline decoration-[var(--primary)] decoration-4 underline-offset-4">₹{order.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-3 pt-6 border-t border-[var(--border)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="font-black text-[10px] uppercase tracking-widest text-[var(--primary)] hover:bg-[var(--primary-light)] gap-2 h-10 px-4"
            >
              {isExpanded ? 'Collapse' : 'Order Details'}
              {isExpanded ? <X className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Button>

            {order.initiator_type === 'pharmacy' && order.status === 'placed' && (
              <div className="flex-1 flex items-center justify-center bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-amber-200">
                <AlertCircle className="w-4 h-4 mr-2" />
                Waiting for Customer
              </div>
            )}

            <div className="flex-1 flex gap-3">
              {order.status === 'placed' && order.initiator_type !== 'pharmacy' && (
                <Button
                  className="flex-1 h-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md hover:shadow-lg glow-primary"
                  onClick={() => onUpdateStatus(order.id, 'ready')}
                  variant="default"
                >
                  <Package className="w-4 h-4 mr-2" /> Mark Ready
                </Button>
              )}
              {order.status === 'ready' && (
                <Button
                  className="flex-1 h-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md hover:shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                  onClick={() => onUpdateStatus(order.id, 'complete')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Finalize Delivery
                </Button>
              )}
              <a href="/pharmacy/chats" className={order.status === 'complete' ? 'w-full' : 'flex-1'}>
                <Button variant="outline" className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] border-[var(--border)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] hover:border-[var(--primary)] gap-2 transition-all">
                  <MessageSquare className="w-4 h-4" /> Message
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
