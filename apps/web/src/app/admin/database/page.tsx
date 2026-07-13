'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, AlertTriangle } from 'lucide-react';

export default function AdminDatabase() {
  const [counts, setCounts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${apiHost}/api/v1/admin/status`, { withCredentials: true });
        setCounts(res.data.data.counts);
      } catch (err) {
        console.error('Failed to load database counts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-sm text-neutral-500 font-mono">Loading database stats...</div>;
  }

  const cols = [
    {
      name: 'Opportunities',
      key: 'opportunities',
      desc: 'Normalized curated opportunity listings',
    },
    {
      name: 'Users',
      key: 'users',
      desc: 'Registered user credentials and firebase mapping profiles',
    },
    {
      name: 'Discovery Runs',
      key: 'runs',
      desc: 'Historical discovery task executions and metrics log files',
    },
    {
      name: 'Scraped Pages',
      key: 'rawpages',
      desc: 'Raw HTML and Markdown outputs retrieved from Stage 2',
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Database</h1>
        <p className="text-neutral-500 text-sm mt-0.5">
          Database storage and collections sizing summaries
        </p>
      </div>

      {/* Connection info */}
      <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-2 flex items-center gap-4 max-w-xl">
        <Database className="h-5 w-5 text-emerald-500 shrink-0" />
        <div>
          <h3 className="text-xs font-semibold text-neutral-300">Active Connection Status</h3>
          <p className="text-xs text-neutral-500 font-mono">
            MongoDB Atlas (replicaSet: cluster0-shard-00)
          </p>
        </div>
      </div>

      <div className="border border-neutral-900 bg-neutral-950 rounded overflow-hidden">
        <table className="w-full text-left text-xs font-mono text-neutral-400">
          <thead className="bg-neutral-900 text-neutral-500 uppercase font-medium">
            <tr>
              <th className="p-4">Collection</th>
              <th className="p-4">Description</th>
              <th className="p-4 text-right">Document Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {cols.map((col) => (
              <tr key={col.key} className="hover:bg-neutral-900/30 transition-colors">
                <td className="p-4 font-semibold text-neutral-300">{col.name}</td>
                <td className="p-4 text-neutral-500">{col.desc}</td>
                <td className="p-4 text-right font-bold text-neutral-100">
                  {counts?.[col.key] || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
