import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logStructuredError, ApiError } from "./error-handling";

/**
 * Base repository class for database operations
 */
export abstract class BaseRepository {
  protected supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Handle database errors consistently
   */
  protected handleError(error: any, operation: string, context: Record<string, any> = {}): never {
    const errorMessage = error?.message || 'Unknown database error';
    
    // Log structured error
    logStructuredError(error, {
      operation,
      table: this.getTableName(),
      ...context
    });

    // Convert to appropriate API error
    if (error?.code === 'PGRST116') {
      throw new ApiError('Resource not found', 404, 'NOT_FOUND', context);
    }
    
    if (error?.code?.startsWith('235')) {
      throw new ApiError('Invalid data provided', 400, 'VALIDATION_ERROR', context);
    }

    if (error?.code?.startsWith('28')) {
      throw new ApiError('Authentication required', 401, 'AUTH_ERROR', context);
    }

    if (error?.code?.startsWith('425')) {
      throw new ApiError('Insufficient permissions', 403, 'PERMISSION_ERROR', context);
    }

    throw new ApiError(`Database operation failed: ${errorMessage}`, 500, 'DB_ERROR', context);
  }

  /**
   * Get the table name for this repository
   */
  protected abstract getTableName(): string;
}

/**
 * Orders repository with business logic encapsulated
 */
export class OrdersRepository extends BaseRepository {
  protected getTableName(): string {
    return 'orders';
  }

  /**
   * Get expired pharmacy-initiated orders
   */
  async getExpiredPharmacyOrders() {
    try {
      const { data, error } = await this.supabase
        .from("orders")
        .select("id, patient_id, pharmacy_id")
        .eq("initiator_type", "pharmacy")
        .eq("acceptance_status", "pending")
        .lt("acceptance_deadline", new Date().toISOString());

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getExpiredPharmacyOrders');
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string, additionalData: Record<string, any> = {}) {
    try {
      const { data, error } = await this.supabase
        .from("orders")
        .update({
          status,
          ...additionalData
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'updateOrderStatus', { orderId, status });
    }
  }

  /**
   * Get orders for a specific user
   */
  async getOrdersByUserId(userId: string, filters: {
    initiatorType?: 'patient' | 'pharmacy';
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      let query = this.supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            inventory:inventory_id (
              name
            )
          )
        `)
        .eq("pharmacy_id", userId);

      if (filters.initiatorType) {
        query = query.eq("initiator_type", filters.initiatorType);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      query = query.order("created_at", { ascending: false });

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getOrdersByUserId', { userId, filters });
    }
  }

  /**
   * Create new order
   */
  async createOrder(orderData: any) {
    try {
      const { data, error } = await this.supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'createOrder', orderData);
    }
  }
}

/**
 * Messages repository
 */
export class MessagesRepository extends BaseRepository {
  protected getTableName(): string {
    return 'messages';
  }

  /**
   * Send message between users
   */
  async sendMessage(messageData: {
    sender_id: string;
    receiver_id: string;
    content: string;
    order_id?: string;
  }) {
    try {
      const { data, error } = await this.supabase
        .from("messages")
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'sendMessage', messageData);
    }
  }

  /**
   * Get messages for a user
   */
  async getMessagesForUser(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const { data, error } = await this.supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getMessagesForUser', { userId, limit, offset });
    }
  }

  /**
   * Update message content
   */
  async updateMessage(messageId: string, content: string) {
    try {
      const { data, error } = await this.supabase
        .from("messages")
        .update({ content })
        .eq("id", messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'updateMessage', { messageId, content });
    }
  }
}

/**
 * Repository factory
 */
export function createRepositories(supabase: SupabaseClient) {
  return {
    orders: new OrdersRepository(supabase),
    messages: new MessagesRepository(supabase)
  };
}