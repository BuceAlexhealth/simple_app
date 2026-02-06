/**
 * Order status utilities
 * Centralizes all order status logic, styling, and text handling
 */

import { ORDER_CONFIG, CSS_CLASSES } from '@/config/constants';
import type { OrderStatus, InitiatorType } from '@/types';

/**
 * Get the appropriate badge variant for an order status
 */
export function getOrderBadgeVariant(
  status: OrderStatus,
  initiatorType?: InitiatorType
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'primary' | 'gradient' {
  // Special case for pharmacy-initiated orders that are still placed (waiting for patient)
  if (initiatorType === 'pharmacy' && status === 'placed') {
    return 'secondary';
  }

  switch (status) {
    case 'placed':
      return 'warning';
    case 'ready':
      return 'default';
    case 'complete':
      return 'success';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * Get the display text for an order status
 */
export function getOrderStatusText(
  status: OrderStatus,
  initiatorType?: InitiatorType
): string {
  // Special case for pharmacy-initiated orders
  if (initiatorType === 'pharmacy') {
    if (status === 'placed') return 'Waiting for Patient';
    if (status === 'cancelled') return 'Rejected';
  }

  // Use the centralized status labels
  return ORDER_CONFIG.STATUS_LABELS[status] || status.toUpperCase();
}

/**
 * Get the color associated with an order status
 */
export function getOrderStatusColor(status: OrderStatus): string {
  return ORDER_CONFIG.STATUS_COLORS[status] || 'var(--neutral)';
}

/**
 * Get the border color for order cards based on status
 */
export function getOrderBorderColor(status: OrderStatus): string {
  switch (status) {
    case 'complete':
      return 'border-l-emerald-500';
    case 'ready':
      return 'border-l-[var(--primary)]';
    case 'placed':
      return 'border-l-amber-500';
    case 'cancelled':
      return 'border-l-red-500';
    default:
      return 'border-l-gray-500';
  }
}

/**
 * Check if an order can be updated to a specific status
 */
export function canUpdateOrderStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  userRole: 'patient' | 'pharmacist'
): boolean {
  // Define allowed status transitions based on user role
  const allowedTransitions: Record<string, Record<OrderStatus, OrderStatus[]>> = {
    patient: {
      placed: ['cancelled'],
      ready: ['complete'],
      complete: [],
      cancelled: [],
    },
    pharmacist: {
      placed: ['ready', 'cancelled'],
      ready: ['complete', 'cancelled'],
      complete: [],
      cancelled: [],
    },
  };

  const roleTransitions = allowedTransitions[userRole];
  if (!roleTransitions || !roleTransitions[currentStatus]) {
    return false;
  }

  return roleTransitions[currentStatus].includes(newStatus);
}

/**
 * Get the available status transitions for an order
 */
export function getAvailableStatusTransitions(
  currentStatus: OrderStatus,
  userRole: 'patient' | 'pharmacist'
): OrderStatus[] {
  const transitions: Record<string, Record<OrderStatus, OrderStatus[]>> = {
    patient: {
      placed: ['cancelled'],
      ready: ['complete'],
      complete: [],
      cancelled: [],
    },
    pharmacist: {
      placed: ['ready', 'cancelled'],
      ready: ['complete', 'cancelled'],
      complete: [],
      cancelled: [],
    },
  };

  return transitions[userRole]?.[currentStatus] || [];
}

/**
 * Check if an order is in a final state (cannot be modified)
 */
export function isOrderInFinalState(status: OrderStatus): boolean {
  return status === 'complete' || status === 'cancelled';
}

/**
 * Get the appropriate icon for an order status
 */
export function getOrderStatusIcon(status: OrderStatus): string {
  switch (status) {
    case 'placed':
      return 'Clock';
    case 'ready':
      return 'Package';
    case 'complete':
      return 'CheckCircle2';
    case 'cancelled':
      return 'XCircle';
    default:
      return 'AlertCircle';
  }
}

/**
 * Format order price display
 */
export function formatOrderPrice(price: number, currency = '₹'): string {
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Generate order ID display (shortened version)
 */
export function formatOrderId(orderId: string, maxLength = 8): string {
  return `#${orderId.slice(0, maxLength)}`;
}

/**
 * Get order timeline based on status
 */
export function getOrderTimeline(status: OrderStatus): Array<{
  status: OrderStatus;
  label: string;
  completed: boolean;
  current: boolean;
}> {
  const timeline: Array<{
    status: OrderStatus;
    label: string;
    completed: boolean;
    current: boolean;
  }> = [
    {
      status: 'placed',
      label: 'Order Placed',
      completed: true,
      current: status === 'placed',
    },
    {
      status: 'ready',
      label: 'Ready for Pickup',
      completed: ['ready', 'complete'].includes(status),
      current: status === 'ready',
    },
    {
      status: 'complete',
      label: 'Completed',
      completed: status === 'complete',
      current: status === 'complete',
    },
  ];

  // If cancelled, add a special timeline
  if (status === 'cancelled') {
    return [
      {
        status: 'placed',
        label: 'Order Placed',
        completed: true,
        current: false,
      },
      {
        status: 'cancelled',
        label: 'Cancelled',
        completed: true,
        current: true,
      },
    ];
  }

  return timeline;
}

/**
 * Order status configuration object for easy consumption
 */
export const ORDER_STATUS_CONFIG = {
  // Visual styling
  getBadgeVariant: getOrderBadgeVariant,
  getColor: getOrderStatusColor,
  getBorderColor: getOrderBorderColor,
  getIcon: getOrderStatusIcon,
  
  // Text and display
  getText: getOrderStatusText,
  formatPrice: formatOrderPrice,
  formatId: formatOrderId,
  
  // Business logic
  canUpdate: canUpdateOrderStatus,
  getAvailableTransitions: getAvailableStatusTransitions,
  isFinalState: isOrderInFinalState,
  getTimeline: getOrderTimeline,
} as const;