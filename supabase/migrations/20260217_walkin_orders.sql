-- Walk-in Sales Support
-- Add fields for over-the-counter/walk-in orders

-- Add walk-in specific fields to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_walkin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS walkin_name TEXT,
ADD COLUMN IF NOT EXISTS walkin_phone TEXT;

-- Create index for walk-in queries
CREATE INDEX IF NOT EXISTS idx_orders_is_walkin ON orders(is_walkin);

COMMENT ON COLUMN orders.is_walkin IS 'True if this is a walk-in/over-the-counter sale';
COMMENT ON COLUMN orders.walkin_name IS 'Customer name for walk-in orders (optional)';
COMMENT ON COLUMN orders.walkin_phone IS 'Customer phone for walk-in orders (optional)';
