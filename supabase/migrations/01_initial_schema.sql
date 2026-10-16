-- ==============================================================================
-- 🚀 TataDana — Comprehensive PostgreSQL / Supabase Database Schema
-- File: supabase/migrations/01_initial_schema.sql
-- Description: Full idempotent database schema for TataDana SaaS FinTech Indonesia.
-- Order of DDL execution (Strict dependency order):
--   1. Extensions (uuid-ossp, pgcrypto)
--   2. Core Tables (profiles, wallets, categories, transactions,
--      transaction_receipt_items, budgets, telegram_connections,
--      ai_provider_configs, ai_logs, subscription_plans, audit_logs,
--      payment_transactions) with CHECK constraints
--   3. Performance & Lookup Indexes
--   4. Functions (update_updated_at_column, is_admin, is_approved_user,
--      synchronizers, handle_new_user, update_wallet_balance_on_tx,
--      administrative utility functions)
--   5. Triggers (updated_at refresher, field synchronizers, privilege protection,
--      auth signup handler, wallet balance reconciler)
--   6. Row Level Security (RLS) Enable & Policies
--   7. Supabase Storage Bucket ('receipts') and Storage RLS Policies
--   8. Complete Seed Data (Categories, Subscription Plans, AI Providers, Admin)
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE TABLES DEFINITIONS (IDEMPOTENT WITH CHECK CONSTRAINTS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table 1: PROFILES (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    phone_number TEXT,
    phone TEXT, -- Compatibility alias for phone_number
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro')),
    subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'expired')),
    subscription_expires_at TIMESTAMPTZ,
    currency TEXT NOT NULL DEFAULT 'IDR',
    daily_reminder_time TEXT NOT NULL DEFAULT '20:00',
    daily_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    budget_alert_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Table 2: WALLETS (Multi-Wallet: BCA, Mandiri, GoPay, Cash Dompet, etc.)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'ewallet', 'cash', 'investment', 'crypto')),
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    account_number TEXT,
    color TEXT NOT NULL DEFAULT '#FF6B00',
    icon TEXT NOT NULL DEFAULT 'wallet',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Table 3: CATEGORIES (System Presets & User Custom Categories)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for system categories
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    icon TEXT NOT NULL DEFAULT 'tag',
    color TEXT NOT NULL DEFAULT '#FF6B00',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Table 4: TRANSACTIONS (Mutasi Finansial: Manual, Bot Slang, OCR Struk, Audio VN)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    destination_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    fee DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (fee >= 0),
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    description TEXT NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'telegram_text', 'telegram_receipt', 'telegram_voice', 'api')),
    raw_receipt_url TEXT,
    receipt_image_url TEXT, -- Compatibility alias for raw_receipt_url
    notes TEXT,
    raw_input TEXT,
    ai_parsed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Table 5: TRANSACTION RECEIPT ITEMS (Multi-item breakdown from OCR Struk)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transaction_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00 CHECK (quantity >= 0),
    price_per_unit DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (price_per_unit >= 0),
    unit_price DECIMAL(15, 2) DEFAULT 0.00, -- Compatibility alias
    total_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (total_price >= 0),
    subtotal DECIMAL(15, 2) DEFAULT 0.00,   -- Compatibility alias
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Table 6: BUDGETS (Monthly Category Limits with Threshold Alerts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    month VARCHAR(7) NOT NULL CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$'), -- Format YYYY-MM
    year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE), -- Compatibility alias for frontend
    alert_threshold_percentage INTEGER NOT NULL DEFAULT 80 CHECK (alert_threshold_percentage BETWEEN 1 AND 100),
    alert_threshold INTEGER DEFAULT 80, -- Compatibility alias for UI
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_budgets_user_cat_month UNIQUE (user_id, category_id, month)
);

-- ------------------------------------------------------------------------------
-- Table 7: TELEGRAM CONNECTIONS (Deep-Link, Chat ID, Bot Verification)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    telegram_user_id BIGINT UNIQUE,
    telegram_chat_id BIGINT UNIQUE, -- Compatibility alias
    telegram_username TEXT,
    verification_code TEXT,
    otp_code TEXT,                  -- Compatibility alias
    otp_expires_at TIMESTAMPTZ,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    first_name TEXT,
    last_name TEXT,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_interaction_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Table 8: AI PROVIDER CONFIGS (Gemini, OpenAI, DeepSeek Cluster Management)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE CHECK (provider_name IN ('gemini', 'openai', 'deepseek')),
    model_id TEXT NOT NULL,
    model_name TEXT,                  -- Compatibility alias
    api_key_encrypted TEXT,
    api_key_masked TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1),
    priority_order INTEGER DEFAULT 1, -- Compatibility alias
    is_failover BOOLEAN NOT NULL DEFAULT TRUE,
    total_tokens_used BIGINT NOT NULL DEFAULT 0 CHECK (total_tokens_used >= 0),
    tokens_used_this_month BIGINT NOT NULL DEFAULT 0 CHECK (tokens_used_this_month >= 0),
    monthly_token_limit BIGINT NOT NULL DEFAULT 10000000 CHECK (monthly_token_limit >= 0),
    cost_estimate DECIMAL(15, 4) NOT NULL DEFAULT 0.0000 CHECK (cost_estimate >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Table 9: AI LOGS (Telemetry, Multimodal Parsing, Latency & Failover Audit)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model_id TEXT,
    model TEXT,
    input_type TEXT DEFAULT 'text' CHECK (input_type IN ('text', 'vision_receipt', 'voice_audio')),
    prompt_tokens INTEGER NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
    completion_tokens INTEGER NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
    token_count INTEGER NOT NULL DEFAULT 0 CHECK (token_count >= 0),
    latency_ms INTEGER NOT NULL DEFAULT 0 CHECK (latency_ms >= 0),
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'failover_recovered', 'failed')),
    input_preview TEXT,
    prompt_summary TEXT, -- Compatibility alias
    extracted_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Table 10: SUBSCRIPTION PLANS (Starter, Pro Lifetime, Free Tiers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE CHECK (slug IN ('starter', 'pro', 'free')),
    code TEXT UNIQUE, -- Compatibility alias
    price DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('free', 'monthly', 'lifetime')),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Table 11: AUDIT LOGS (Security, Approval Trail & Administrative Actions)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Compatibility alias
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    actor_type TEXT NOT NULL DEFAULT 'admin' CHECK (actor_type IN ('user', 'admin', 'system')),
    target_resource TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Table 12: PAYMENT TRANSACTIONS (Midtrans QRIS / Snap & Manual Bank Transfer)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    plan_code TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('midtrans_qris', 'midtrans_snap', 'manual_transfer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settlement', 'challenge', 'deny', 'expire', 'cancelled', 'approved', 'rejected')),
    midtrans_transaction_id TEXT,
    manual_receipt_url TEXT,
    bank_name TEXT,
    account_sender_name TEXT,
    admin_notes TEXT,
    user_email TEXT, -- Compatibility alias for client receipts
    user_name TEXT,  -- Compatibility alias
    user_phone TEXT, -- Compatibility alias
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. PERFORMANCE & LOOKUP INDEXES
-- ==============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_system_unique ON public.categories (name, type) WHERE is_system = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles (role, approval_status);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions (wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_dest_wallet ON public.transactions (destination_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_tx_id ON public.transaction_receipt_items (transaction_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets (user_id, month);
CREATE INDEX IF NOT EXISTS idx_telegram_connections_user_id ON public.telegram_connections (user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_connections_chat_id ON public.telegram_connections (telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON public.ai_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON public.ai_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions (order_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ==============================================================================
-- 4. FUNCTIONS (SECURITY, AUTOMATION, SYNCHRONIZERS, UTILITY)
-- ==============================================================================

-- A. Timestamp Refresher
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- B. Superadmin Checker
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN := FALSE;
BEGIN
  -- 1. Check service_role / internal DB superuser / postgres admin role
  IF COALESCE(auth.jwt() ->> 'role', '') = 'service_role' 
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN TRUE;
  END IF;

  -- 2. Fast check: if not authenticated, return false immediately
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. Fast check: JWT email claim for superadmin
  IF LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'sinta.salsabila@tatadana.id' THEN
    RETURN TRUE;
  END IF;

  -- 4. Check profiles table with SECURITY DEFINER
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND (
        is_admin = TRUE 
        OR role = 'admin' 
        OR LOWER(email) = 'sinta.salsabila@tatadana.id'
      )
  ) INTO v_exists;

  RETURN v_exists;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- C. Approved User Checker
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN := FALSE;
BEGIN
  -- 1. Check service_role / internal DB superuser / postgres admin role
  IF COALESCE(auth.jwt() ->> 'role', '') = 'service_role' 
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN TRUE;
  END IF;

  -- 2. If not authenticated, return false
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 3. Superadmin is always approved
  IF LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'sinta.salsabila@tatadana.id' THEN
    RETURN TRUE;
  END IF;

  -- 4. Check profiles approval_status
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND (
        approval_status = 'approved' 
        OR is_admin = TRUE 
        OR role = 'admin' 
        OR LOWER(email) = 'sinta.salsabila@tatadana.id'
      )
  ) INTO v_exists;

  RETURN v_exists;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- D. Profile Synchronizers & Protection
CREATE OR REPLACE FUNCTION public.sync_profile_phone()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.phone_number IS NOT NULL AND NEW.phone IS NULL THEN
      NEW.phone := NEW.phone_number;
    ELSIF NEW.phone IS NOT NULL AND NEW.phone_number IS NULL THEN
      NEW.phone_number := NEW.phone;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.phone_number IS DISTINCT FROM OLD.phone_number THEN
      NEW.phone := NEW.phone_number;
    ELSIF NEW.phone IS DISTINCT FROM OLD.phone THEN
      NEW.phone_number := NEW.phone;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service_role or unauthenticated direct SQL migrations / postgres superuser
  IF auth.uid() IS NULL 
     OR COALESCE(auth.jwt() ->> 'role', '') = 'service_role' 
     OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- If not superadmin, prevent modifying security fields
  IF NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
    NEW.role := OLD.role;
    NEW.approval_status := OLD.approval_status;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- E. Transaction Field Synchronizers
CREATE OR REPLACE FUNCTION public.sync_transaction_receipt_url()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.raw_receipt_url IS NOT NULL AND NEW.receipt_image_url IS NULL THEN
      NEW.receipt_image_url := NEW.raw_receipt_url;
    ELSIF NEW.receipt_image_url IS NOT NULL AND NEW.raw_receipt_url IS NULL THEN
      NEW.raw_receipt_url := NEW.receipt_image_url;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.raw_receipt_url IS DISTINCT FROM OLD.raw_receipt_url THEN
      NEW.receipt_image_url := NEW.raw_receipt_url;
    ELSIF NEW.receipt_image_url IS DISTINCT FROM OLD.receipt_image_url THEN
      NEW.raw_receipt_url := NEW.receipt_image_url;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- F. Transaction Receipt Items Synchronizers
CREATE OR REPLACE FUNCTION public.sync_receipt_items_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF (NEW.price_per_unit IS NULL OR NEW.price_per_unit = 0) AND COALESCE(NEW.unit_price, 0) > 0 THEN
      NEW.price_per_unit := NEW.unit_price;
    END IF;
    NEW.unit_price := COALESCE(NEW.price_per_unit, 0.00);

    IF (NEW.total_price IS NULL OR NEW.total_price = 0) AND COALESCE(NEW.subtotal, 0) > 0 THEN
      NEW.total_price := NEW.subtotal;
    ELSIF NEW.total_price IS NULL OR NEW.total_price = 0 THEN
      NEW.total_price := COALESCE(NEW.price_per_unit, 0.00) * COALESCE(NEW.quantity, 1.00);
    END IF;
    NEW.subtotal := NEW.total_price;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.unit_price IS DISTINCT FROM OLD.unit_price THEN
      NEW.price_per_unit := COALESCE(NEW.unit_price, 0.00);
    ELSIF NEW.price_per_unit IS DISTINCT FROM OLD.price_per_unit THEN
      NEW.unit_price := NEW.price_per_unit;
    END IF;

    IF NEW.subtotal IS DISTINCT FROM OLD.subtotal THEN
      NEW.total_price := COALESCE(NEW.subtotal, 0.00);
    ELSIF NEW.total_price IS DISTINCT FROM OLD.total_price THEN
      NEW.subtotal := NEW.total_price;
    ELSIF (NEW.quantity IS DISTINCT FROM OLD.quantity OR NEW.price_per_unit IS DISTINCT FROM OLD.price_per_unit) THEN
      NEW.total_price := COALESCE(NEW.price_per_unit, 0.00) * COALESCE(NEW.quantity, 1.00);
      NEW.subtotal := NEW.total_price;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- G. Budgets Field Synchronizer
CREATE OR REPLACE FUNCTION public.sync_budget_threshold()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize month string if provided as single/double digit (e.g. '10' -> 'YYYY-10')
  IF NEW.year IS NOT NULL AND NEW.month ~ '^\d{1,2}$' THEN
    NEW.month := NEW.year::text || '-' || LPAD(NEW.month, 2, '0');
  ELSIF NEW.month ~ '^\d{1,2}$' THEN
    NEW.month := TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(NEW.month, 2, '0');
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.alert_threshold IS NOT NULL AND (NEW.alert_threshold_percentage IS NULL OR NEW.alert_threshold_percentage = 80) THEN
      NEW.alert_threshold_percentage := NEW.alert_threshold;
    END IF;
    NEW.alert_threshold := NEW.alert_threshold_percentage;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.alert_threshold IS DISTINCT FROM OLD.alert_threshold THEN
      NEW.alert_threshold_percentage := NEW.alert_threshold;
    ELSIF NEW.alert_threshold_percentage IS DISTINCT FROM OLD.alert_threshold_percentage THEN
      NEW.alert_threshold := NEW.alert_threshold_percentage;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- H. Telegram Connections Synchronizer
CREATE OR REPLACE FUNCTION public.sync_telegram_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.telegram_user_id IS NOT NULL AND NEW.telegram_chat_id IS NULL THEN
      NEW.telegram_chat_id := NEW.telegram_user_id;
    ELSIF NEW.telegram_chat_id IS NOT NULL AND NEW.telegram_user_id IS NULL THEN
      NEW.telegram_user_id := NEW.telegram_chat_id;
    END IF;

    IF NEW.verification_code IS NOT NULL AND NEW.otp_code IS NULL THEN
      NEW.otp_code := NEW.verification_code;
    ELSIF NEW.otp_code IS NOT NULL AND NEW.verification_code IS NULL THEN
      NEW.verification_code := NEW.otp_code;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.telegram_user_id IS DISTINCT FROM OLD.telegram_user_id THEN
      NEW.telegram_chat_id := NEW.telegram_user_id;
    ELSIF NEW.telegram_chat_id IS DISTINCT FROM OLD.telegram_chat_id THEN
      NEW.telegram_user_id := NEW.telegram_chat_id;
    END IF;

    IF NEW.verification_code IS DISTINCT FROM OLD.verification_code THEN
      NEW.otp_code := NEW.verification_code;
    ELSIF NEW.otp_code IS DISTINCT FROM OLD.otp_code THEN
      NEW.verification_code := NEW.otp_code;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- I. AI Provider Configs Synchronizer
CREATE OR REPLACE FUNCTION public.sync_ai_provider_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.model_id IS NOT NULL AND NEW.model_name IS NULL THEN
      NEW.model_name := NEW.model_id;
    ELSIF NEW.model_name IS NOT NULL AND NEW.model_id IS NULL THEN
      NEW.model_id := NEW.model_name;
    END IF;

    IF NEW.priority IS NOT NULL AND NEW.priority_order IS NULL THEN
      NEW.priority_order := NEW.priority;
    ELSIF NEW.priority_order IS NOT NULL AND (NEW.priority IS NULL OR NEW.priority = 1) THEN
      NEW.priority := NEW.priority_order;
    END IF;
    NEW.priority_order := NEW.priority;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.model_id IS DISTINCT FROM OLD.model_id THEN
      NEW.model_name := NEW.model_id;
    ELSIF NEW.model_name IS DISTINCT FROM OLD.model_name THEN
      NEW.model_id := NEW.model_name;
    END IF;

    IF NEW.priority_order IS DISTINCT FROM OLD.priority_order THEN
      NEW.priority := NEW.priority_order;
    ELSIF NEW.priority IS DISTINCT FROM OLD.priority THEN
      NEW.priority_order := NEW.priority;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- J. AI Logs Synchronizer
CREATE OR REPLACE FUNCTION public.sync_ai_log_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.token_count = 0 AND (NEW.prompt_tokens > 0 OR NEW.completion_tokens > 0) THEN
      NEW.token_count := NEW.prompt_tokens + NEW.completion_tokens;
    END IF;

    IF NEW.input_preview IS NOT NULL AND NEW.prompt_summary IS NULL THEN
      NEW.prompt_summary := NEW.input_preview;
    ELSIF NEW.prompt_summary IS NOT NULL AND NEW.input_preview IS NULL THEN
      NEW.input_preview := NEW.prompt_summary;
    END IF;

    IF NEW.model_id IS NOT NULL AND NEW.model IS NULL THEN
      NEW.model := NEW.model_id;
    ELSIF NEW.model IS NOT NULL AND NEW.model_id IS NULL THEN
      NEW.model_id := NEW.model;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.prompt_tokens IS DISTINCT FROM OLD.prompt_tokens OR NEW.completion_tokens IS DISTINCT FROM OLD.completion_tokens THEN
      NEW.token_count := NEW.prompt_tokens + NEW.completion_tokens;
    END IF;

    IF NEW.input_preview IS DISTINCT FROM OLD.input_preview THEN
      NEW.prompt_summary := NEW.input_preview;
    ELSIF NEW.prompt_summary IS DISTINCT FROM OLD.prompt_summary THEN
      NEW.input_preview := NEW.prompt_summary;
    END IF;

    IF NEW.model_id IS DISTINCT FROM OLD.model_id THEN
      NEW.model := NEW.model_id;
    ELSIF NEW.model IS DISTINCT FROM OLD.model THEN
      NEW.model_id := NEW.model;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- K. User Signup Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_is_admin BOOLEAN := FALSE;
  v_role TEXT := 'user';
  v_approval_status TEXT := 'pending';
  v_approved_at TIMESTAMPTZ := NULL;
  v_tier TEXT := 'free';
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  v_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', NEW.id::text || '@tatadana.id');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(v_email, '@', 1));
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone');

  -- Business Rule: Single Admin Sinta Salsabila is auto-approved superadmin with Pro Tier
  IF LOWER(v_email) = 'sinta.salsabila@tatadana.id' THEN
    v_is_admin := TRUE;
    v_role := 'admin';
    v_approval_status := 'approved';
    v_approved_at := NOW();
    v_tier := 'pro';
    IF v_full_name IS NULL OR v_full_name = '' OR v_full_name = 'sinta.salsabila' THEN
      v_full_name := 'Sinta Salsabila';
    END IF;
  END IF;

  -- 1. Insert Profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    phone_number,
    phone,
    is_admin,
    role,
    approval_status,
    approved_at,
    subscription_tier,
    subscription_status
  )
  VALUES (
    NEW.id,
    v_email,
    v_full_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    v_phone,
    v_phone,
    v_is_admin,
    v_role,
    v_approval_status,
    v_approved_at,
    v_tier,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    is_admin = CASE WHEN LOWER(EXCLUDED.email) = 'sinta.salsabila@tatadana.id' THEN TRUE ELSE profiles.is_admin END,
    role = CASE WHEN LOWER(EXCLUDED.email) = 'sinta.salsabila@tatadana.id' THEN 'admin' ELSE profiles.role END,
    approval_status = CASE WHEN LOWER(EXCLUDED.email) = 'sinta.salsabila@tatadana.id' THEN 'approved' ELSE profiles.approval_status END,
    updated_at = NOW();

  -- 2. Create 3 default wallets starting with balance Rp 0.00 (if user has none yet)
  IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE user_id = NEW.id) THEN
    INSERT INTO public.wallets (user_id, name, type, balance, color, icon, is_default, is_active)
    VALUES 
      (NEW.id, 'Cash Dompet', 'cash', 0.00, '#10B981', 'banknote', TRUE, TRUE),
      (NEW.id, 'BCA Tabungan', 'bank', 0.00, '#00529C', 'building-2', FALSE, TRUE),
      (NEW.id, 'GoPay', 'ewallet', 0.00, '#00AED6', 'smartphone', FALSE, TRUE);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- L. Wallet Balance Reconciler
CREATE OR REPLACE FUNCTION public.update_wallet_balance_on_tx()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Revert OLD transaction effect when UPDATING or DELETING
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.type = 'expense' AND OLD.wallet_id IS NOT NULL THEN
      UPDATE public.wallets 
      SET balance = balance + OLD.amount, updated_at = NOW() 
      WHERE id = OLD.wallet_id;
    ELSIF OLD.type = 'income' AND OLD.wallet_id IS NOT NULL THEN
      UPDATE public.wallets 
      SET balance = balance - OLD.amount, updated_at = NOW() 
      WHERE id = OLD.wallet_id;
    ELSIF OLD.type = 'transfer' THEN
      IF OLD.wallet_id IS NOT NULL THEN
        UPDATE public.wallets 
        SET balance = balance + (OLD.amount + COALESCE(OLD.fee, 0.00)), updated_at = NOW() 
        WHERE id = OLD.wallet_id;
      END IF;
      IF OLD.destination_wallet_id IS NOT NULL THEN
        UPDATE public.wallets 
        SET balance = balance - OLD.amount, updated_at = NOW() 
        WHERE id = OLD.destination_wallet_id;
      END IF;
    END IF;
  END IF;

  -- 2. Apply NEW transaction effect when INSERTING or UPDATING
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.type = 'expense' AND NEW.wallet_id IS NOT NULL THEN
      UPDATE public.wallets 
      SET balance = balance - NEW.amount, updated_at = NOW() 
      WHERE id = NEW.wallet_id;
    ELSIF NEW.type = 'income' AND NEW.wallet_id IS NOT NULL THEN
      UPDATE public.wallets 
      SET balance = balance + NEW.amount, updated_at = NOW() 
      WHERE id = NEW.wallet_id;
    ELSIF NEW.type = 'transfer' THEN
      IF NEW.wallet_id IS NOT NULL THEN
        UPDATE public.wallets 
        SET balance = balance - (NEW.amount + COALESCE(NEW.fee, 0.00)), updated_at = NOW() 
        WHERE id = NEW.wallet_id;
      END IF;
      IF NEW.destination_wallet_id IS NOT NULL THEN
        UPDATE public.wallets 
        SET balance = balance + NEW.amount, updated_at = NOW() 
        WHERE id = NEW.destination_wallet_id;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- M. Administrative Utility Functions
CREATE OR REPLACE FUNCTION public.promote_to_admin(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Superadmin yang berhak mengangkat admin baru.';
  END IF;

  UPDATE public.profiles
  SET 
    is_admin = TRUE,
    role = 'admin',
    approval_status = 'approved',
    approved_at = NOW(),
    subscription_tier = 'pro',
    subscription_status = 'active',
    updated_at = NOW()
  WHERE LOWER(email) = LOWER(admin_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.promote_to_admin(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.approve_user_registration(target_user_id UUID, p_admin_id UUID DEFAULT auth.uid())
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Superadmin yang berhak menyetujui akun pendaftar.';
  END IF;

  UPDATE public.profiles
  SET 
    approval_status = 'approved',
    approved_at = NOW(),
    approved_by = p_admin_id,
    updated_at = NOW()
  WHERE id = target_user_id;

  INSERT INTO public.audit_logs (admin_id, target_user_id, action, details)
  VALUES (p_admin_id, target_user_id, 'USER_REGISTRATION_APPROVED', jsonb_build_object('approved_at', NOW()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.approve_user_registration(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_user_registration(UUID, UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reject_user_registration(target_user_id UUID, reason TEXT DEFAULT 'Pendaftaran ditolak oleh Admin', p_admin_id UUID DEFAULT auth.uid())
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Superadmin yang berhak menolak akun pendaftar.';
  END IF;

  UPDATE public.profiles
  SET 
    approval_status = 'rejected',
    updated_at = NOW()
  WHERE id = target_user_id;

  INSERT INTO public.audit_logs (admin_id, target_user_id, action, details)
  VALUES (p_admin_id, target_user_id, 'USER_REGISTRATION_REJECTED', jsonb_build_object('reason', reason, 'rejected_at', NOW()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.reject_user_registration(UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_user_registration(UUID, TEXT, UUID) TO authenticated, service_role;

-- ==============================================================================
-- 5. AUTOMATED BUSINESS TRIGGERS
-- ==============================================================================

-- A. Auto-update 'updated_at' column triggers
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_wallets_updated_at ON public.wallets;
CREATE TRIGGER trg_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON public.budgets;
CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_telegram_updated_at ON public.telegram_connections;
CREATE TRIGGER trg_telegram_updated_at BEFORE UPDATE ON public.telegram_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ai_providers_updated_at ON public.ai_provider_configs;
CREATE TRIGGER trg_ai_providers_updated_at BEFORE UPDATE ON public.ai_provider_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER trg_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payment_transactions;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- B. Field Synchronization & Security Triggers
DROP TRIGGER IF EXISTS trg_sync_profile_phone ON public.profiles;
CREATE TRIGGER trg_sync_profile_phone
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_phone();

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

DROP TRIGGER IF EXISTS trg_sync_transaction_receipt_url ON public.transactions;
CREATE TRIGGER trg_sync_transaction_receipt_url
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_transaction_receipt_url();

DROP TRIGGER IF EXISTS trg_sync_receipt_items ON public.transaction_receipt_items;
CREATE TRIGGER trg_sync_receipt_items
  BEFORE INSERT OR UPDATE ON public.transaction_receipt_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_receipt_items_fields();

DROP TRIGGER IF EXISTS trg_sync_budget_threshold ON public.budgets;
CREATE TRIGGER trg_sync_budget_threshold
  BEFORE INSERT OR UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.sync_budget_threshold();

DROP TRIGGER IF EXISTS trg_sync_telegram ON public.telegram_connections;
CREATE TRIGGER trg_sync_telegram
  BEFORE INSERT OR UPDATE ON public.telegram_connections
  FOR EACH ROW EXECUTE FUNCTION public.sync_telegram_fields();

DROP TRIGGER IF EXISTS trg_sync_ai_provider ON public.ai_provider_configs;
CREATE TRIGGER trg_sync_ai_provider
  BEFORE INSERT OR UPDATE ON public.ai_provider_configs
  FOR EACH ROW EXECUTE FUNCTION public.sync_ai_provider_fields();

DROP TRIGGER IF EXISTS trg_sync_ai_log ON public.ai_logs;
CREATE TRIGGER trg_sync_ai_log
  BEFORE INSERT OR UPDATE ON public.ai_logs
  FOR EACH ROW EXECUTE FUNCTION public.sync_ai_log_fields();

-- C. Auth User Signup Trigger (Conditionally managed to avoid relation errors if auth schema is missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
    EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()';
  END IF;
END $$;

-- D. Wallet Balance Trigger
DROP TRIGGER IF EXISTS on_transaction_balance_change ON public.transactions;
CREATE TRIGGER on_transaction_balance_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_balance_on_tx();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all 12 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Profiles Policies:
-- Users can view their own profile even if pending (to see approval status).
-- Superadmin Sinta Salsabila can view and manage all profiles.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_insert_own_or_admin"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- Wallets Policies:
-- Approved users manage their own wallets. Superadmin manages all.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "wallets_all_approved_or_admin" ON public.wallets;
CREATE POLICY "wallets_all_approved_or_admin"
ON public.wallets FOR ALL
USING ((auth.uid() = user_id AND public.is_approved_user()) OR public.is_admin())
WITH CHECK ((auth.uid() = user_id AND public.is_approved_user()) OR public.is_admin());

-- ------------------------------------------------------------------------------
-- Categories Policies:
-- Everyone can read system categories. Approved users can read & manage own categories. Admin manages all.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "categories_select_system_or_own" ON public.categories;
CREATE POLICY "categories_select_system_or_own"
ON public.categories FOR SELECT
USING (is_system = TRUE OR (auth.uid() = user_id AND public.is_approved_user()) OR public.is_admin());

DROP POLICY IF EXISTS "categories_insert_own_or_admin" ON public.categories;
CREATE POLICY "categories_insert_own_or_admin"
ON public.categories FOR INSERT
WITH CHECK ((auth.uid() = user_id AND public.is_approved_user()) OR public.is_admin());

DROP POLICY IF EXISTS "categories_update_own_or_admin" ON public.categories;
CREATE POLICY "categories_update_own_or_admin"
ON public.categories FOR UPDATE
USING ((auth.uid() = user_id AND public.is_approved_user() AND is_system = FALSE) OR public.is_admin());

DROP POLICY IF EXISTS "categories_delete_own_or_admin" ON public.categories;
CREATE POLICY "categories_delete_own_or_admin"
ON public.categories FOR DELETE
USING ((auth.uid() = user_id AND public.is_approved_user() AND is_system = FALSE) OR public.is_admin());

-- ------------------------------------------------------------------------------
-- Transactions Policies:
-- Approved users manage own transactions. Superadmin manages all.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "transactions_all_approved_or_admin" ON public.transactions;
CREATE POLICY "transactions_all_approved_or_admin"
ON public.transactions FOR ALL
USING ((auth.uid() = user_id AND public.is_approved_user()) OR public.is_admin())
WITH CHECK ((auth.uid() = user_id AND public.is_approved_user()) OR public.is_admin());

-- ------------------------------------------------------------------------------
-- Transaction Receipt Items Policies:
-- Approved users manage receipt items linked to their transactions. Superadmin manages all.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "receipt_items_all_approved_or_admin" ON public.transaction_receipt_items;
CREATE POLICY "receipt_items_all_approved_or_admin"
ON public.transaction_receipt_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = transaction_id 
      AND ((t.user_id = auth.uid() AND public.is_approved_user()) OR public.is_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.id = transaction_id 
      AND ((t.user_id = auth.uid() AND public.is_approved_user()) OR public.is_admin())
  )
);

-- ------------------------------------------------------------------------------
-- Budgets Policies:
-- Approved users manage own budgets. Superadmin manages all.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "budgets_all_approved_or_admin" ON public.budgets;
CREATE POLICY "budgets_all_approved_or_admin"
ON public.budgets FOR ALL
USING ((auth.uid() = user_id AND public.is_approved_user()) OR public.is_admin())
WITH CHECK ((auth.uid() = user_id AND public.is_approved_user()) OR public.is_admin());

-- ------------------------------------------------------------------------------
-- Telegram Connections Policies:
-- Approved users manage own connection. Superadmin manages all.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "telegram_all_approved_or_admin" ON public.telegram_connections;
CREATE POLICY "telegram_all_approved_or_admin"
ON public.telegram_connections FOR ALL
USING ((auth.uid() = user_id AND public.is_approved_user()) OR public.is_admin())
WITH CHECK ((auth.uid() = user_id AND public.is_approved_user()) OR public.is_admin());

-- ------------------------------------------------------------------------------
-- AI Provider Configs Policies:
-- Strictly Superadmin only (prevents API key leakage).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "ai_configs_admin_only" ON public.ai_provider_configs;
CREATE POLICY "ai_configs_admin_only"
ON public.ai_provider_configs FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- AI Logs Policies:
-- Approved users can view their own AI logs. Superadmin can view all.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "ai_logs_select" ON public.ai_logs;
CREATE POLICY "ai_logs_select"
ON public.ai_logs FOR SELECT
USING ((auth.uid() = user_id AND public.is_approved_user()) OR public.is_admin());

DROP POLICY IF EXISTS "ai_logs_insert" ON public.ai_logs;
CREATE POLICY "ai_logs_insert"
ON public.ai_logs FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- Subscription Plans Policies:
-- Public can read active subscription plans. Superadmin manages plans.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "plans_public_read" ON public.subscription_plans;
CREATE POLICY "plans_public_read"
ON public.subscription_plans FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "plans_admin_manage" ON public.subscription_plans;
CREATE POLICY "plans_admin_manage"
ON public.subscription_plans FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- Audit Logs Policies:
-- Superadmin can view all audit logs. Users can only insert non-spoofed logs.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert"
ON public.audit_logs FOR INSERT
WITH CHECK (
  public.is_admin() 
  OR (auth.uid() IS NOT NULL AND (admin_id IS NULL OR admin_id = auth.uid()))
);

-- ------------------------------------------------------------------------------
-- Payment Transactions Policies:
-- Users can view and submit their own payments (even if pending).
-- Superadmin can manage, view, and approve all payments.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "payments_select_own_or_admin" ON public.payment_transactions;
CREATE POLICY "payments_select_own_or_admin"
ON public.payment_transactions FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "payments_insert_own_or_admin" ON public.payment_transactions;
CREATE POLICY "payments_insert_own_or_admin"
ON public.payment_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "payments_admin_update" ON public.payment_transactions;
CREATE POLICY "payments_admin_update"
ON public.payment_transactions FOR UPDATE
USING (public.is_admin());

-- ==============================================================================
-- 7. SUPABASE STORAGE BUCKET CONFIGURATION & STORAGE POLICIES
-- ==============================================================================

-- Create Storage Bucket 'receipts' (10MB limit, image/pdf mime types) idempotently
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    BEGIN
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'receipts',
        'receipts',
        true,
        10485760, -- 10 Megabytes
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg', 'application/pdf']
      )
      ON CONFLICT (id) DO UPDATE SET
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notice: Storage bucket initialization skipped: %', SQLERRM;
    END;
  END IF;
END $$;

-- Storage RLS Policies for 'receipts'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Receipts public read access" ON storage.objects';
      EXECUTE 'CREATE POLICY "Receipts public read access" ON storage.objects FOR SELECT USING (bucket_id = ''receipts'')';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notice: Storage policy (read) skipped: %', SQLERRM;
    END;

    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Approved users upload receipts" ON storage.objects';
      EXECUTE 'CREATE POLICY "Approved users upload receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''receipts'' AND (public.is_approved_user() OR public.is_admin()))';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notice: Storage policy (upload) skipped: %', SQLERRM;
    END;

    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Users update own receipts" ON storage.objects';
      EXECUTE 'CREATE POLICY "Users update own receipts" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''receipts'' AND ((auth.uid()::text = (storage.foldername(name))[1]) OR (auth.uid()::text = owner::text) OR public.is_admin()))';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notice: Storage policy (update) skipped: %', SQLERRM;
    END;

    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "Users delete own receipts" ON storage.objects';
      EXECUTE 'CREATE POLICY "Users delete own receipts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''receipts'' AND ((auth.uid()::text = (storage.foldername(name))[1]) OR (auth.uid()::text = owner::text) OR public.is_admin()))';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notice: Storage policy (delete) skipped: %', SQLERRM;
    END;
  END IF;
END $$;

-- ==============================================================================
-- 8. INITIAL SEED DATA
-- ==============================================================================

-- A. Standard Indonesian System Categories (Expense & Income)
-- Idempotent: checks for existence before inserting, preventing duplicates
INSERT INTO public.categories (name, type, icon, color, is_system)
SELECT c.name, c.type, c.icon, c.color, c.is_system
FROM (
  VALUES
    ('Makanan & Minuman', 'expense', 'utensils', '#FF6B00', TRUE),
    ('Transportasi & Bensin', 'expense', 'car', '#3B82F6', TRUE),
    ('Belanja Harian & Minimarket', 'expense', 'shopping-cart', '#10B981', TRUE),
    ('Tagihan & Utilitas', 'expense', 'receipt', '#8B5CF6', TRUE),
    ('Hiburan & Rekreasi', 'expense', 'film', '#EC4899', TRUE),
    ('Kesehatan & Obat', 'expense', 'heart-pulse', '#EF4444', TRUE),
    ('Pendidikan & Buku', 'expense', 'graduation-cap', '#F59E0B', TRUE),
    ('Donasi & Zakat', 'expense', 'hand-heart', '#06B6D4', TRUE),
    ('Keluarga & Anak', 'expense', 'home', '#6366F1', TRUE),
    ('Lain-lain', 'expense', 'more-horizontal', '#6B7280', TRUE),
    ('Gaji Bulanan', 'income', 'briefcase', '#10B981', TRUE),
    ('Bonus & Tunjangan', 'income', 'gift', '#059669', TRUE),
    ('Penjualan Bisnis', 'income', 'store', '#2563EB', TRUE),
    ('Investasi & Dividen', 'income', 'trending-up', '#7C3AED', TRUE),
    ('Cashback & Hadiah', 'income', 'sparkles', '#D97706', TRUE),
    ('Transfer Masuk', 'income', 'arrow-down-left', '#4B5563', TRUE)
) AS c(name, type, icon, color, is_system)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories sc 
  WHERE sc.name = c.name AND sc.type = c.type AND sc.is_system = TRUE
);

-- B. Official Subscription Plans (Free, Starter Rp 49.000 / bln, Pro Rp 99.000 Lifetime)
INSERT INTO public.subscription_plans (name, slug, code, price, billing_cycle, features, is_active) VALUES
  (
    'TataDana Free',
    'free',
    'free',
    0.00,
    'free',
    '["Maksimal 2 Wallet", "30 Transaksi Bot AI / bulan", "Ekspor Ringkasan Laporan", "Kategori Standar Finansial"]'::jsonb,
    TRUE
  ),
  (
    'TataDana Starter',
    'starter',
    'starter_monthly',
    49000.00,
    'monthly',
    '["Multi-Wallet Tanpa Batas", "200 Transaksi Bot AI / bulan", "OCR Struk Belanja Real-Time", "Voice Note Audio AI", "Budget Alert Otomatis", "Ekspor Excel & PDF Lengkap"]'::jsonb,
    TRUE
  ),
  (
    'TataDana Pro (Lifetime)',
    'pro',
    'pro_lifetime',
    99000.00,
    'lifetime',
    '["Akses Seumur Hidup (Sekali Bayar)", "Unlimited Bot AI Transaksi", "Prioritas Gemini Flash & OpenAI Failover", "Multi-Item Receipt Breakdown", "Laporan Pajak & Finansial UMKM", "Dukungan Prioritas WhatsApp / Telegram", "Akses Seluruh Fitur Baru Selamanya"]'::jsonb,
    TRUE
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  price = EXCLUDED.price,
  billing_cycle = EXCLUDED.billing_cycle,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- C. AI Provider Cluster Initial Seed (Google Gemini 1.5 Flash Primary + OpenAI + DeepSeek)
INSERT INTO public.ai_provider_configs (
  provider_name,
  model_id,
  model_name,
  api_key_masked,
  is_active,
  priority,
  priority_order,
  is_failover,
  monthly_token_limit,
  cost_estimate
) VALUES
  (
    'gemini',
    'gemini-1.5-flash',
    'gemini-1.5-flash',
    'AIzaSy••••••••Flash2026',
    TRUE,
    1,
    1,
    TRUE,
    15000000,
    0.0000
  ),
  (
    'openai',
    'gpt-4o-mini',
    'gpt-4o-mini',
    'sk-proj-••••••••MiniOpenAI',
    TRUE,
    2,
    2,
    TRUE,
    5000000,
    0.0000
  ),
  (
    'deepseek',
    'deepseek-chat',
    'deepseek-chat',
    'sk-••••••••DeepSeekV3',
    TRUE,
    3,
    3,
    TRUE,
    10000000,
    0.0000
  )
ON CONFLICT (provider_name) DO UPDATE SET
  model_id = EXCLUDED.model_id,
  model_name = EXCLUDED.model_name,
  is_active = EXCLUDED.is_active,
  priority = EXCLUDED.priority,
  priority_order = EXCLUDED.priority_order,
  is_failover = EXCLUDED.is_failover,
  updated_at = NOW();

-- D. Auto-promote or initialize Sinta Salsabila if already signed up in auth.users
DO $$
DECLARE
  v_admin_id UUID;
  v_admin_email TEXT;
  v_full_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Sinta Salsabila')
    INTO v_admin_id, v_admin_email, v_full_name
    FROM auth.users 
    WHERE LOWER(email) = 'sinta.salsabila@tatadana.id' 
    LIMIT 1;

    IF v_admin_id IS NOT NULL THEN
      INSERT INTO public.profiles (
        id,
        email,
        full_name,
        is_admin,
        role,
        approval_status,
        approved_at,
        subscription_tier,
        subscription_status
      ) VALUES (
        v_admin_id,
        v_admin_email,
        v_full_name,
        TRUE,
        'admin',
        'approved',
        NOW(),
        'pro',
        'active'
      )
      ON CONFLICT (id) DO UPDATE SET
        is_admin = TRUE,
        role = 'admin',
        approval_status = 'approved',
        approved_at = COALESCE(profiles.approved_at, NOW()),
        subscription_tier = 'pro',
        subscription_status = 'active',
        full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
        updated_at = NOW();

      -- Ensure initial wallets are present for Sinta
      IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE user_id = v_admin_id) THEN
        INSERT INTO public.wallets (user_id, name, type, balance, color, icon, is_default, is_active)
        VALUES 
          (v_admin_id, 'Cash Dompet', 'cash', 0.00, '#10B981', 'banknote', TRUE, TRUE),
          (v_admin_id, 'BCA Tabungan', 'bank', 0.00, '#00529C', 'building-2', FALSE, TRUE),
          (v_admin_id, 'GoPay', 'ewallet', 0.00, '#00AED6', 'smartphone', FALSE, TRUE);
      END IF;
    END IF;
  END IF;
END $$;
