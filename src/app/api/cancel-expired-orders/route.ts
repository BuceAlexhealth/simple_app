import { NextResponse, NextRequest } from "next/server";
import { createServiceClient, requireAuth } from "@/lib/api-auth";
import { validateRequestBody, CancelExpiredOrdersSchema, defaultRateLimits } from "@/lib/api-validation";
import { applyRateLimit } from "@/lib/rate-limiting";

export async function POST(request: NextRequest) {
  // 1. Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, defaultRateLimits.sensitive);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // 2. Authenticate and authorize user (requires admin/system role)
  try {
    await requireAuth(request, ["admin", "system"]);
  } catch (error) {
    const errorData = JSON.parse((error as Error).message);
    return NextResponse.json(
      { error: errorData.error },
      { status: errorData.status }
    );
  }

  // 3. Validate request body
  let validatedData;
  try {
    const body = await request.json().catch(() => ({}));
    validatedData = validateRequestBody(CancelExpiredOrdersSchema, body);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }

  // 4. Use service client for privileged operations
  const supabase = createServiceClient();

  try {
    const { error: schemaError } = await supabase
      .from("orders")
      .select("initiator_type")
      .limit(1);

    if (schemaError && schemaError.message.includes('column "initiator_type" does not exist')) {
      console.log('Database schema not updated yet - skipping order expiry check');
      return NextResponse.json({ cancelled: 0 });
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

    if (!data || data.length === 0) {
      return NextResponse.json({ cancelled: 0 });
    }

    console.log(`Found ${data.length} expired orders to cancel`);

    if (validatedData.dryRun) {
      console.log(`Dry run: Found ${data.length} expired orders to cancel`);
      return NextResponse.json({ 
        cancelled: 0, 
        found: data.length,
        dryRun: true 
      });
    }

    for (const order of data) {
      try {
        console.log(`Cancelling expired order: ${order.id}`);

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

    return NextResponse.json({ cancelled: data?.length || 0 });

  } catch (error) {
    console.error('Error cancelling expired orders:', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({ 
      cancelled: 0, 
      error: 'Failed to process expired orders',
      requestId: crypto.randomUUID()
    }, { status: 500 });
  }
}