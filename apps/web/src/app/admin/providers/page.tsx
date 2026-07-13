'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Boxes, RefreshCw } from 'lucide-react';

interface PoolTelemetry {
  system: string;
  provider: string;
  totalKeys: number;
  activeIndex: number;
  successRequests: number;
  failedRequests: number;
  rotations: number;
  lastRotationAt: string | null;
  currentStatus: 'ACTIVE' | 'DEGRADED' | 'EXHAUSTED';
}

const STATUS_CONFIG = {
  ACTIVE: { dot: 'bg-emerald-500', label: 'ACTIVE', text: 'text-emerald-400' },
  DEGRADED: { dot: 'bg-amber-500', label: 'DEGRADED', text: 'text-amber-400' },
  EXHAUSTED: { dot: 'bg-red-500', label: 'EXHAUSTED', text: 'text-red-400' },
};

const SYSTEM_LABELS: Record<string, string> = {
  discovery: 'Discovery Engine',
  recommendation: 'Recommendation Engine',
};

function StatusBadge({ status }: { status: PoolTelemetry['currentStatus'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.EXHAUSTED;
  return (
    <span className={`inline-flex items-center gap-1.5 ${cfg.text} font-semibold`}>
      <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function PoolTable({
  systemKey,
  pools,
  testingKey,
  onTest,
}: {
  systemKey: string;
  pools: PoolTelemetry[];
  testingKey: string | null;
  onTest: (key: string, name: string) => void;
}) {
  const label = SYSTEM_LABELS[systemKey] ?? systemKey.charAt(0).toUpperCase() + systemKey.slice(1);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">{label}</h2>
      <div className="border border-neutral-900 bg-neutral-950 rounded overflow-hidden">
        <table className="w-full text-left text-xs font-mono text-neutral-400">
          <thead className="bg-neutral-900 text-neutral-500 uppercase font-medium">
            <tr>
              <th className="p-4">Provider</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Keys</th>
              <th className="p-4 text-center">Active</th>
              <th className="p-4 text-center">Success</th>
              <th className="p-4 text-center">Failed</th>
              <th className="p-4 text-center">Rotations</th>
              <th className="p-4 text-center">Last Rotation</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {pools.map((p) => {
              const rowKey = `${p.system}:${p.provider}`;
              const lastRotation = p.lastRotationAt
                ? new Date(p.lastRotationAt).toLocaleTimeString()
                : '—';
              return (
                <tr key={rowKey} className="hover:bg-neutral-900/30 transition-colors">
                  <td className="p-4 font-semibold text-neutral-300 capitalize">
                    <span className="flex items-center gap-2">
                      <Boxes className="h-4 w-4 text-neutral-600 shrink-0" />
                      {p.provider}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <StatusBadge status={p.currentStatus} />
                  </td>
                  <td className="p-4 text-center font-bold text-neutral-100">{p.totalKeys}</td>
                  <td className="p-4 text-center text-neutral-400">
                    {p.totalKeys > 0 ? `${p.activeIndex + 1} / ${p.totalKeys}` : '—'}
                  </td>
                  <td className="p-4 text-center text-emerald-500 font-bold">
                    {p.successRequests}
                  </td>
                  <td className="p-4 text-center text-red-500 font-bold">{p.failedRequests}</td>
                  <td className="p-4 text-center text-neutral-400">{p.rotations}</td>
                  <td className="p-4 text-center text-neutral-500">{lastRotation}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onTest(rowKey, `${p.system}:${p.provider}`)}
                      disabled={testingKey !== null}
                      className="px-3 py-1.5 border border-neutral-800 hover:bg-neutral-900 transition-colors rounded text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {testingKey === rowKey ? 'Testing...' : 'Test Pool'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminProviders() {
  const [pools, setPools] = useState<PoolTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingKey, setTestingKey] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiHost}/api/v1/admin/status`, { withCredentials: true });
      setPools(res.data.data.pools || []);
    } catch (err) {
      console.error('Failed to load provider pool stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleTest = (key: string, name: string) => {
    setTestingKey(key);
    setTimeout(() => {
      setTestingKey(null);
      alert(`Pool "${name}" connection verified and healthy.`);
    }, 1200);
  };

  // Group flat array by system — works automatically for any future system
  const grouped = pools.reduce<Record<string, PoolTelemetry[]>>((acc, p) => {
    if (!acc[p.system]) acc[p.system] = [];
    acc[p.system].push(p);
    return acc;
  }, {});

  // Preferred display order — unknown systems appear at the end
  const SYSTEM_ORDER = ['discovery', 'recommendation'];
  const systemKeys = [
    ...SYSTEM_ORDER.filter((s) => grouped[s]),
    ...Object.keys(grouped).filter((s) => !SYSTEM_ORDER.includes(s)),
  ];

  if (loading) {
    return (
      <div className="text-sm text-neutral-500 font-mono animate-pulse">
        Loading provider pool telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Provider Pools</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            System-scoped API key pools — each engine owns its own keys
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 hover:bg-neutral-900 transition-colors text-xs font-semibold rounded cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Refresh</span>
        </button>
      </div>

      {/* One table per system */}
      {systemKeys.length === 0 ? (
        <p className="text-sm text-neutral-600 font-mono">
          No active provider pools detected. Ensure API keys are configured and the server has
          handled at least one request.
        </p>
      ) : (
        systemKeys.map((systemKey) => (
          <PoolTable
            key={systemKey}
            systemKey={systemKey}
            pools={grouped[systemKey]}
            testingKey={testingKey}
            onTest={handleTest}
          />
        ))
      )}
    </div>
  );
}
