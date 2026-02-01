import { supabase } from './supabase';

export async function checkAndCancelExpiredOrders() {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return { cancelled: 0 };
        }

        const response = await fetch('/api/cancel-expired-orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
        });

        if (!response.ok) {
            if (response.status === 401) return { cancelled: 0 };
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.cancelled > 0) {
            console.log(`Cancelled ${result.cancelled} expired orders via server API`);
        }

        return result;
    } catch (error) {
        console.error('Error in client-side order expiry check:', error);
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