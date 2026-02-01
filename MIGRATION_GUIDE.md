# Database Migration Guide

## Step 1: Run Database Migrations

The following SQL files need to be executed in your Supabase database:

### 1. Pharmacy-Initiated Orders Schema
```sql
-- File: supabase/migrations/20240201_pharmacy_initiated_orders.sql
ALTER TABLE orders 
ADD COLUMN initiator_type TEXT DEFAULT 'patient' CHECK (initiator_type IN ('patient', 'pharmacy')),
ADD COLUMN acceptance_status TEXT DEFAULT 'accepted' CHECK (acceptance_status IN ('pending', 'accepted', 'rejected')),
ADD COLUMN acceptance_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN pharmacy_notes TEXT;

CREATE INDEX idx_orders_initiator_type ON orders(initiator_type);
CREATE INDEX idx_orders_acceptance_status ON orders(acceptance_status);
CREATE INDEX idx_orders_acceptance_deadline ON orders(acceptance_deadline);
```

### 2. Auto-Cancel Function (Optional)
```sql
-- File: supabase/migrations/20240201_auto_cancel_expired_orders.sql
CREATE OR REPLACE FUNCTION cancel_expired_orders()
RETURNS void AS $$
DECLARE
    expired_orders RECORD;
BEGIN
    -- Find all pharmacy-initiated orders that are still pending and past deadline
    FOR expired_orders IN 
        SELECT id, patient_id, pharmacy_id 
        FROM orders 
        WHERE initiator_type = 'pharmacy' 
        AND acceptance_status = 'pending' 
        AND acceptance_deadline < NOW()
    LOOP
        -- Update order status
        UPDATE orders 
        SET acceptance_status = 'rejected', 
            status = 'cancelled'
        WHERE id = expired_orders.id;
        
        -- Send notification message to patient
        INSERT INTO messages (sender_id, receiver_id, content, created_at)
        VALUES (
            expired_orders.pharmacy_id,
            expired_orders.patient_id,
            FORMAT('ORDER_EXPIRED\nORDER_ID:%s\nRESPONSE:Order expired due to no customer response\nSTATUS:Auto-cancelled', expired_orders.id),
            NOW()
        );
        
        -- Send notification message to pharmacy
        INSERT INTO messages (sender_id, receiver_id, content, created_at)
        VALUES (
            expired_orders.patient_id,
            expired_orders.pharmacy_id,
            FORMAT('ORDER_EXPIRED\nORDER_ID:%s\nRESPONSE:Order expired due to no customer response\nSTATUS:Auto-cancelled', expired_orders.id),
            NOW()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Step 2: How to Run Migrations

### Option A: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each SQL file content
4. Run them sequentially

### Option B: Supabase CLI (if installed)
```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

## Step 3: Enable Order Expiry Checker

After migrations are applied, uncomment the lines in `src/lib/orderExpiry.ts`:

```typescript
export function initExpiredOrderChecker() {
    // Uncomment these lines:
    checkAndCancelExpiredOrders();
    const interval = setInterval(checkAndCancelExpiredOrders, 30 * 60 * 1000);
    return () => clearInterval(interval);
}
```

## Step 4: Test the Feature

1. Start development server: `npm run dev`
2. Login as pharmacy
3. Visit `/pharmacy/create-order`
4. Create an order for a connected patient
5. Login as patient and check chat for order request
6. Test accept/reject workflow

## Troubleshooting

If you see "column does not exist" errors:
- Ensure database migrations have been applied
- Check table schema in Supabase dashboard
- Restart the development server after migrations