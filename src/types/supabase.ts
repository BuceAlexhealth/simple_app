// Generic types for Supabase responses to replace 'any' usage

export interface SupabaseResponse<T> {
  data: T[] | null;
  error: { 
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
}

export interface SupabaseSingleResponse<T> {
  data: T | null;
  error: { 
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
}

export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export type DatabaseResponse<T> = {
  data: T[] | null;
  error: SupabaseError | null;
}

export type DatabaseSingleResponse<T> = {
  data: T | null;
  error: SupabaseError | null;
}