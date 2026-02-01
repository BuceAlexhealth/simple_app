import { createBrowserClient } from '@supabase/ssr'
import { config } from './env-validation'

export const supabase = createBrowserClient(
    config.supabase.url,
    config.supabase.anonKey
)
