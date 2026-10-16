'use client';

import React, { useState } from 'react';
import { useTataDana } from '@/lib/store/tatadana-store';
import { Button } from '@/components/ui/Button';
import {
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AIProviderConfig, AIProvider } from '@/lib/types';

export default function AdminAIProvidersPage() {
  const { aiConfigs, aiProviderMode, setAIProviderMode, updateAIConfig } =
    useTataDana();

  const [testResult, setTestResult] = useState<{
    provider: string;
    latency: number;
    status: string;
  } | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const handleTestLatency = async (provider: AIProvider) => {
    setTestingProvider(provider);
    setTestResult(null);

    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'beli kopi kenangan 28rb gopay',
          forcedProvider: provider,
          providerMode: 'single',
        }),
      });

      const data = await res.json();
      const latency = Date.now() - startTime;

      setTestResult({
        provider,
        latency: data.telemetry?.latency_ms || latency,
        status: data.success ? 'Online & Responsif' : 'Gagal',
      });
    } catch (err: any) {
      setTestResult({
        provider,
        latency: Date.now() - startTime,
        status: `Error: ${err.message}`,
      });
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            AI Engine & Failover Cluster
          </h1>
          <p className="text-xs text-surface-400 mt-1">
            Konfigurasi Google Gemini 1.5 Flash (Primary), OpenAI GPT-4o-mini, dan DeepSeek V3 dengan failover otomatis.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 p-1 bg-surface-900 border border-surface-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setAIProviderMode('failover')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              aiProviderMode === 'failover'
                ? 'bg-brand-600 text-white shadow-brand-glow'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Failover Chain (Direkomendasikan)
          </button>
          <button
            onClick={() => setAIProviderMode('single')}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              aiProviderMode === 'single'
                ? 'bg-brand-600 text-white shadow-brand-glow'
                : 'text-surface-400 hover:text-white'
            }`}
          >
            Single Provider Mode
          </button>
        </div>
      </div>

      {/* Latency Test Banner */}
      {testResult && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Tes Latensi Provider <strong>{testResult.provider.toUpperCase()}</strong>: {testResult.status} ({testResult.latency} ms)
            </span>
          </div>
          <span className="font-mono text-[10px] text-surface-400">
            {new Date().toLocaleTimeString('id-ID')}
          </span>
        </div>
      )}

      {/* Providers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {aiConfigs.map((config) => {
          const isPrimary = config.provider_name === 'gemini';
          const isSecondary = config.provider_name === 'openai';

          return (
            <div
              key={config.id}
              className={`p-6 rounded-3xl bg-surface-900 border flex flex-col justify-between transition-all ${
                isPrimary
                  ? 'border-brand-500/80 ring-1 ring-brand-500/30'
                  : 'border-surface-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white ${
                        isPrimary
                          ? 'bg-brand-600 shadow-brand-glow'
                          : isSecondary
                          ? 'bg-emerald-600'
                          : 'bg-blue-600'
                      }`}
                    >
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white uppercase">
                        {config.provider_name}
                      </h3>
                      <span className="text-[10px] text-surface-400 block font-mono">
                        {config.model_name}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isPrimary
                        ? 'bg-brand-900 text-brand-300 border border-brand-700'
                        : 'bg-surface-800 text-surface-300'
                    }`}
                  >
                    {isPrimary ? 'Primary' : `Failover #${config.priority_order}`}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3 my-4 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-surface-500 block mb-1">
                      API Key Masked
                    </label>
                    <div className="px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 font-mono text-surface-300">
                      {config.api_key_masked}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-surface-500 block mb-1">
                      Model Target
                    </label>
                    <input
                      type="text"
                      defaultValue={config.model_name}
                      onChange={(e) =>
                        updateAIConfig(config.id, { model_name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-surface-800 text-white font-mono text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Token Usage Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-surface-400">Token Terpakai</span>
                      <span className="text-surface-300 font-mono">
                        {config.tokens_used_this_month.toLocaleString()} /{' '}
                        {config.monthly_token_limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-800 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (config.tokens_used_this_month / config.monthly_token_limit) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Test Button */}
              <div className="pt-4 border-t border-surface-800 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Aktif di Cluster
                </span>

                <button
                  onClick={() => handleTestLatency(config.provider_name)}
                  disabled={testingProvider === config.provider_name}
                  className="px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 text-brand-400" />
                  <span>
                    {testingProvider === config.provider_name ? 'Menguji...' : 'Test Latensi'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
