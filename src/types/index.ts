export type OrderStatus = 'placed' | 'ready' | 'complete' | 'cancelled';
export type InitiatorType = 'patient' | 'pharmacy';
export type AcceptanceStatus = 'pending' | 'accepted' | 'rejected';

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
    acceptance_status?: AcceptanceStatus;
    acceptance_deadline?: string;
    pharmacy_notes?: string;
}
