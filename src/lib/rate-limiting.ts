import { NextRequest, NextResponse } from "next/server";
import { RateLimitConfig } from "./api-validation";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory rate limit store (for production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * Note: For production, replace with Redis-based rate limiting
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimit(request: NextRequest): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  }> {
    const identifier = getRateLimitIdentifier(request);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up expired entries
    Object.keys(rateLimitStore).forEach(key => {
      if (rateLimitStore[key].resetTime <= now) {
        delete rateLimitStore[key];
      }
    });

    // Get or create rate limit entry
    let entry = rateLimitStore[identifier];
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      };
      rateLimitStore[identifier] = entry;
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    // Increment counter
    entry.count++;

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  };
}

/**
 * Generate identifier for rate limiting based on IP and user ID
 */
function getRateLimitIdentifier(request: NextRequest): string {
  // Try to get user ID from auth header (for authenticated requests)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // In a real implementation, you'd decode the JWT to get user ID
    // For now, we'll use a hash of the token
    return `user:${hashString(authHeader.substring(7))}`;
  }

  // Fall back to IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : 
             request.headers.get("x-real-ip") || 
             "unknown";
  
  return `ip:${hashString(ip)}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Middleware to apply rate limiting
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const rateLimiter = createRateLimiter(config);
  const result = await rateLimiter(request);

  // Set rate limit headers
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", new Date(result.resetTime).toISOString());

  if (!result.success) {
    return NextResponse.json(
      { 
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers
      }
    );
  }

  // Return headers to be added to successful response
  return new NextResponse(null, { headers });
}