"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Store, Check, ExternalLink, Clock, AlertCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { parseOrderMessage, getOrderActions, getOrderBubbleStyles, formatOrderDisplay } from "@/services/orderService";
import type { ParsedOrderData } from "@/services/orderService";
import { format, notifications } from "@/lib/notifications";
import { Loader2 } from "lucide-react";

interface Message {
  id: number | string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  created_at: string;
}

interface User {
  id: string;
}

interface Connection {
  id: string;
  full_name?: string;
}

interface OrderBubbleProps {
  msg: Message;
  role: 'patient' | 'pharmacy';
  currentUser: User;
  selectedConnection: Connection;
  onOrderAction?: (orderId: string, action: string) => void;
}

export function OrderBubble({ msg, role, currentUser, selectedConnection, onOrderAction }: OrderBubbleProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Parse order message using the service
  const parsedOrder = parseOrderMessage(msg.content);
  const styles = getOrderBubbleStyles(parsedOrder);
  const display = formatOrderDisplay(parsedOrder);
  const actions = getOrderActions(parsedOrder, role, currentUser, (action) => {
    if (onOrderAction && parsedOrder.orderId) {
      onOrderAction(parsedOrder.orderId, action.type);
    }
  });

  // Handle order action
  const handleOrderAction = async (action: typeof actions[0]) => {
    if (!parsedOrder.orderId || !action.handler) return;
    
    setIsProcessing(true);
    try {
      await action.handler?.();
      
      if (onOrderAction) {
        onOrderAction(parsedOrder.orderId, action.type);
      }
    } catch (error) {
      notifications.error('Failed to update order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render different types of order messages
  if (!parsedOrder.isPharmacyOrder && !parsedOrder.isOrderResponse) {
    // Standard order notification
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (parsedOrder.orderId) {
            const path = role === 'patient' ? `/patient/orders#order-${parsedOrder.orderId}` : `/pharmacy#order-${parsedOrder.orderId}`;
            window.location.href = path;
          }
        }}
        className={cn(
          "w-full max-w-sm rounded-2xl overflow-hidden border-2 transition-all cursor-pointer",
          styles.background
        )}
      >
        <div className={cn("p-3 flex items-center justify-between", styles.header)}>
          <div className="flex items-center gap-2">
            {parsedOrder.isCancelled ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Package className="w-4 h-4" />
            )}
            <span className="text-xs font-black uppercase tracking-wider">
              {parsedOrder.isCancelled ? 'ORDER CANCELLED' : 'ORDER PLACED'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{display.total}</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs space-y-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="opacity-50">ITEMS:</span>
              <span>{display.items}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-50">TOTAL:</span>
              <span className="font-bold">{display.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-50">NOTES:</span>
              <span>{display.notes}</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-black/5 text-xs opacity-75">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(msg.created_at).toLocaleString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                month: 'short',
                day: 'numeric' 
              })}
            </span>
            {parsedOrder.orderId && (
              <>
                <span className="opacity-50">•</span>
                <span className="font-mono">#{parsedOrder.orderId.slice(0, 8)}</span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (parsedOrder.isOrderResponse) {
    // Order response message (accept/reject)
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className={cn(
          "rounded-2xl border-2 overflow-hidden",
          parsedOrder.status === 'cancelled' ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
        )}>
          <div className={cn(
            "p-3 flex items-center gap-2",
            parsedOrder.status === 'cancelled' ? 'bg-red-100' : 'bg-emerald-100'
          )}>
            {parsedOrder.status === 'cancelled' ? (
              <AlertCircle className="w-4 h-4 text-red-600" />
            ) : (
              <Check className="w-4 h-4 text-emerald-600" />
            )}
            <span className="text-xs font-black uppercase tracking-wider">
              ORDER {parsedOrder.status?.toUpperCase()}
            </span>
          </div>

          <div className="p-4">
            <p className="text-sm text-[var(--text-main)]">
              {parsedOrder.responseText || display.displayText}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Interactive order with actions
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "w-full max-w-sm rounded-2xl overflow-hidden border-2",
        styles.background
      )}
    >
      {/* Header */}
      <div className={cn("p-3 flex items-center justify-between", styles.header)}>
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">
            PHARMACY ORDER REQUEST
          </span>
        </div>
        <Badge variant={parsedOrder.status === 'cancelled' ? 'destructive' : 'default'}>
          {display.statusText}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="text-sm space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="opacity-50">TOTAL:</span>
            <span className="font-bold text-lg">{display.total}</span>
          </div>
          <div>
            <span className="opacity-50">ITEMS:</span>
            <p className="mt-1 font-normal">{display.items}</p>
          </div>
          {parsedOrder.notes !== 'None' && (
            <div>
              <span className="opacity-50">NOTES:</span>
              <p className="mt-1 font-normal">{display.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            {actions.map((action, index) => (
              <Button
                key={action.type}
                variant={action.variant}
                size="sm"
                onClick={() => handleOrderAction(action)}
                disabled={isProcessing}
                isLoading={isProcessing}
                className="w-full"
              >
                {isProcessing && index === 0 ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Package className="w-4 h-4 mr-2" />
                )}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-[var(--surface-bg)] text-xs opacity-75">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>{format.date(msg.created_at)}</span>
          </div>
          {parsedOrder.orderId && (
            <span className="font-mono">#{parsedOrder.orderId.slice(0, 8)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}