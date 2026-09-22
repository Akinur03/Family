import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ivudmzdabfehxlkwyuab.supabase.co';
export const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function sanitizeEnvVal(val: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  if ((cleaned.startsWith("'") && cleaned.endsWith("'")) || (cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith('`') && cleaned.endsWith('`'))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const rawKey = SUPABASE_KEY;
  if (!rawKey) {
    return null;
  }
  if (!supabaseClient) {
    try {
      const cleanUrl = sanitizeEnvVal(SUPABASE_URL);
      const cleanKey = sanitizeEnvVal(rawKey);
      supabaseClient = createClient(cleanUrl, cleanKey);
    } catch (err) {
      console.error('Failed to initialize server-side Supabase client:', err);
      return null;
    }
  }
  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_KEY);
}
