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

  /**
   * Process pharmacy order atomically using RPC
   */
  async processPharmacyOrder(orderData: {
    pharmacy_id: string;
    patient_id: string;
    items: {
      inventory_id: string;
      quantity: number;
      price: number;
    }[];
    total_price: number;
    notes?: string;
  }) {
    try {
      const { data, error } = await this.supabase
        .rpc('process_pharmacy_order', {
          p_pharmacy_id: orderData.pharmacy_id,
          p_patient_id: orderData.patient_id,
          p_items: orderData.items,
          p_total_price: orderData.total_price,
          p_notes: orderData.notes
        });

      if (error) throw error;
      return data; // Returns order_id
    } catch (error) {
      this.handleError(error, 'processPharmacyOrder', orderData);
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

export type BatchMovementType = 'IN' | 'OUT' | 'ADJUST' | 'EXPIRED' | 'RETURN';

interface ConsumeResult {
  batch_id: string;
  batch_code: string;
  quantity: number;
}

export class BatchesRepository extends BaseRepository {
  protected getTableName(): string {
    return 'batches';
  }

  async getBatchesByInventoryId(inventoryId: string) {
    try {
      const { data, error } = await this.supabase
        .from("batches")
        .select("*")
        .eq("inventory_id", inventoryId)
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getBatchesByInventoryId', { inventoryId });
    }
  }

  async getBatchesByInventoryIdWithTotal(inventoryId: string) {
    try {
      const { data, error } = await this.supabase
        .from("batches")
        .select("*")
        .eq("inventory_id", inventoryId)
        .order("expiry_date", { ascending: true });

      if (error) throw error;

      const batches = data || [];
      const totalRemaining = batches.reduce((sum, b) => sum + b.remaining_qty, 0);

      return { batches, totalRemaining };
    } catch (error) {
      this.handleError(error, 'getBatchesByInventoryIdWithTotal', { inventoryId });
    }
  }

  async getValidBatchesForFEFO(inventoryId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .from("batches")
        .select("*")
        .eq("inventory_id", inventoryId)
        .gt("remaining_qty", 0)
        .gte("expiry_date", today)
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getValidBatchesForFEFO', { inventoryId });
    }
  }

  async getExpiredBatches(pharmacyId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase
        .from("batches")
        .select(`
          *,
          inventory:inventory_id(name, brand_name)
        `)
        .eq("pharmacy_id", pharmacyId)
        .lt("expiry_date", today)
        .gt("remaining_qty", 0)
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getExpiredBatches', { pharmacyId });
    }
  }

  async addBatch(batchData: {
    inventory_id: string;
    pharmacy_id: string;
    batch_code: string;
    manufacturing_date: string;
    expiry_date: string;
    quantity: number;
    created_by?: string;
  }) {
    try {
      const { data: batch, error } = await this.supabase
        .from("batches")
        .insert({
          inventory_id: batchData.inventory_id,
          pharmacy_id: batchData.pharmacy_id,
          batch_code: batchData.batch_code,
          manufacturing_date: batchData.manufacturing_date,
          expiry_date: batchData.expiry_date,
          quantity: batchData.quantity,
          remaining_qty: batchData.quantity,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error(`Batch code "${batchData.batch_code}" already exists for this product`);
        }
        throw error;
      }

      await this.logMovement(batch.id, 'IN', batchData.quantity, undefined, batchData.created_by);

      return batch;
    } catch (error: any) {
      this.handleError(error, 'addBatch', batchData);
    }
  }

  async addStockToBatch(batchId: string, quantity: number, userId?: string) {
    try {
      const { data: current, error: fetchError } = await this.supabase
        .from("batches")
        .select("remaining_qty, quantity")
        .eq("id", batchId)
        .single();

      if (fetchError) throw fetchError;

      const newRemaining = current.remaining_qty + quantity;
      const newTotal = current.quantity + quantity;

      const { data, error } = await this.supabase
        .from("batches")
        .update({
          remaining_qty: newRemaining,
          quantity: newTotal,
        })
        .eq("id", batchId)
        .select()
        .single();

      if (error) throw error;

      await this.logMovement(batchId, 'IN', quantity, userId);

      return data;
    } catch (error) {
      this.handleError(error, 'addStockToBatch', { batchId, quantity });
    }
  }

  async updateBatch(batchId: string, batchData: Partial<{
    batch_code: string;
    manufacturing_date: string;
    expiry_date: string;
    quantity: number;
  }>) {
    try {
      const { data, error } = await this.supabase
        .from("batches")
        .update(batchData)
        .eq("id", batchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'updateBatch', { batchId, batchData });
    }
  }

  async deleteBatch(batchId: string) {
    try {
      const { error } = await this.supabase
        .from("batches")
        .delete()
        .eq("id", batchId);

      if (error) throw error;
      return true;
    } catch (error) {
      this.handleError(error, 'deleteBatch', { batchId });
    }
  }

  async consumeBatches(
    inventoryId: string,
    quantityNeeded: number,
    orderId?: string,
    userId?: string
  ): Promise<ConsumeResult[]> {
    const validBatches = await this.getValidBatchesForFEFO(inventoryId);

    if (validBatches.length === 0) {
      throw new Error("No valid batches available. All stock may be expired or depleted.");
    }

    const totalAvailable = validBatches.reduce((sum, b) => sum + b.remaining_qty, 0);
    if (totalAvailable < quantityNeeded) {
      throw new Error(`Insufficient stock. Need ${quantityNeeded}, only ${totalAvailable} available.`);
    }

    const consumed: ConsumeResult[] = [];
    let remaining = quantityNeeded;

    for (const batch of validBatches) {
      if (remaining <= 0) break;

      const take = Math.min(batch.remaining_qty, remaining);

      await this.updateBatchQuantity(batch.id, batch.remaining_qty - take);
      await this.logMovement(batch.id, 'OUT', take, orderId, userId);

      consumed.push({
        batch_id: batch.id,
        batch_code: batch.batch_code,
        quantity: take,
      });

      remaining -= take;
    }

    return consumed;
  }

  async updateBatchQuantity(batchId: string, newQuantity: number) {
    try {
      const { data, error } = await this.supabase
        .from("batches")
        .update({ remaining_qty: newQuantity })
        .eq("id", batchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'updateBatchQuantity', { batchId, newQuantity });
    }
  }

  async logMovement(
    batchId: string,
    movementType: BatchMovementType,
    quantity: number,
    referenceId?: string,
    userId?: string,
    notes?: string
  ) {
    try {
      const { data, error } = await this.supabase
        .from("batch_movements")
        .insert({
          batch_id: batchId,
          movement_type: movementType,
          quantity,
          reference_id: referenceId,
          notes,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to log batch movement:", error);
    }
  }

  async getBatchMovements(batchId: string) {
    try {
      const { data, error } = await this.supabase
        .from("batch_movements")
        .select("*")
        .eq("batch_id", batchId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      this.handleError(error, 'getBatchMovements', { batchId });
    }
  }

  async getBatchById(batchId: string) {
    try {
      const { data, error } = await this.supabase
        .from("batches")
        .select(`
          *,
          inventory:inventory_id(name, brand_name, form, price)
        `)
        .eq("id", batchId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.handleError(error, 'getBatchById', { batchId });
    }
  }

  isExpired(expiryDate: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    return expiry < today;
  }

  isExpiringSoon(expiryDate: string, daysThreshold: number = 30): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    const threshold = new Date(today);
    threshold.setDate(threshold.getDate() + daysThreshold);
    return expiry <= threshold && expiry >= today;
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
    profiles: new ProfilesRepository(supabase),
    batches: new BatchesRepository(supabase),
  };
}