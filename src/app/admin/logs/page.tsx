'use client';

import React, { useState } from 'react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Modal } from '@/components/ui/Modal';
import { Cpu, ShieldCheck, FileCode, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { AILog, AuditLog } from '@/lib/types';

export default function AdminLogsPage() {
  const { aiLogs, auditLogs } = useTataDana();

  const [activeTab, setActiveTab] = useState<'ai' | 'audit'>('ai');
  const [selectedAILog, setSelectedAILog] = useState<AILog | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Sistem Log & Audit Platform
        </h1>
        <p className="text-xs text-surface-400 mt-1">
          Pantau rekaman telemetri AI (latensi, token, failover recovery) dan audit trail keamanan superadmin.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-800 pb-2">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ai'
              ? 'bg-brand-600 text-white shadow-brand-glow'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Log Eksekusi AI ({aiLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-brand-600 text-white shadow-brand-glow'
              : 'text-surface-400 hover:text-white hover:bg-surface-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Platform Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* AI Logs Table */}
      {activeTab === 'ai' && (
        <div className="bg-surface-900 rounded-3xl border border-surface-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-950 text-surface-400 uppercase tracking-wider font-semibold border-b border-surface-800">
                <tr>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">Provider & Model</th>
                  <th className="py-3.5 px-4">Tipe Input</th>
                  <th className="py-3.5 px-4">Ringkasan Prompt</th>
                  <th className="py-3.5 px-4 text-right">Latensi</th>
                  <th className="py-3.5 px-4 text-right">Tokens</th>
                  <th className="py-3.5 px-4">Status Failover</th>
                  <th className="py-3.5 px-4 text-center">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {aiLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-950/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-surface-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-white block uppercase">{log.provider}</span>
                      <span className="text-[10px] text-surface-400">{log.model}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {log.input_type === 'text' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-800 text-surface-200">
                          TEKS
                        </span>
                      )}
                      {log.input_type === 'vision_receipt' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                          OCR VISION
                        </span>
                      )}
                      {log.input_type === 'voice_audio' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                          VOICE NOTE
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-surface-200 font-medium max-w-xs truncate">
                      {log.prompt_summary}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {log.latency_ms} ms
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-surface-400">
                      {log.token_count}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Sukses
                        </span>
                      )}
                      {log.status === 'failover_recovered' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                          <AlertTriangle className="w-3 h-3" /> Recovered
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedAILog(log)}
                        className="p-1 text-brand-400 hover:text-white transition-colors"
                        title="Lihat Data JSON"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      {activeTab === 'audit' && (
        <div className="bg-surface-900 rounded-3xl border border-surface-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-950 text-surface-400 uppercase tracking-wider font-semibold border-b border-surface-800">
                <tr>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4">Aktor</th>
                  <th className="py-3.5 px-4">Aksi / Event</th>
                  <th className="py-3.5 px-4">Target Resource</th>
                  <th className="py-3.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {auditLogs.map((aud) => (
                  <tr key={aud.id} className="hover:bg-surface-950/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-surface-400 whitespace-nowrap">
                      {new Date(aud.created_at).toLocaleTimeString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold uppercase text-brand-400">
                      {aud.actor_type}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white font-mono">
                      {aud.action}
                    </td>
                    <td className="py-3.5 px-4 text-surface-300 font-mono">
                      {aud.target_resource}
                    </td>
                    <td className="py-3.5 px-4 text-surface-400 font-mono">
                      {aud.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail JSON Modal */}
      <Modal
        isOpen={Boolean(selectedAILog)}
        onClose={() => setSelectedAILog(null)}
        title="AI Parsed JSON Data"
        description={`Log ID: ${selectedAILog?.id || ''} • Model: ${selectedAILog?.model || ''}`}
        maxWidth="lg"
      >
        <div className="bg-surface-950 rounded-2xl p-4 text-xs font-mono text-emerald-400 border border-surface-800 max-h-96 overflow-y-auto">
          <pre>{JSON.stringify(selectedAILog?.extracted_data, null, 2)}</pre>
        </div>
      </Modal>
    </div>
  );
}
