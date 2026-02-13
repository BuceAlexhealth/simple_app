-- Batch Management System for Pharmacy Inventory
-- Implements FEFO (First Expired, First Out) for pharmaceutical compliance

-- 1. Create batches table
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    batch_code TEXT NOT NULL,
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    remaining_qty INTEGER NOT NULL DEFAULT 0,
    pharmacy_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_dates CHECK (expiry_date > manufacturing_date),
    CONSTRAINT valid_quantity CHECK (remaining_qty >= 0 AND remaining_qty <= quantity),
    UNIQUE (inventory_id, batch_code)
);

-- 2. Create index for FEFO queries (fastest expiry first)
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(inventory_id, expiry_date);

-- 3. Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_batches_inventory ON batches(inventory_id);
CREATE INDEX IF NOT EXISTS idx_batches_pharmacy ON batches(pharmacy_id);

-- 4. Batch movement log for audit trail
CREATE TABLE IF NOT EXISTS batch_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUST', 'EXPIRED', 'RETURN')),
    quantity INTEGER NOT NULL,
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 5. Index for audit queries
CREATE INDEX IF NOT EXISTS idx_batch_movements_batch ON batch_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_movements_created ON batch_movements(created_at DESC);

-- 6. Add batch_id to order_items for traceability
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id);

-- 7. Create function to check if batch is expired
CREATE OR REPLACE FUNCTION is_batch_expired(p_batch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_expiry_date DATE;
BEGIN
    SELECT expiry_date INTO v_expiry_date FROM batches WHERE id = p_batch_id;
    RETURN v_expiry_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to get total stock from batches
CREATE OR REPLACE FUNCTION get_inventory_total_stock(p_inventory_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total INTEGER;
BEGIN
    SELECT COALESCE(SUM(remaining_qty), 0) INTO v_total
    FROM batches
    WHERE inventory_id = p_inventory_id;
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- 9. Enable RLS
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_movements ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for batches - using auth.uid() directly since pharmacy_id references auth.users
CREATE POLICY "Users can view own pharmacy batches" ON batches
    FOR SELECT USING (pharmacy_id = auth.uid());

CREATE POLICY "Users can insert own pharmacy batches" ON batches
    FOR INSERT WITH CHECK (pharmacy_id = auth.uid());

CREATE POLICY "Users can update own pharmacy batches" ON batches
    FOR UPDATE USING (pharmacy_id = auth.uid());

CREATE POLICY "Users can delete own pharmacy batches" ON batches
    FOR DELETE USING (pharmacy_id = auth.uid());

-- 11. RLS Policies for batch_movements
CREATE POLICY "Users can view own pharmacy batch movements" ON batch_movements
    FOR SELECT USING (
        batch_id IN (SELECT id FROM batches WHERE pharmacy_id = auth.uid())
    );

CREATE POLICY "Users can insert own pharmacy batch movements" ON batch_movements
    FOR INSERT WITH CHECK (
        batch_id IN (SELECT id FROM batches WHERE pharmacy_id = auth.uid())
    );
