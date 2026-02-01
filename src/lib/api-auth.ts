import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { config } from './env-validation';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

export interface ApiAuthResult {
  user: AuthenticatedUser | null;
  error?: { message: string; status: number };
}

/**
 * Creates a Supabase client with service role key for privileged server operations
 */
export function createServiceClient() {
  if (!config.supabase.url || !config.supabase.serviceKey) {
    throw new Error("Service role credentials are required for server operations");
  }
  return createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Creates a regular Supabase client for non-privileged operations
 */
export function createApiClient() {
  if (!config.supabase.url || !config.supabase.anonKey) {
    throw new Error("Supabase credentials are required");
  }
  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Validates JWT token and returns authenticated user info
 */
export async function authenticateApi(request: NextRequest): Promise<ApiAuthResult> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { 
        user: null, 
        error: { message: "Missing or invalid authorization header", status: 401 } 
      };
    }

    const token = authHeader.substring(7);

    // Create client and verify token
    const supabase = createServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { 
        user: null, 
        error: { message: "Invalid or expired token", status: 401 } 
      };
    }

    // Get user role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return {
      user: {
        id: user.id,
        email: user.email || "",
        role: profile?.role
      }
    };

  } catch (error) {
    console.error("Authentication error:", error);
    return { 
      user: null, 
      error: { message: "Authentication failed", status: 500 } 
    };
  }
}

/**
 * Checks if user has required role(s)
 */
export function authorizeRole(user: AuthenticatedUser, requiredRoles: string | string[]): boolean {
  if (!user.role) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(user.role);
}

/**
 * Comprehensive auth middleware for API routes
 */
export async function requireAuth(
  request: NextRequest, 
  requiredRoles?: string | string[]
): Promise<{ user: AuthenticatedUser } | never> {
  const authResult = await authenticateApi(request);

  if (authResult.error) {
    throw new Error(JSON.stringify({
      error: authResult.error.message,
      status: authResult.error.status
    }));
  }

  if (requiredRoles && !authorizeRole(authResult.user!, requiredRoles)) {
    throw new Error(JSON.stringify({
      error: "Insufficient permissions",
      status: 403
    }));
  }

  return { user: authResult.user! };
}