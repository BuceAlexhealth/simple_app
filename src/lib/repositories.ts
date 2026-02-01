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

  /**
   * Delete a record by ID
   */
  async delete(id: string) {
    try {
      const { error } = await this.supabase
        .from(this.getTableName())
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      this.handleError(error, 'delete', { id });
    }
  }
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
  async getOrdersByUserId(userId: string, userRole: 'patient' | 'pharmacist' | 'admin' = 'patient', filters: {
    initiatorType?: 'patient' | 'pharmacy';
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const idField = userRole === 'pharmacist' ? 'pharmacy_id' : 'patient_id';

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
        .eq(idField, userId);

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
      this.handleError(error, 'getOrdersByUserId', { userId, userRole, filters });
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
 * Inventory repository
 */
export class InventoryRepository extends BaseRepository {
  protected getTableName(): string {
    return 'inventory';
  }

  async getInventoryByPharmacyId(pharmacyId: string) {
    try {
      const { data, error } = await this.supabase
        .from("inventory")
        .select("*")
        .eq("pharmacy_id", pharmacyId)
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getInventoryByPharmacyId', { pharmacyId });
    }
  }

  async updateStock(itemId: string, newStock: number) {
    try {
      const { data, error } = await this.supabase
        .from("inventory")
        .update({ stock: newStock })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'updateStock', { itemId, newStock });
    }
  }

  async addItem(itemData: any) {
    try {
      const { data, error } = await this.supabase
        .from("inventory")
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'addItem', itemData);
    }
  }

  async updateItem(itemId: string, itemData: any) {
    try {
      const { data, error } = await this.supabase
        .from("inventory")
        .update(itemData)
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'updateItem', { itemId, itemData });
    }
  }

  async deleteItem(itemId: string) {
    return this.delete(itemId);
  }
}

/**
 * Connections repository
 */
export class ConnectionsRepository extends BaseRepository {
  protected getTableName(): string {
    return 'connections';
  }

  async getConnectedPatients(pharmacyId: string) {
    try {
      const { data, error } = await this.supabase
        .from("connections")
        .select(`
          patient_id,
          profiles:patient_id (
            id,
            full_name
          )
        `)
        .eq("pharmacy_id", pharmacyId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getConnectedPatients', { pharmacyId });
    }
  }

  async getConnectedPharmacies(patientId: string) {
    try {
      const { data, error } = await this.supabase
        .from("connections")
        .select("pharmacy_id, profiles:pharmacy_id(id, full_name)")
        .eq("patient_id", patientId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getConnectedPharmacies', { patientId });
    }
  }

  async createConnection(patientId: string, pharmacyId: string) {
    try {
      const { data, error } = await this.supabase
        .from("connections")
        .insert([{ patient_id: patientId, pharmacy_id: pharmacyId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'createConnection', { patientId, pharmacyId });
    }
  }

  async deleteConnection(patientId: string, pharmacyId: string) {
    try {
      const { error } = await this.supabase
        .from("connections")
        .delete()
        .eq("patient_id", patientId)
        .eq("pharmacy_id", pharmacyId);

      if (error) throw error;
      return true;
    } catch (error) {
      this.handleError(error, 'deleteConnection', { patientId, pharmacyId });
    }
  }
}

/**
 * Profiles repository
 */
export class ProfilesRepository extends BaseRepository {
  protected getTableName(): string {
    return 'profiles';
  }

  async getProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getProfile', { userId });
    }
  }

  async getProfilesByRole(roles: string[]) {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("role", roles);

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getProfilesByRole', { roles });
    }
  }

  async updateProfile(userId: string, profileData: any) {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .update(profileData)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'updateProfile', { userId, profileData });
    }
  }
}

/**
 * Repository factory
 */
export function createRepositories(supabase: SupabaseClient) {
  return {
    orders: new OrdersRepository(supabase),
    messages: new MessagesRepository(supabase),
    inventory: new InventoryRepository(supabase),
    connections: new ConnectionsRepository(supabase),
    profiles: new ProfilesRepository(supabase)
  };
}