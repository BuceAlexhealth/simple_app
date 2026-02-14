-- Order Fulfillment Tracking
-- Records actual fulfillment details when orders are completed

-- Create order_fulfillments table
CREATE TABLE IF NOT EXISTS order_fulfillments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE NOT NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    requested_qty INTEGER NOT NULL CHECK (requested_qty > 0),
    fulfilled_qty INTEGER NOT NULL CHECK (fulfilled_qty >= 0),
    notes TEXT,
    fulfilled_by UUID REFERENCES auth.users(id),
    fulfilled_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_order_fulfillments_order ON order_fulfillments(order_id);
CREATE INDEX idx_order_fulfillments_inventory ON order_fulfillments(inventory_id);
CREATE INDEX idx_order_fulfillments_batch ON order_fulfillments(batch_id);

-- Add fulfillment_status to orders if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'pending' 
    CHECK (fulfillment_status IN ('pending', 'preparing', 'completed', 'partial', 'cancelled'));

-- Add pharmacy_notes for fulfillment notes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT;

COMMENT ON TABLE order_fulfillments IS 'Tracks actual fulfillment of order items - which batches were used and actual quantities given';
