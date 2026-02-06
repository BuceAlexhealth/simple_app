/**
 * Order parsing service
 * Handles parsing of order messages and extracting structured data
 */

import { REGEX_PATTERNS } from '@/config/constants';
import { ORDER_STATUS_CONFIG } from '@/lib/order-status';
import type { OrderStatus, InitiatorType } from '@/types';

export interface ParsedOrderData {
  orderId?: string;
  total?: number;
  items?: string;
  notes?: string;
  status?: OrderStatus;
  isPharmacyOrder?: boolean;
  isOrderResponse?: boolean;
  isCancelled?: boolean;
  responseText?: string;
  lines?: string;
}

export interface OrderAction {
  type: 'accept' | 'reject' | 'complete' | 'cancel';
  label: string;
  variant: 'default' | 'destructive' | 'secondary';
  icon: string;
  handler?: () => void;
}

/**
 * Parse order message content to extract structured data
 */
export function parseOrderMessage(content: string): ParsedOrderData {
  const result: ParsedOrderData = {};

  // Basic regex patterns (moved from constants)
  const orderIdMatch = content.match(/ORDER_ID:([0-9a-f-]{36})/);
  const totalMatch = content.match(/TOTAL:₹([^\\n]+)/);
  const itemsMatch = content.match(/ITEMS:([^\\n]+)/);
  const notesMatch = content.match(/NOTES:([^\\n]+)/);
  const statusMatch = content.match(/STATUS:([^\\n]+)/);
  const responseMatch = content.match(/RESPONSE:([^\\n]+)/);

  result.orderId = orderIdMatch?.[1];
  result.total = totalMatch?.[1] ? parseFloat(totalMatch[1]) : undefined;
  result.items = itemsMatch?.[1] || 'Items';
  result.notes = notesMatch?.[1] || 'None';
  result.lines = content.split('\\n\\n')[0];
  result.responseText = responseMatch?.[1];

  // Message type detection
  result.isPharmacyOrder = content.includes("PHARMACY_ORDER_REQUEST");
  result.isOrderResponse = content.includes("ORDER_ACCEPTED") || 
                        content.includes("ORDER_REJECTED") || 
                        content.includes("ORDER_EXPIRED");
  result.isCancelled = content.includes("ORDER_STATUS:cancelled");

  // Status parsing
  const statusText = statusMatch?.[1];
  if (statusText) {
    // Map status text to OrderStatus enum
    const statusMap: Record<string, OrderStatus> = {
      'placed': 'placed',
      'ready': 'ready', 
      'complete': 'complete',
      'cancelled': 'cancelled',
      'waiting for patient': 'placed',
      'rejected': 'cancelled',
      'expired': 'cancelled'
    };
    
    result.status = statusMap[statusText.toLowerCase()] || 'placed';
  }

  return result;
}

/**
 * Determine available actions for an order based on user role and order status
 */
export function getOrderActions(
  parsedOrder: ParsedOrderData,
  userRole: 'patient' | 'pharmacy',
  currentUser: any,
  onAction?: (action: OrderAction) => void
): OrderAction[] {
  const actions: OrderAction[] = [];
  
  if (!parsedOrder.orderId || !parsedOrder.status) {
    return actions;
  }

  const isOwnOrder = userRole === 'patient' ? 
    currentUser?.id === parsedOrder.orderId : 
    true; // Pharmacy can act on all orders

  if (!isOwnOrder) {
    return actions;
  }

  switch (userRole) {
    case 'patient':
      if (parsedOrder.status === 'placed' && parsedOrder.isPharmacyOrder) {
        actions.push({
          type: 'accept',
          label: 'Accept Order',
          variant: 'default',
          icon: 'Check',
          handler: () => onAction?.({ type: 'accept', label: 'Accept Order', variant: 'default', icon: 'Check', handler: () => {} })
        });
      }
      
      if (parsedOrder.status === 'placed' && !parsedOrder.isPharmacyOrder) {
        actions.push({
          type: 'cancel',
          label: 'Cancel Order',
          variant: 'destructive',
          icon: 'X',
          handler: () => onAction?.({ type: 'cancel', label: 'Cancel Order', variant: 'destructive', icon: 'X', handler: () => {} })
        });
      }
      
      if (parsedOrder.status === 'ready') {
        actions.push({
          type: 'complete',
          label: 'Mark as Received',
          variant: 'default',
          icon: 'Check',
          handler: () => onAction?.({ type: 'complete', label: 'Mark as Received', variant: 'default', icon: 'Check', handler: () => {} })
        });
      }
      break;

    case 'pharmacy':
      if (parsedOrder.status === 'placed') {
        actions.push({
          type: 'accept',
          label: 'Accept Order',
          variant: 'default',
          icon: 'Check',
          handler: () => onAction?.({ type: 'accept', label: 'Accept Order', variant: 'default', icon: 'Check', handler: () => {} })
        });
        
        actions.push({
          type: 'reject',
          label: 'Reject Order',
          variant: 'destructive',
          icon: 'X',
          handler: () => onAction?.({ type: 'reject', label: 'Reject Order', variant: 'destructive', icon: 'X', handler: () => {} })
        });
      }
      
      if (parsedOrder.status === 'ready') {
        actions.push({
          type: 'complete',
          label: 'Mark as Completed',
          variant: 'default',
          icon: 'Check',
          handler: () => onAction?.({ type: 'complete', label: 'Mark as Completed', variant: 'default', icon: 'Check', handler: () => {} })
        });
      }
      break;
  }

  return actions;
}

/**
 * Get appropriate styling for order bubble based on status and type
 */
export function getOrderBubbleStyles(parsedOrder: ParsedOrderData) {
  const isCancelled = parsedOrder.isCancelled;
  const status = parsedOrder.status;
  
  const colors = {
    background: isCancelled ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100',
    header: isCancelled ? 'bg-red-100/50' : 'bg-emerald-100/50',
    text: isCancelled ? 'text-red-700' : 'text-emerald-700',
    subtext: isCancelled ? 'text-red-600' : 'text-emerald-600',
  };

  // Adjust colors based on status
  if (!isCancelled) {
    switch (status) {
      case 'ready':
        colors.background = 'bg-blue-50 border-blue-100';
        colors.header = 'bg-blue-100/50';
        colors.text = 'text-blue-700';
        colors.subtext = 'text-blue-600';
        break;
      case 'complete':
        colors.background = 'bg-green-50 border-green-100';
        colors.header = 'bg-green-100/50';
        colors.text = 'text-green-700';
        colors.subtext = 'text-green-600';
        break;
    }
  }

  return colors;
}

/**
 * Format order display data
 */
export function formatOrderDisplay(parsedOrder: ParsedOrderData) {
  return {
    total: parsedOrder.total ? `₹${parsedOrder.total.toFixed(2)}` : '₹0.00',
    items: parsedOrder.items || 'Items',
    notes: parsedOrder.notes || 'None',
    statusText: parsedOrder.status ? 
      ORDER_STATUS_CONFIG.getText(parsedOrder.status, 'pharmacy') : 
      'Unknown',
    displayText: parsedOrder.lines || '',
  };
}

/**
 * Order processing service for handling order state changes
 */
export class OrderProcessingService {
  static async updateOrderStatus(
    orderId: string, 
    newStatus: OrderStatus, 
    userRole: 'patient' | 'pharmacy'
  ): Promise<boolean> {
    try {
      // This would integrate with your existing order service
      console.log(`Updating order ${orderId} to ${newStatus} by ${userRole}`);
      
      // For now, just return success
      // In real implementation, you'd call:
      // const { orders } = createRepositories(supabase);
      // await orders.updateOrderStatus(orderId, newStatus);
      
      return Promise.resolve(true);
    } catch (error) {
      console.error('Failed to update order status:', error);
      return false;
    }
  }

  static async sendOrderNotification(
    orderId: string,
    message: string,
    recipientId: string
  ): Promise<boolean> {
    try {
      console.log(`Sending notification for order ${orderId}: ${message}`);
      
      // In real implementation, you'd call:
      // const { messages } = createRepositories(supabase);
      // await messages.sendMessage({
      //   sender_id: currentUser.id,
      //   receiver_id: recipientId,
      //   content: message,
      //   order_id: orderId
      // });
      
      return Promise.resolve(true);
    } catch (error) {
      console.error('Failed to send order notification:', error);
      return false;
    }
  }

    static validateOrderAction(
    currentStatus: OrderStatus,
    action: OrderAction['type'],
    userRole: 'patient' | 'pharmacy'
  ): boolean {
    const targetStatus = action === 'accept' || action === 'reject' ? 'ready' : action as OrderStatus;
    return ORDER_STATUS_CONFIG.canUpdate(currentStatus, targetStatus, userRole as 'patient' | 'pharmacist');
  }
}