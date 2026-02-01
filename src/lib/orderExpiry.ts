import { supabase } from './supabase';

export async function checkAndCancelExpiredOrders() {
    try {
        // First check if the new columns exist by doing a simple query
        const { error: schemaError } = await supabase
            .from("orders")
            .select("initiator_type")
            .limit(1);

        if (schemaError && schemaError.message.includes('column "initiator_type" does not exist')) {
            console.log('Database schema not updated yet - skipping order expiry check');
            return { cancelled: 0 };
        }

        const { data, error } = await supabase
            .from("orders")
            .select("id, patient_id, pharmacy_id")
            .eq("initiator_type", "pharmacy")
            .eq("acceptance_status", "pending")
            .lt("acceptance_deadline", new Date().toISOString());

        if (error) {
            console.error('Database error in order expiry check:', error);
            throw error;
        }

        // If no expired orders, return early
        if (!data || data.length === 0) {
            return { cancelled: 0 };
        }

        console.log(`Found ${data.length} expired orders to cancel`);

        // Cancel expired orders
        for (const order of data) {
            try {
                console.log(`Cancelling expired order: ${order.id}`);

                // Update order status
                const { error: updateError } = await supabase
                    .from("orders")
                    .update({
                        acceptance_status: 'rejected',
                        status: 'cancelled'
                    })
                    .eq("id", order.id);

                if (updateError) {
                    console.error(`Error updating order ${order.id}:`, updateError);
                    continue;
                }

                // Send notification to patient
                const { error: msgError1 } = await supabase
                    .from("messages")
                    .insert({
                        sender_id: order.pharmacy_id,
                        receiver_id: order.patient_id,
                        content: `ORDER_EXPIRED\nORDER_ID:${order.id}\nRESPONSE:Order expired due to no customer response\nSTATUS:Auto-cancelled`
                    });

                if (msgError1) {
                    console.error(`Error sending patient notification for order ${order.id}:`, msgError1);
                }

                // Send notification to pharmacy
                const { error: msgError2 } = await supabase
                    .from("messages")
                    .insert({
                        sender_id: order.patient_id,
                        receiver_id: order.pharmacy_id,
                        content: `ORDER_EXPIRED\nORDER_ID:${order.id}\nRESPONSE:Order expired due to no customer response\nSTATUS:Auto-cancelled`
                    });

                if (msgError2) {
                    console.error(`Error sending pharmacy notification for order ${order.id}:`, msgError2);
                }

            } catch (orderError) {
                console.error(`Error processing order ${order.id}:`, orderError);
            }
        }

        return { cancelled: data?.length || 0 };
    } catch (error) {
        console.error('Error cancelling expired orders:', error);
        return { cancelled: 0, error };
    }
}

// Function to run on page load or periodic check
export function initExpiredOrderChecker() {
    // Check once on init
    checkAndCancelExpiredOrders();
    // Then check every 30 minutes
    const interval = setInterval(checkAndCancelExpiredOrders, 30 * 60 * 1000);
    return () => clearInterval(interval);
}