'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Database, Zap, Cpu, RefreshCcw } from 'lucide-react';

export default function AdminOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiHost}/api/v1/admin/status`, { withCredentials: true });
      setData(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch platform health metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return <div className="text-sm text-neutral-500 font-mono">Loading operations status...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 bg-red-950/20 border border-red-900 p-4 rounded">
        {error}
      </div>
    );
  }

  const { health, counts } = data || {};

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Overview</h1>
        <p className="text-neutral-500 text-sm mt-0.5">Scout platforms operational status check</p>
      </div>

      {/* 1. Status Grid */}
      <section className="grid grid-cols-4 gap-6">
        <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs uppercase tracking-wider font-medium">Core Server</span>
            <Zap className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-lg font-medium text-neutral-100">Healthy</div>
            <p className="text-xs text-neutral-600 font-mono mt-0.5">status_code: 200</p>
          </div>
        </div>

        <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs uppercase tracking-wider font-medium">Database (MongoDB)</span>
            <Database className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-lg font-medium text-neutral-100 uppercase">{health?.database}</div>
            <p className="text-xs text-neutral-600 font-mono mt-0.5">connection: persistent</p>
          </div>
        </div>

        <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs uppercase tracking-wider font-medium">Cache (Redis)</span>
            <Cpu className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-lg font-medium text-neutral-100 uppercase">{health?.redis}</div>
            <p className="text-xs text-neutral-600 font-mono mt-0.5">upstash: connected</p>
          </div>
        </div>

        <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs uppercase tracking-wider font-medium">
              Background Scheduler
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-lg font-medium text-neutral-100 uppercase">
              {health?.scheduler}
            </div>
            <p className="text-xs text-neutral-600 font-mono mt-0.5">tasks: running</p>
          </div>
        </div>
      </section>

      {/* 2. Platform Statistics */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-wider font-medium text-neutral-500">
          Platform Database Statistics
        </h2>
        <div className="grid grid-cols-4 gap-6 border border-neutral-900 bg-neutral-950/40 p-6 rounded">
          <div className="space-y-1">
            <div className="text-neutral-500 text-xs font-medium">Total Opportunities</div>
            <div className="text-2xl font-mono text-neutral-100">{counts?.opportunities}</div>
          </div>
          <div className="space-y-1">
            <div className="text-neutral-500 text-xs font-medium">Total Registered Users</div>
            <div className="text-2xl font-mono text-neutral-100">{counts?.users}</div>
          </div>
          <div className="space-y-1">
            <div className="text-neutral-500 text-xs font-medium">Completed Crawl Runs</div>
            <div className="text-2xl font-mono text-neutral-100">{counts?.runs}</div>
          </div>
          <div className="space-y-1">
            <div className="text-neutral-500 text-xs font-medium">Scraped Raw Pages</div>
            <div className="text-2xl font-mono text-neutral-100">{counts?.rawpages}</div>
          </div>
        </div>
      </section>

      {/* 3. Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-wider font-medium text-neutral-500">
          Quick Actions
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchStatus}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-850 hover:bg-neutral-900/50 transition-colors text-sm rounded font-medium cursor-pointer"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh Operations Health</span>
          </button>
        </div>
      </section>
    </div>
  );
}
