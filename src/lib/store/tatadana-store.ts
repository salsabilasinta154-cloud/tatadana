'use client';

import { useState, useEffect } from 'react';
import {
  Profile,
  Wallet,
  Category,
  Transaction,
  Budget,
  AIProviderConfig,
  AILog,
  PaymentTransaction,
  AuditLog,
  TelegramConnection,
  ManagedUser,
  SubscriptionTier,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_WALLETS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_AI_CONFIGS,
  INITIAL_AI_LOGS,
  INITIAL_PAYMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_MANAGED_USERS,
} from './mock-data';
import { generateRandomId } from '../utils';

const STORAGE_KEY = 'tatadana_state_v4';

export interface TataDanaState {
  profile: Profile;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  aiConfigs: AIProviderConfig[];
  aiProviderMode: 'single' | 'failover';
  aiLogs: AILog[];
  payments: PaymentTransaction[];
  auditLogs: AuditLog[];
  telegramConnection: TelegramConnection;
  impersonatingUserId: string | null;
  users: ManagedUser[];
}

const defaultState: TataDanaState = {
  profile: INITIAL_USER,
  wallets: INITIAL_WALLETS,
  categories: INITIAL_CATEGORIES,
  transactions: INITIAL_TRANSACTIONS,
  budgets: INITIAL_BUDGETS,
  aiConfigs: INITIAL_AI_CONFIGS,
  aiProviderMode: 'failover',
  aiLogs: INITIAL_AI_LOGS,
  payments: INITIAL_PAYMENTS,
  auditLogs: INITIAL_AUDIT_LOGS,
  telegramConnection: {
    id: 'tg_conn_01',
    user_id: INITIAL_USER.id,
    telegram_chat_id: 928371928,
    telegram_username: '@sintasalsabila',
    first_name: 'Sinta',
    last_name: 'Salsabila',
    is_verified: true,
    connected_at: '2026-01-15T10:00:00.000Z',
    last_interaction_at: '2026-10-13T06:30:00.000Z',
  },
  impersonatingUserId: null,
  users: INITIAL_MANAGED_USERS,
};

// Listeners for store changes
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getStoredState(): TataDanaState {
  if (typeof window === 'undefined') {
    return defaultState;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return defaultState;
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      profile: {
        ...defaultState.profile,
        ...(parsed.profile || {}),
      },
      wallets: Array.isArray(parsed.wallets) && parsed.wallets.length ? parsed.wallets : defaultState.wallets,
      categories: Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : defaultState.categories,
      payments: Array.isArray(parsed.payments) && parsed.payments.length ? parsed.payments : defaultState.payments,
      users: Array.isArray(parsed.users) && parsed.users.length ? parsed.users : defaultState.users,
      auditLogs: Array.isArray(parsed.auditLogs) && parsed.auditLogs.length ? parsed.auditLogs : defaultState.auditLogs,
    };
  } catch (e) {
    return defaultState;
  }
}

export function saveState(state: TataDanaState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notify();
  } catch (e) {
    console.error('Failed to save TataDana state:', e);
  }
}

// React Hook
export function useTataDana() {
  const [state, setState] = useState<TataDanaState>(() => getStoredState());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Sync on mount
    setState(getStoredState());
    setIsLoaded(true);

    const handleChange = () => {
      setState(getStoredState());
    };

    listeners.add(handleChange);
    window.addEventListener('storage', handleChange);

    return () => {
      listeners.delete(handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  // Actions
  const addTransaction = (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    const currentState = getStoredState();
    const newTx: Transaction = {
      ...tx,
      id: generateRandomId('tx'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update wallet balance
    const updatedWallets = currentState.wallets.map((w) => {
      if (newTx.type === 'expense' && w.id === newTx.wallet_id) {
        return { ...w, balance: Math.max(0, w.balance - newTx.amount - (newTx.fee || 0)) };
      }
      if (newTx.type === 'income' && w.id === newTx.wallet_id) {
        return { ...w, balance: w.balance + newTx.amount };
      }
      if (newTx.type === 'transfer') {
        if (w.id === newTx.wallet_id) {
          return { ...w, balance: Math.max(0, w.balance - newTx.amount - (newTx.fee || 0)) };
        }
        if (w.id === newTx.destination_wallet_id) {
          return { ...w, balance: w.balance + newTx.amount };
        }
      }
      return w;
    });

    const updatedTransactions = [newTx, ...currentState.transactions];

    saveState({
      ...currentState,
      transactions: updatedTransactions,
      wallets: updatedWallets,
    });

    return newTx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const currentState = getStoredState();
    const oldTx = currentState.transactions.find((t) => t.id === id);
    if (!oldTx) return null;

    const newTx: Transaction = {
      ...oldTx,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // 1. Revert old transaction's wallet effect
    let updatedWallets = currentState.wallets.map((w) => {
      let b = w.balance;
      if (oldTx.type === 'expense' && w.id === oldTx.wallet_id) {
        b += oldTx.amount + (oldTx.fee || 0);
      } else if (oldTx.type === 'income' && w.id === oldTx.wallet_id) {
        b = Math.max(0, b - oldTx.amount);
      } else if (oldTx.type === 'transfer') {
        if (w.id === oldTx.wallet_id) {
          b += oldTx.amount + (oldTx.fee || 0);
        }
        if (w.id === oldTx.destination_wallet_id) {
          b = Math.max(0, b - oldTx.amount);
        }
      }
      return { ...w, balance: b };
    });

    // 2. Apply new transaction's wallet effect
    updatedWallets = updatedWallets.map((w) => {
      let b = w.balance;
      if (newTx.type === 'expense' && w.id === newTx.wallet_id) {
        b = Math.max(0, b - newTx.amount - (newTx.fee || 0));
      } else if (newTx.type === 'income' && w.id === newTx.wallet_id) {
        b += newTx.amount;
      } else if (newTx.type === 'transfer') {
        if (w.id === newTx.wallet_id) {
          b = Math.max(0, b - newTx.amount - (newTx.fee || 0));
        }
        if (w.id === newTx.destination_wallet_id) {
          b += newTx.amount;
        }
      }
      return { ...w, balance: b };
    });

    const updatedTransactions = currentState.transactions.map((t) => (t.id === id ? newTx : t));

    saveState({
      ...currentState,
      transactions: updatedTransactions,
      wallets: updatedWallets,
    });

    return newTx;
  };

  const deleteTransaction = (id: string) => {
    const currentState = getStoredState();
    const txToDelete = currentState.transactions.find((t) => t.id === id);
    if (!txToDelete) return;

    // Revert wallet balance
    const updatedWallets = currentState.wallets.map((w) => {
      if (txToDelete.type === 'expense' && w.id === txToDelete.wallet_id) {
        return { ...w, balance: w.balance + txToDelete.amount + (txToDelete.fee || 0) };
      }
      if (txToDelete.type === 'income' && w.id === txToDelete.wallet_id) {
        return { ...w, balance: Math.max(0, w.balance - txToDelete.amount) };
      }
      if (txToDelete.type === 'transfer') {
        if (w.id === txToDelete.wallet_id) {
          return { ...w, balance: w.balance + txToDelete.amount + (txToDelete.fee || 0) };
        }
        if (w.id === txToDelete.destination_wallet_id) {
          return { ...w, balance: Math.max(0, w.balance - txToDelete.amount) };
        }
      }
      return w;
    });

    const updatedTransactions = currentState.transactions.filter((t) => t.id !== id);

    saveState({
      ...currentState,
      transactions: updatedTransactions,
      wallets: updatedWallets,
    });
  };

  const addWallet = (wallet: Omit<Wallet, 'id' | 'created_at' | 'updated_at'>) => {
    const currentState = getStoredState();
    const newWallet: Wallet = {
      ...wallet,
      id: generateRandomId('wal'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveState({
      ...currentState,
      wallets: [...currentState.wallets, newWallet],
    });
    return newWallet;
  };

  const updateWallet = (id: string, updates: Partial<Wallet>) => {
    const currentState = getStoredState();
    const updatedWallets = currentState.wallets.map((w) =>
      w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
    );
    saveState({ ...currentState, wallets: updatedWallets });
  };

  const deleteWallet = (id: string) => {
    const currentState = getStoredState();
    const updatedWallets = currentState.wallets.filter((w) => w.id !== id);
    saveState({ ...currentState, wallets: updatedWallets });
  };

  const addBudget = (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) => {
    const currentState = getStoredState();
    const newBudget: Budget = {
      ...budget,
      id: generateRandomId('bud'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveState({ ...currentState, budgets: [...currentState.budgets, newBudget] });
    return newBudget;
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    const currentState = getStoredState();
    const updatedBudgets = currentState.budgets.map((b) =>
      b.id === id ? { ...b, ...updates, updated_at: new Date().toISOString() } : b
    );
    saveState({ ...currentState, budgets: updatedBudgets });
  };

  const deleteBudget = (id: string) => {
    const currentState = getStoredState();
    const updatedBudgets = currentState.budgets.filter((b) => b.id !== id);
    saveState({ ...currentState, budgets: updatedBudgets });
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const currentState = getStoredState();
    const newCat: Category = {
      ...category,
      id: generateRandomId('cat'),
    };
    saveState({ ...currentState, categories: [...currentState.categories, newCat] });
    return newCat;
  };

  const updateProfile = (updates: Partial<Profile>) => {
    const currentState = getStoredState();
    const updated = { ...currentState.profile, ...updates, updated_at: new Date().toISOString() };
    saveState({ ...currentState, profile: updated });
  };

  const updateAIConfig = (id: string, updates: Partial<AIProviderConfig>) => {
    const currentState = getStoredState();
    const updated = currentState.aiConfigs.map((c) => (c.id === id ? { ...c, ...updates } : c));
    saveState({ ...currentState, aiConfigs: updated });
  };

  const setAIProviderMode = (mode: 'single' | 'failover') => {
    const currentState = getStoredState();
    saveState({ ...currentState, aiProviderMode: mode });
  };

  const addAILog = (log: AILog) => {
    const currentState = getStoredState();
    saveState({ ...currentState, aiLogs: [log, ...currentState.aiLogs] });
  };

  const addPayment = (
    payment: Omit<PaymentTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'> & {
      id?: string;
      user_id?: string;
      created_at?: string;
      updated_at?: string;
    }
  ) => {
    const currentState = getStoredState();
    const newPayment: PaymentTransaction = {
      ...payment,
      id: payment.id || generateRandomId('pay'),
      user_id: payment.user_id || currentState.profile.id,
      created_at: payment.created_at || new Date().toISOString(),
      updated_at: payment.updated_at || new Date().toISOString(),
    };

    const newAuditLog: AuditLog = {
      id: generateRandomId('aud'),
      user_id: currentState.profile.id,
      actor_type: 'user',
      action: 'PAYMENT_INITIATED',
      target_resource: `payment:${newPayment.order_id}`,
      details: {
        order_id: newPayment.order_id,
        plan_code: newPayment.plan_code,
        amount: newPayment.amount,
        payment_method: newPayment.payment_method,
        user_name: newPayment.user_name,
        user_email: newPayment.user_email,
      },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    };

    saveState({
      ...currentState,
      payments: [newPayment, ...currentState.payments],
      auditLogs: [newAuditLog, ...currentState.auditLogs],
    });
    return newPayment;
  };

  const approvePayment = (orderId: string, adminNotes = 'Disetujui oleh Superadmin') => {
    const currentState = getStoredState();
    const payment = currentState.payments.find((p) => p.order_id === orderId);
    const targetTier: SubscriptionTier = payment?.plan_code.toLowerCase().includes('pro') ? 'pro' : 'starter';

    const updatedPayments = currentState.payments.map((p) =>
      p.order_id === orderId
        ? {
            ...p,
            status: 'settlement' as const,
            admin_notes: adminNotes,
            updated_at: new Date().toISOString(),
          }
        : p
    );

    // 1. Upgrade user in users list if found
    const updatedUsers = (currentState.users || []).map((u) => {
      const match =
        (payment && payment.user_id && u.id === payment.user_id) ||
        (payment && payment.user_email && u.email.toLowerCase() === payment.user_email.toLowerCase());
      return match ? { ...u, tier: targetTier } : u;
    });

    // 2. Upgrade current profile if matching
    let updatedProfile = currentState.profile;
    const isMatchingProfile =
      payment &&
      (payment.user_id === currentState.profile.id ||
        (payment.user_email &&
          payment.user_email.toLowerCase() === currentState.profile.email.toLowerCase()));

    if (isMatchingProfile && payment) {
      updatedProfile = {
        ...currentState.profile,
        subscription_tier: targetTier,
        subscription_status: 'active',
      };
    }

    const newAuditLog: AuditLog = {
      id: generateRandomId('aud'),
      user_id: currentState.profile.id,
      actor_type: 'admin',
      action: 'PAYMENT_APPROVED',
      target_resource: `payment:${orderId}`,
      details: {
        order_id: orderId,
        plan_code: payment?.plan_code,
        amount: payment?.amount,
        user_name: payment?.user_name,
        user_email: payment?.user_email,
        admin_notes: adminNotes,
        upgraded_user: isMatchingProfile ? currentState.profile.email : payment?.user_email,
        upgraded_tier: targetTier,
      },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    };

    saveState({
      ...currentState,
      payments: updatedPayments,
      profile: updatedProfile,
      users: updatedUsers,
      auditLogs: [newAuditLog, ...currentState.auditLogs],
    });
  };

  const rejectPayment = (orderId: string, reason = 'Bukti transfer tidak valid') => {
    const currentState = getStoredState();
    const payment = currentState.payments.find((p) => p.order_id === orderId);
    const updatedPayments = currentState.payments.map((p) =>
      p.order_id === orderId
        ? {
            ...p,
            status: 'rejected' as const,
            admin_notes: reason,
            updated_at: new Date().toISOString(),
          }
        : p
    );

    const newAuditLog: AuditLog = {
      id: generateRandomId('aud'),
      user_id: currentState.profile.id,
      actor_type: 'admin',
      action: 'PAYMENT_REJECTED',
      target_resource: `payment:${orderId}`,
      details: {
        order_id: orderId,
        reason,
        plan_code: payment?.plan_code,
        amount: payment?.amount,
        user_name: payment?.user_name,
        user_email: payment?.user_email,
      },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    };

    saveState({
      ...currentState,
      payments: updatedPayments,
      auditLogs: [newAuditLog, ...currentState.auditLogs],
    });
  };

  const updateUserTier = (userId: string, newTier: SubscriptionTier) => {
    const currentState = getStoredState();
    const updatedUsers = (currentState.users || []).map((u) =>
      u.id === userId ? { ...u, tier: newTier } : u
    );
    let updatedProfile = currentState.profile;
    if (currentState.profile.id === userId) {
      updatedProfile = { ...currentState.profile, subscription_tier: newTier };
    }
    saveState({ ...currentState, users: updatedUsers, profile: updatedProfile });
  };

  const setSubscriptionTier = (newTier: SubscriptionTier) => {
    const currentState = getStoredState();
    const updatedProfile = { ...currentState.profile, subscription_tier: newTier };
    const updatedUsers = (currentState.users || []).map((u) =>
      u.id === currentState.profile.id ||
      u.email.toLowerCase() === currentState.profile.email.toLowerCase()
        ? { ...u, tier: newTier }
        : u
    );
    saveState({ ...currentState, profile: updatedProfile, users: updatedUsers });
  };

  const stopImpersonation = () => {
    const currentState = getStoredState();
    saveState({
      ...currentState,
      profile: INITIAL_USER,
      impersonatingUserId: null,
    });
  };

  const addAuditLog = (log: Omit<AuditLog, 'id' | 'created_at'>) => {
    const currentState = getStoredState();
    const newLog: AuditLog = {
      ...log,
      id: generateRandomId('aud'),
      created_at: new Date().toISOString(),
    };
    saveState({
      ...currentState,
      auditLogs: [newLog, ...currentState.auditLogs],
    });
  };

  const approveUser = (userId: string) => {
    const currentState = getStoredState();
    const targetUser = currentState.users.find((u) => u.id === userId);
    const updatedUsers = (currentState.users || []).map((u) =>
      u.id === userId
        ? { ...u, approval_status: 'approved' as const, status: 'active' as const }
        : u
    );

    let updatedProfile = currentState.profile;
    if (currentState.profile.id === userId) {
      updatedProfile = {
        ...currentState.profile,
        approval_status: 'approved',
      };
    }

    const audit: AuditLog = {
      id: generateRandomId('aud'),
      user_id: currentState.profile.id,
      actor_type: 'admin',
      action: 'USER_ACCOUNT_APPROVED',
      target_resource: `user:${targetUser?.email || userId}`,
      details: {
        user_id: userId,
        full_name: targetUser?.full_name,
        email: targetUser?.email,
        approved_by: 'Sinta Salsabila (Superadmin)',
      },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    };

    saveState({
      ...currentState,
      users: updatedUsers,
      profile: updatedProfile,
      auditLogs: [audit, ...currentState.auditLogs],
    });
  };

  const rejectUser = (userId: string, reason = 'Pendaftaran ditolak oleh Admin Sinta Salsabila') => {
    const currentState = getStoredState();
    const targetUser = currentState.users.find((u) => u.id === userId);
    const updatedUsers = (currentState.users || []).map((u) =>
      u.id === userId
        ? { ...u, approval_status: 'rejected' as const, status: 'suspended' as const }
        : u
    );

    let updatedProfile = currentState.profile;
    if (currentState.profile.id === userId) {
      updatedProfile = {
        ...currentState.profile,
        approval_status: 'rejected',
      };
    }

    const audit: AuditLog = {
      id: generateRandomId('aud'),
      user_id: currentState.profile.id,
      actor_type: 'admin',
      action: 'USER_ACCOUNT_REJECTED',
      target_resource: `user:${targetUser?.email || userId}`,
      details: {
        user_id: userId,
        full_name: targetUser?.full_name,
        email: targetUser?.email,
        reason,
        rejected_by: 'Sinta Salsabila (Superadmin)',
      },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    };

    saveState({
      ...currentState,
      users: updatedUsers,
      profile: updatedProfile,
      auditLogs: [audit, ...currentState.auditLogs],
    });
  };

  const registerUser = (userData: { full_name: string; email: string; phone: string }): ManagedUser => {
    const currentState = getStoredState();

    // Sesuai instruksi: hanya akun Sinta Salsabila yang menjadi admin.
    // Semua akun baru yang ingin masuk wajib berstatus role 'user' dan approval_status 'pending' menunggu persetujuan admin.
    const newUser: ManagedUser = {
      id: generateRandomId('usr'),
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone,
      tier: 'free',
      status: 'pending',
      approval_status: 'pending',
      role: 'user',
      created_at: new Date().toISOString(),
    };

    const audit: AuditLog = {
      id: generateRandomId('aud'),
      user_id: newUser.id,
      actor_type: 'user',
      action: 'USER_REGISTERED_WAITING_APPROVAL',
      target_resource: `user:${newUser.email}`,
      details: {
        full_name: newUser.full_name,
        email: newUser.email,
        role: 'user',
        requires_approval: true,
      },
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString(),
    };

    saveState({
      ...currentState,
      users: [newUser, ...(currentState.users || [])],
      auditLogs: [audit, ...currentState.auditLogs],
    });

    return newUser;
  };

  const loginUser = (emailOrName: string): { success: boolean; reason?: 'pending' | 'rejected' | 'not_found'; user?: ManagedUser | Profile } => {
    const currentState = getStoredState();
    const query = emailOrName.trim().toLowerCase();

    // Sesuai instruksi: Hanya akun Admin Sinta Salsabila yang memiliki role admin.
    // Verifikasi identitas admin secara ketat (bukan kecocokan longgar substring).
    const isSinta =
      query === 'sinta.salsabila@tatadana.id' ||
      query === 'sinta salsabila' ||
      query === '081234567890' ||
      query === INITIAL_USER.id.toLowerCase();

    if (isSinta) {
      const adminProfile: Profile = {
        ...INITIAL_USER,
        id: INITIAL_USER.id,
        full_name: 'Sinta Salsabila',
        email: 'sinta.salsabila@tatadana.id',
        is_admin: true,
        role: 'admin',
        approval_status: 'approved',
      };
      saveState({
        ...currentState,
        profile: adminProfile,
        impersonatingUserId: null,
      });
      return { success: true, user: adminProfile };
    }

    // Cari di daftar pengguna terdaftar
    const found = (currentState.users || []).find(
      (u) =>
        u.email.toLowerCase() === query ||
        u.full_name.toLowerCase() === query ||
        u.phone === query
    );

    if (!found) {
      return { success: false, reason: 'not_found' };
    }

    if (found.approval_status === 'pending') {
      return { success: false, reason: 'pending', user: found };
    }

    if (found.approval_status === 'rejected') {
      return { success: false, reason: 'rejected', user: found };
    }

    // Pengguna yang sudah diapprove (selain admin Sinta Salsabila, seluruhnya strictly role: 'user')
    const userProfile: Profile = {
      id: found.id,
      email: found.email,
      full_name: found.full_name,
      phone: found.phone,
      avatar_url: found.avatar_url,
      subscription_tier: found.tier,
      subscription_status: 'active',
      subscription_expires_at: null,
      is_admin: false,
      role: 'user',
      approval_status: 'approved',
      currency: 'IDR',
      daily_reminder_time: '20:00',
      daily_reminder_enabled: true,
      budget_alert_enabled: true,
      created_at: found.created_at,
      updated_at: new Date().toISOString(),
    };

    saveState({
      ...currentState,
      profile: userProfile,
      impersonatingUserId: null,
    });

    return { success: true, user: found };
  };

  const resetToSeed = () => {
    saveState(defaultState);
  };

  return {
    ...state,
    isLoaded,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addWallet,
    updateWallet,
    deleteWallet,
    addBudget,
    updateBudget,
    deleteBudget,
    addCategory,
    updateProfile,
    updateAIConfig,
    setAIProviderMode,
    addAILog,
    addPayment,
    approvePayment,
    rejectPayment,
    approveUser,
    rejectUser,
    registerUser,
    loginUser,
    updateUserTier,
    setSubscriptionTier,
    stopImpersonation,
    addAuditLog,
    resetToSeed,
  };
}
