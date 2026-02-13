import { z } from "zod";
import { logger } from "./logger";

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role is required").optional(),

  // Optional Environment Variables
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Security Headers (optional)
  RATE_LIMIT_ENABLED: z.string().default("true").transform(val => val === "true"),

  // Logging (optional)
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),

  // Feature Flags (optional)
  ENABLE_ANALYTICS: z.string().default("false").transform(val => val === "true"),
  ENABLE_PERFORMANCE_MONITORING: z.string().default("false").transform(val => val === "true")
});

type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 */
export const env = (() => {
  try {
    const validated = envSchema.parse(process.env);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      logger.warn('env-validation', `Environment validation issue: ${errorMessage}`);
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-service-key',
        NODE_ENV: process.env.NODE_ENV || "development" as any,
        RATE_LIMIT_ENABLED: true,
        LOG_LEVEL: "info" as any,
        SENTRY_DSN: undefined,
        ENABLE_ANALYTICS: false,
        ENABLE_PERFORMANCE_MONITORING: false
      } as ValidatedEnv;
    }
    throw error;
  }
})();

/**
 * Type-safe environment variable access
 */
export function getEnvVar<T extends keyof ValidatedEnv>(key: T): ValidatedEnv[T] {
  return (env as ValidatedEnv)[key];
}

/**
 * Check if required environment variables are set
 */
export function validateRequiredEnvVars(): { valid: boolean; missing: string[] } {
  const isBrowser = typeof window !== 'undefined';
  const required = isBrowser
    ? ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    : ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

  const missing = required.filter(key => {
    const val = process.env[key];
    return !val || val.trim() === "";
  });

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Get environment-specific configuration
 */
export const config = {
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  supabase: {
    url: env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  security: {
    rateLimitEnabled: env.RATE_LIMIT_ENABLED
  },
  logging: {
    level: env.LOG_LEVEL
  },
  features: {
    analytics: env.ENABLE_ANALYTICS,
    performanceMonitoring: env.ENABLE_PERFORMANCE_MONITORING
  },
  monitoring: {
    sentryDsn: env.SENTRY_DSN
  }
} as const;