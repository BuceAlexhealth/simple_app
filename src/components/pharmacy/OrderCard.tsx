"use client";

import { CheckCircle2, Clock, Package, X, ArrowRight, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Order, OrderStatus } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
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
      return "secondary";
    }

    switch (status) {
      case 'placed': return "warning";
      case 'ready': return "default";
      case 'complete': return "success";
      case 'cancelled': return "destructive";
      default: return "secondary";
    }
  };

  const getOrderStatusText = (order: Order) => {
    if (order.initiator_type === 'pharmacy') {
      if (order.status === 'placed') return 'Waiting';
      if (order.status === 'cancelled') return 'Rejected';
    }
    return order.status.charAt(0).toUpperCase() + order.status.slice(1);
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return <Clock className="w-3 h-3" />;
      case 'ready': return <Package className="w-3 h-3" />;
      case 'complete': return <CheckCircle2 className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      id={`order-${order.id}`}
    >
      <Card className={`card-border-left ${
        order.status === 'complete' ? 'card-border-success' :
        order.status === 'ready' ? 'card-border-primary' :
        'card-border-warning'
      }`}>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-mono-sm bg-[var(--surface-bg)] text-muted px-2 py-0.5 rounded">
                  #{order.id.slice(0, 8)}
                </span>
                <Badge variant={getBadgeVariant(order.status, order.initiator_type)} className="text-xs">
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{getOrderStatusText(order)}</span>
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-price text-2xl">
                  ₹{order.total_price.toFixed(2)}
                </span>
                <span className="text-caption">Total</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[var(--surface-bg)] px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <div>
                <p className="text-caption">Received</p>
                <p className="text-sm font-medium text-[var(--text-main)]">
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-4 p-4 bg-[var(--surface-bg)] rounded-xl border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="heading-sm text-[var(--text-main)] flex items-center gap-2">
                      <Package className="w-4 h-4 text-[var(--primary)]" />
                      Ordered Items
                    </h4>
                    <button
                      onClick={onToggleExpand}
                      className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between text-sm p-2 bg-[var(--card-bg)] rounded-lg border border-[var(--border)]"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[var(--primary-light)] flex items-center justify-center text-primary text-badge font-semibold">
                            {index + 1}
                          </div>
                          <span className="font-medium text-[var(--text-main)] text-truncate">
                            {item.inventory?.name || `Product #${index + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-caption">Qty: {item.quantity}</span>
                          <span className="text-price-sm min-w-[60px] text-right">
                            ₹{(item.price_at_time * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-3 mt-2 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between">
                        <span className="text-caption">Subtotal</span>
                        <span className="text-price text-lg">
                          ₹{order.total_price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--border)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="text-[var(--primary)] hover:bg-[var(--primary-light)]"
            >
              {isExpanded ? 'Collapse' : 'Details'}
              {isExpanded ? <X className="w-4 h-4 ml-1" /> : <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>

            {order.initiator_type === 'pharmacy' && order.status === 'placed' && (
              <div className="flex-1 flex items-center justify-center bg-warning-light text-warning-dark px-3 py-1.5 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                Waiting for Customer
              </div>
            )}

            <div className="flex-1 flex gap-2 justify-end">
              {order.status === 'placed' && order.initiator_type !== 'pharmacy' && (
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(order.id, 'ready')}
                >
                  <Package className="w-4 h-4 mr-1.5" />
                  Mark Ready
                </Button>
              )}
              
                {order.status === 'ready' && (
                  <Button
                    size="sm"
                    className="bg-[var(--success-600)] hover:bg-[var(--success-500)]"
                    onClick={() => onUpdateStatus(order.id, 'complete')}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Complete
                  </Button>
                )}
              
              <Link href="/pharmacy/chats">
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Message
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
