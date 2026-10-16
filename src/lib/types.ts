// TataDana Core Types

export type SubscriptionTier = 'free' | 'starter' | 'pro';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_expires_at?: string | null;
  is_admin: boolean;
  role?: 'admin' | 'user';
  approval_status?: 'approved' | 'pending' | 'rejected';
  currency: string;
  daily_reminder_time: string;
  daily_reminder_enabled: boolean;
  budget_alert_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type WalletType = 'bank' | 'ewallet' | 'cash' | 'investment' | 'crypto';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  account_number?: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_system: boolean;
  created_at?: string;
}

export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionSource = 'manual' | 'telegram_text' | 'telegram_receipt' | 'telegram_voice' | 'api';

export interface ReceiptItem {
  id: string;
  transaction_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  category?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id?: string | null;
  destination_wallet_id?: string | null;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  fee: number;
  description: string;
  notes?: string;
  source: TransactionSource;
  transaction_date: string; // YYYY-MM-DD
  receipt_image_url?: string;
  raw_input?: string;
  ai_parsed: boolean;
  receipt_items?: ReceiptItem[];
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number; // 1-12
  year: number;
  alert_threshold: number; // percentage 50-100
  created_at: string;
  updated_at: string;
}

export interface TelegramConnection {
  id: string;
  user_id: string;
  telegram_chat_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  otp_code?: string;
  otp_expires_at?: string;
  is_verified: boolean;
  connected_at: string;
  last_interaction_at: string;
}

export type AIProvider = 'gemini' | 'openai' | 'deepseek';

export interface AIProviderConfig {
  id: string;
  provider_name: AIProvider;
  model_name: string;
  api_key_masked: string;
  is_active: boolean;
  priority_order: number;
  monthly_token_limit: number;
  tokens_used_this_month: number;
  created_at: string;
  updated_at: string;
}

export interface AILog {
  id: string;
  user_id?: string | null;
  provider: string;
  model: string;
  input_type: 'text' | 'vision_receipt' | 'voice_audio';
  prompt_summary: string;
  extracted_data: Record<string, any>;
  latency_ms: number;
  token_count: number;
  status: 'success' | 'failover_recovered' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  price: number;
  billing_cycle: 'free' | 'monthly' | 'lifetime';
  features: string[];
  is_active: boolean;
}

export type PaymentStatus = 'pending' | 'settlement' | 'challenge' | 'deny' | 'expire' | 'cancelled' | 'approved' | 'rejected';
export type PaymentMethod = 'midtrans_qris' | 'midtrans_snap' | 'manual_transfer';

export interface PaymentTransaction {
  id: string;
  user_id: string;
  order_id: string;
  plan_code: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  midtrans_transaction_id?: string;
  manual_receipt_url?: string;
  bank_name?: string;
  account_sender_name?: string;
  admin_notes?: string;
  user_email?: string;
  user_name?: string;
  user_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  actor_type: 'user' | 'admin' | 'system';
  action: string;
  target_resource?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface ExtractedFinancialItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface AIParsedTransactionResult {
  success: boolean;
  type: TransactionType;
  amount: number;
  category: string;
  wallet: string;
  description: string;
  notes?: string;
  merchant?: string;
  date?: string;
  items?: ExtractedFinancialItem[];
  destination_wallet?: string;
  confidence: number;
  provider_used: string;
  raw_text?: string;
}

export interface ManagedUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  tier: SubscriptionTier;
  status: 'active' | 'suspended' | 'pending' | 'rejected';
  approval_status?: 'approved' | 'pending' | 'rejected';
  role?: 'admin' | 'user';
  created_at: string;
}
