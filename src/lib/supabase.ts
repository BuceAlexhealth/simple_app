import { createBrowserClient } from '@supabase/ssr'
import { config } from './env-validation'

if (!config.supabase.url || !config.supabase.anonKey) {
    console.error("❌ Supabase configuration is missing. Please check your environment variables.");
}

export const supabase = createBrowserClient(
    config.supabase.url || 'http://localhost:54321', // Fallback to avoid crash if config is empty
    config.supabase.anonKey || 'dummy-key'
)
