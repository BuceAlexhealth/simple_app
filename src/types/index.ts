export type OrderStatus = 'placed' | 'ready' | 'complete' | 'cancelled';
export type InitiatorType = 'patient' | 'pharmacy';

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
    patient_id: string;
    pharmacy_id: string;
    total_price: number;
    status: OrderStatus;
    initiator_type?: InitiatorType;
    pharmacy_notes?: string;
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
