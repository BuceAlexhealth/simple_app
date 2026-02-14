export type OrderStatus = 'placed' | 'ready' | 'complete' | 'cancelled';
export type InitiatorType = 'patient' | 'pharmacy';
export type FulfillmentStatus = 'pending' | 'preparing' | 'completed' | 'partial' | 'cancelled';

export type BatchMovementType = 'IN' | 'OUT' | 'ADJUST' | 'EXPIRED' | 'RETURN';

export interface Batch {
  id: string;
  inventory_id: string;
  batch_code: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity: number;
  remaining_qty: number;
  pharmacy_id: string;
  created_at?: string;
}

export interface BatchMovement {
  id: string;
  batch_id: string;
  movement_type: BatchMovementType;
  quantity: number;
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    price: number;
    stock: number;
    brand_name?: string;
    form?: string;
    pharmacy_id: string;
    created_at?: string;
    profiles?: {
        full_name: string;
    };
    batches?: Batch[];
    total_remaining_qty?: number;
}

export interface CartItem extends InventoryItem {
    quantity: number;
}

export interface Order {
    id: string;
    created_at: string;
    patient_id: string | null;
    pharmacy_id: string;
    total_price: number;
    status: OrderStatus;
    initiator_type?: InitiatorType;
    pharmacy_notes?: string;
    fulfillment_status?: FulfillmentStatus;
    fulfillment_notes?: string;
    is_walkin?: boolean;
    walkin_name?: string;
    walkin_phone?: string;
    patient?: {
        full_name?: string;
    };
}

export interface OrderFulfillment {
    id: string;
    order_id: string;
    inventory_id: string;
    batch_id?: string;
    requested_qty: number;
    fulfilled_qty: number;
    notes?: string;
    fulfilled_by?: string;
    fulfilled_at?: string;
    created_at?: string;
    batch?: Batch;
    inventory?: Partial<InventoryItem>;
}

export type InvoiceStatus = 'issued' | 'paid' | 'cancelled';

export interface Invoice {
    id: string;
    invoice_number: string;
    order_id: string;
    pharmacy_id: string;
    patient_id: string;
    patient_name: string;
    patient_phone?: string;
    patient_address?: string;
    pharmacy_name: string;
    pharmacy_address?: string;
    pharmacy_phone?: string;
    pharmacy_license?: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    notes?: string;
    status: InvoiceStatus;
    invoice_date: string;
    created_at: string;
}

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    inventory_id: string;
    item_name: string;
    item_brand?: string;
    item_form?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export type UserRole = 'patient' | 'pharmacist' | 'admin';

export interface Profile {
    id: string;
    role: UserRole;
    full_name: string;
    email?: string;
    phone?: string;
    address?: string;
    date_of_birth?: string;
    avatar_url?: string;
    created_at?: string;
}

export interface AuthUser {
    id: string;
    email?: string;
    created_at?: string;
}
