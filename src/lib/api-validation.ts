import { z } from "zod";

/**
 * Validation schemas for API endpoints
 */



export const OrderStatusUpdateSchema = z.object({
  orderId: z.string().uuid("Invalid order ID format"),
  status: z.enum(["pending", "accepted", "rejected", "cancelled", "completed"]),
  notes: z.string().max(500).optional()
});

export const MessageCreateSchema = z.object({
  receiverId: z.string().uuid("Invalid receiver ID format"),
  content: z.string().min(1).max(2000, "Message must be between 1 and 2000 characters"),
  orderId: z.string().uuid().optional()
});

export const ProfileUpdateSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format").optional(),
  address: z.string().max(500).optional()
});

export const InventoryCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().min(1).max(100),
  price: z.number().positive("Price must be positive"),
  stockQuantity: z.number().int().min(0),
  reorderLevel: z.number().int().min(0).optional(),
  expiryDate: z.string().datetime().optional()
});

/**
 * Validation helper functions
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    throw new Error("Invalid request data");
  }
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const defaultRateLimits = {
  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },
  // Sensitive operations
  sensitive: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10
  },
  // Order operations
  orders: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50
  }
} as const;