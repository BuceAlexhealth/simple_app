// Client-side order expiry checker - now calls server API instead of direct database access

export async function checkAndCancelExpiredOrders() {
    try {
        const response = await fetch('/api/cancel-expired-orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
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