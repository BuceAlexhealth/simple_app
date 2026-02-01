"use client";

import { CheckCircle2, Clock, Package, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Order, OrderStatus } from "@/types";

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
  const getBadgeVariant = (status: OrderStatus, acceptanceStatus?: string, initiatorType?: string) => {
    if (initiatorType === 'pharmacy' && acceptanceStatus === 'pending') {
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
      if (order.acceptance_status === 'pending') return 'Pending Acceptance';
      if (order.acceptance_status === 'rejected') return 'Rejected';
    }
    return order.status;
  };

  return (
    <Card 
      id={`order-${order.id}`} 
      className={`border-l-4 border-l-blue-600 transition-all duration-300 ${
        isExpanded ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
    >
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
                onClick={onToggleExpand}
                className="text-blue-600 hover:text-blue-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between text-sm bg-white p-2 rounded-lg">
                  <span className="font-medium text-slate-700">
                                            {item.inventory?.name || `Item ${index + 1}`}
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
            onClick={onToggleExpand}
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
              onClick={() => onUpdateStatus(order.id, 'ready')}
            >
              <Package className="w-4 h-4 mr-2" /> Ready for Pickup
            </Button>
          )}
          {order.status === 'ready' && (
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onUpdateStatus(order.id, 'complete')}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Finalize Delivery
            </Button>
          )}
          <a href="/pharmacy/chats" className="flex-1">
            <Button variant="outline" className="w-full">
              Message Patient
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}