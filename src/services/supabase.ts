import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://ivudmzdabfehxlkwyuab.supabase.co';

// Environment variables or client-side storage for live Supabase testing
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY || '';

const STORAGE_KEY_URL = 'kinfinance_supabase_url';
const STORAGE_KEY_KEY = 'kinfinance_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'none';
}

export function getSupabaseConfig(): SupabaseConfig {
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null;

  if (ENV_SUPABASE_ANON_KEY) {
    return {
      url: ENV_SUPABASE_URL,
      anonKey: ENV_SUPABASE_ANON_KEY,
      isConfigured: true,
      source: 'env',
    };
  }

  if (storedKey) {
    return {
      url: storedUrl || DEFAULT_SUPABASE_URL,
      anonKey: storedKey,
      isConfigured: true,
      source: 'storage',
    };
  }

  return {
    url: storedUrl || DEFAULT_SUPABASE_URL,
    anonKey: '',
    isConfigured: false,
    source: 'none',
  };
}

export function cleanSupabaseInput(val: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  if (
    (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith('`') && cleaned.endsWith('`'))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

export function cleanSupabaseUrl(url: string): string {
  let cleaned = cleanSupabaseInput(url);
  if (!cleaned) return '';
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    const cleanedUrl = cleanSupabaseUrl(url);
    const cleanedKey = cleanSupabaseInput(anonKey);
    localStorage.setItem(STORAGE_KEY_URL, cleanedUrl);
    localStorage.setItem(STORAGE_KEY_KEY, cleanedKey);
    // Invalidate cached client
    cachedClient = null;
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    cachedClient = null;
  }
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  try {
    const cleanedUrl = cleanSupabaseUrl(config.url);
    const cleanedKey = cleanSupabaseInput(config.anonKey);
    cachedClient = createClient(cleanedUrl, cleanedKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Checks connection to the configured Supabase instance
 */
export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string }> {
  try {
    const rawUrl = url || getSupabaseConfig().url;
    const rawKey = anonKey || getSupabaseConfig().anonKey;

    const testUrl = cleanSupabaseUrl(rawUrl);
    const testKey = cleanSupabaseInput(rawKey);

    if (!testUrl || !testKey) {
      return { success: false, message: 'Supabase URL and API Key are required.' };
    }

    const testClient = createClient(testUrl, testKey);
    // Ping health or query categories
    const { error } = await testClient.from('categories').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is empty table or similar
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Successfully connected to Supabase PostgreSQL database!' };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('pattern') || err?.name === 'SyntaxError') {
      return {
        success: false,
        message: 'The URL or API key format did not match the expected pattern. Ensure the URL starts with https:// and the key is your full project JWT (anon or service_role).',
      };
    }
    return { success: false, message: msg || 'Connection failed' };
  }
}

/**
 * Checks server-side Supabase environment status
 */
export async function getServerSupabaseStatus(): Promise<{ configured: boolean; url: string; hasKey: boolean; source: string }> {
  try {
    const res = await fetch('/api/supabase/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Ignore error
  }
  return { configured: false, url: DEFAULT_SUPABASE_URL, hasKey: false, source: 'none' };
}

/**
 * Tests connection via the server using process.env.SUPABASE_KEY
 */
export async function testServerSupabaseConnection(key?: string, url?: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/supabase/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, url }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to reach server test endpoint' };
  }
}

/**
 * Complete SQL Migration for Supabase SQL Editor
 * Includes Bangladeshi Taka currency defaults, tables, RLS policies, and seed data.
 */
export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- KinFinance Family Vault: Supabase PostgreSQL Schema
-- Currency: Bangladeshi Taka (৳ BDT)
-- Optimized for Vercel Deployment & Supabase Backend
-- ========================================================

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'rejected');
CREATE TYPE tx_type AS ENUM ('expense', 'income');
CREATE TYPE tx_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'member',
  status user_status DEFAULT 'pending',
  relationship TEXT DEFAULT 'Member',
  avatar_url TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by TEXT
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type tx_type NOT NULL,
  icon TEXT DEFAULT 'Tag',
  color TEXT DEFAULT '#10b981',
  description TEXT,
  monthly_budget NUMERIC(14,2) DEFAULT 0, -- Stored in Bangladeshi Taka (৳ BDT)
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT DEFAULT 'member',
  title TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL, -- Stored in Bangladeshi Taka (৳ BDT)
  type tx_type NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE RESTRICT,
  category_name TEXT NOT NULL,
  category_color TEXT DEFAULT '#10b981',
  category_icon TEXT DEFAULT 'Tag',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  receipt_url TEXT,
  receipt_file_name TEXT,
  receipt_file_size INT,
  status tx_status DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Anonymous/Public access policies for custom auth or Supabase Auth:
CREATE POLICY "Allow read authenticated users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow insert new user registrations" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin update users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow admin manage categories" ON public.categories FOR ALL USING (true);

CREATE POLICY "Allow read transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Allow delete transactions" ON public.transactions FOR DELETE USING (true);

-- 6. Seed Categories with Bangladeshi Taka (৳ BDT) Budgets
INSERT INTO public.categories (id, name, type, icon, color, description, monthly_budget, is_system)
VALUES
  ('cat-util', 'Utility Bills', 'expense', 'Zap', '#f59e0b', 'Electricity (DESCO/DPDC), gas, water (WASA)', 12000, true),
  ('cat-internet', 'Internet & Broadband', 'expense', 'Wifi', '#3b82f6', 'Fiber broadband and mobile 4G/5G data packages', 2500, true),
  ('cat-family', 'Family & Home Costs', 'expense', 'Home', '#8b5cf6', 'Home maintenance, house rent, repairs, and furnishings', 35000, true),
  ('cat-groceries', 'Groceries & Bazar', 'expense', 'ShoppingBag', '#10b981', 'Kacha bazar, super shop shopping, pantry staples', 25000, true),
  ('cat-health', 'Healthcare & Pharmacy', 'expense', 'HeartPulse', '#ec4899', 'Doctor fees, hospital consultations, medicine prescriptions', 8000, true),
  ('cat-education', 'Education & Tuition', 'expense', 'GraduationCap', '#06b6d4', 'School fees, coaching, college semester, and books', 20000, true),
  ('cat-transport', 'Transportation & Fuel', 'expense', 'Car', '#64748b', 'Octane, CNG, Metro rail, Uber, and rickshaw fare', 10000, true),
  ('cat-income', 'Family Income & Pool', 'income', 'Wallet', '#059669', 'Monthly salaries, remittances, business pool contributions', 120000, true)
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Default Users
INSERT INTO public.users (id, username, password_hash, full_name, role, status, relationship, created_at, approved_at, approved_by)
VALUES
  ('usr-admin', 'admin', 'admin123', 'Arthur Pendelton', 'admin', 'active', 'Family Head', NOW(), NOW(), 'System Root'),
  ('usr-eleanor', 'eleanor', 'member123', 'Eleanor Pendelton', 'member', 'active', 'Spouse', NOW(), NOW(), 'Arthur Pendelton'),
  ('usr-lucas', 'lucas', 'member123', 'Lucas Pendelton', 'member', 'active', 'Son (College)', NOW(), NOW(), 'Arthur Pendelton'),
  ('usr-chloe', 'chloe', 'member123', 'Chloe Pendelton', 'member', 'pending', 'Daughter (High School)', NOW(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;
`;
