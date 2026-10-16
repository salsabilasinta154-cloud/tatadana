'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTataDana, saveState, getStoredState } from '@/lib/store/tatadana-store';
import { Button } from '@/components/ui/Button';
import { UserCheck, Shield, Sparkles, UserX, Search } from 'lucide-react';
import { SubscriptionTier, ManagedUser } from '@/lib/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const { profile, users, updateUserTier, approveUser, rejectUser } = useTataDana();

  const [search, setSearch] = useState('');
  const usersList = users || [];

  const handleImpersonate = (u: ManagedUser) => {
    if (confirm(`Impersonate sebagai "${u.full_name}"? Anda akan dialihkan ke User Dashboard dengan identitas akun ini.`)) {
      const currentState = getStoredState();
      saveState({
        ...currentState,
        profile: {
          ...currentState.profile,
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
          avatar_url: u.avatar_url,
          subscription_tier: u.tier,
          is_admin: Boolean(u.role === 'admin'),
          role: u.role || 'user',
        },
        impersonatingUserId: u.id,
      });
      router.push('/dashboard');
    }
  };

  const handleUpdateTier = (id: string, newTier: SubscriptionTier) => {
    updateUserTier(id, newTier);
  };

  const filtered = usersList.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Kelola Pengguna Platform
        </h1>
        <p className="text-xs text-surface-400 mt-1">
          Daftar seluruh pengguna, role akses (Admin Sinta Salsabila vs User biasa), status approval, dan utilitas impersonasi.
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            placeholder="Cari nama, email, atau nomor HP pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface-900 border border-surface-800 text-xs text-white focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-900 rounded-3xl border border-surface-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-950 text-surface-400 uppercase tracking-wider font-semibold border-b border-surface-800">
              <tr>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Role Akses</th>
                <th className="py-3.5 px-4">No. HP</th>
                <th className="py-3.5 px-4">Paket Langganan</th>
                <th className="py-3.5 px-4">Status Approval</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {filtered.map((u) => {
                const isAdmin =
                  u.role === 'admin' ||
                  u.full_name.toLowerCase().includes('sinta salsabila') ||
                  u.email.toLowerCase().includes('sinta.salsabila');
                const status = u.approval_status || (u.status === 'active' ? 'approved' : 'pending');

                return (
                  <tr key={u.id} className="hover:bg-surface-950/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {u.full_name}
                        {isAdmin && (
                          <span className="text-[10px] bg-brand-500/20 text-brand-400 font-bold px-1.5 py-0.5 rounded border border-brand-500/40">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-surface-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {isAdmin ? (
                        <span className="text-[11px] font-bold text-brand-400 bg-brand-950 px-2 py-0.5 rounded-md border border-brand-800">
                          👑 Superadmin
                        </span>
                      ) : (
                        <span className="text-[11px] text-surface-400 bg-surface-950 px-2 py-0.5 rounded-md border border-surface-800">
                          👤 Regular User
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-surface-300">
                      {u.phone}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.tier}
                        onChange={(e) => handleUpdateTier(u.id, e.target.value as SubscriptionTier)}
                        className="bg-surface-950 border border-surface-800 text-brand-400 rounded-xl px-2.5 py-1 text-xs font-bold uppercase focus:outline-none"
                      >
                        <option value="free">FREE</option>
                        <option value="starter">STARTER (BULANAN)</option>
                        <option value="pro">PRO (LIFETIME)</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      {status === 'approved' && (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Disetujui
                        </span>
                      )}
                      {status === 'pending' && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-400 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Menunggu Approval
                        </span>
                      )}
                      {status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 font-bold text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Ditolak
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {status === 'pending' && !isAdmin && (
                          <Button
                            size="sm"
                            onClick={() => approveUser(u.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 font-bold"
                          >
                            Approve
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleImpersonate(u)}
                          className="bg-brand-950 hover:bg-brand-900 border-brand-800 text-brand-300 text-xs"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Impersonate
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
