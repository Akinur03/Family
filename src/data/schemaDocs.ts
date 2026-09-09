export const SUPABASE_SQL_SCHEMA = `-- =========================================================================
-- KinFinance - Family Expense & Financial Management Database Schema (PostgreSQL / Supabase)
-- Role-Based Access Control (RBAC), Approval Workflows, & Receipt Storage
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS FOR ROLES & STATUSES
CREATE TYPE user_role AS ENUM ('admin', 'member');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'rejected', 'suspended');
CREATE TYPE transaction_type AS ENUM ('expense', 'income');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. PROFILES TABLE (Extends auth.users or standalone auth)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL DEFAULT 'Family Member',
    role user_role NOT NULL DEFAULT 'member',
    status account_status NOT NULL DEFAULT 'pending',
    avatar_url TEXT,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TRANSACTION CATEGORIES TABLE
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(80) NOT NULL,
    type transaction_type NOT NULL DEFAULT 'expense',
    icon VARCHAR(40) NOT NULL DEFAULT 'ShoppingBag',
    color VARCHAR(20) NOT NULL DEFAULT '#10b981',
    description TEXT,
    monthly_budget NUMERIC(12, 2) DEFAULT 0.00,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TRANSACTIONS TABLE (With Receipt/Screenshot Proof fields)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type transaction_type NOT NULL DEFAULT 'expense',
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    
    -- Screenshot / Receipt Proof Fields
    receipt_url TEXT,
    receipt_filename VARCHAR(255),
    receipt_filesize INTEGER,
    receipt_mimetype VARCHAR(100),
    
    -- Approval Status & Audit Trail
    status approval_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AUDIT / APPROVAL LOGS TABLE
CREATE TABLE public.approval_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    reviewed_by UUID NOT NULL REFERENCES public.profiles(id),
    previous_status approval_status NOT NULL,
    new_status approval_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if auth user is Family Head (Admin)
CREATE OR REPLACE FUNCTION public.is_family_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles Policies:
-- Any active member can view family profile roster
CREATE POLICY "Active family members can view profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND status = 'active'));

-- Only Admins can update profile status (Approve / Reject new registrations)
CREATE POLICY "Admins can update user status and roles"
  ON public.profiles FOR UPDATE
  USING (public.is_family_admin());

-- Categories Policies:
-- All active members can read categories
CREATE POLICY "Active users can read categories"
  ON public.categories FOR SELECT
  USING (TRUE);

-- Active members or Admins can insert new categories
CREATE POLICY "Active users can create custom categories"
  ON public.categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND status = 'active'));

-- Transactions Policies:
-- Members can view their own transactions; Admins can view ALL family transactions
CREATE POLICY "Members view own transactions and Admins view all"
  ON public.transactions FOR SELECT
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR public.is_family_admin()
  );

-- Active members can insert pending transactions
CREATE POLICY "Active members can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND status = 'active')
    AND status = 'pending'
  );

-- Members can edit their own transactions ONLY when status is 'pending' or 'rejected'
CREATE POLICY "Members edit pending or rejected transactions"
  ON public.transactions FOR UPDATE
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND status IN ('pending', 'rejected')
  );

-- Admins can update any transaction (for Approvals, Rejections, and notes)
CREATE POLICY "Admins can review any transaction"
  ON public.transactions FOR UPDATE
  USING (public.is_family_admin());
`;

export const STORAGE_BUCKET_INSTRUCTIONS = `# =========================================================================
# Storage Bucket Setup Instructions: Transaction Screenshots & Receipts
# =========================================================================

## Option A: Supabase Storage Configuration

1. Create a Dedicated Bucket:
   Navigate to Supabase Dashboard -> Storage -> "New Bucket":
   - Name: 'transaction-receipts'
   - Public: false (Secured through Row Level Security or Signed URLs)
   - File Size Limit: 10MB
   - Allowed MIME Types: image/jpeg, image/png, image/webp, image/heic, application/pdf

2. Storage Bucket Security Policies (RLS SQL):
\`\`\`sql
-- Policy 1: Allow active authenticated family members to upload receipts
CREATE POLICY "Family members upload receipt proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'transaction-receipts'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Allow members to view their own uploaded receipts
CREATE POLICY "Users view own receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'transaction-receipts'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);
\`\`\`

3. Recommended Folder Hierarchy in Bucket:
   /transaction-receipts/
     ├── {user_id}/
     │     ├── {transaction_id}-{timestamp}.jpg
     │     └── {transaction_id}-{timestamp}.png

---

## Option B: Firebase Storage Configuration

1. Create Storage Rules in \`storage.rules\`:
\`\`\`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isActiveUser() {
      return request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.status == 'active';
    }
    
    function isAdmin() {
      return request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /receipts/{userId}/{fileName} {
      // Allow upload only if user matches path and is active
      allow create, update: if isActiveUser() && request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*|application/pdf');

      // Allow download if author or Family Admin
      allow read: if isActiveUser() && (request.auth.uid == userId || isAdmin());
      
      // Allow delete only if admin or author while pending
      allow delete: if isAdmin() || (isActiveUser() && request.auth.uid == userId);
    }
  }
}
\`\`\`
`;
