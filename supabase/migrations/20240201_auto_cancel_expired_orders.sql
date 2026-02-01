-- Auto-cancel expired pharmacy orders
-- This function should be scheduled to run periodically (e.g., every hour)

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

-- Create a cron job to run this function every hour
-- Note: This requires Supabase to enable cron jobs or use Edge Functions
SELECT cron.schedule(
    'cancel-expired-orders',
    '0 * * * *',  -- Every hour at minute 0
    'SELECT cancel_expired_orders();'
);