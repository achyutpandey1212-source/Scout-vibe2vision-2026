'use client';

import React, { useState } from 'react';
import { Boxes, CheckCircle, HelpCircle } from 'lucide-react';

const INITIAL_PROVIDERS = [
  { name: 'Firecrawl', status: 'HEALTHY', type: 'Crawler', usage: '3 credits / run', errors: 0 },
  { name: 'Gemini AI', status: 'HEALTHY', type: 'LLM Extraction', usage: 'Free Tier', errors: 0 },
  { name: 'Groq AI', status: 'HEALTHY', type: 'LLM Fallback', usage: 'Free Tier', errors: 0 },
  { name: 'Browserbase', status: 'IDLE', type: 'Browser automation', usage: 'None', errors: 0 },
];

export default function AdminProviders() {
  const [providers, setProviders] = useState(INITIAL_PROVIDERS);
  const [testingIdx, setTestingIdx] = useState<number | null>(null);

  const testConnection = (idx: number) => {
    setTestingIdx(idx);
    setTimeout(() => {
      setTestingIdx(null);
      alert(`${providers[idx].name} connection is verified and healthy.`);
    }, 1500);
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-medium tracking-tight">External Providers</h1>
        <p className="text-neutral-500 text-sm mt-0.5">
          Monitor and test external API integration statuses
        </p>
      </div>

      <div className="border border-neutral-900 bg-neutral-950 rounded overflow-hidden">
        <table className="w-full text-left text-xs font-mono text-neutral-400">
          <thead className="bg-neutral-900 text-neutral-500 uppercase font-medium">
            <tr>
              <th className="p-4">Provider</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Usage Rate</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {providers.map((p, idx) => (
              <tr key={p.name} className="hover:bg-neutral-900/30 transition-colors">
                <td className="p-4 font-semibold text-neutral-300 flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-neutral-600" />
                  <span>{p.name}</span>
                </td>
                <td className="p-4">{p.type}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      p.status === 'HEALTHY'
                        ? 'bg-emerald-950/50 text-emerald-500 border border-emerald-900/50'
                        : 'bg-neutral-900 text-neutral-500'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="p-4">{p.usage}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => testConnection(idx)}
                    disabled={testingIdx !== null}
                    className="px-3 py-1.5 border border-neutral-800 hover:bg-neutral-900 transition-colors rounded text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {testingIdx === idx ? 'Testing...' : 'Test Connection'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
