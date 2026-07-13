'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Connect to express server admin login route
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(`${apiHost}/api/v1/admin/login`, { password }, { withCredentials: true });
      router.push('/admin/overview');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Incorrect secure credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center font-sans px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-medium tracking-tight">Scout Operations</h1>
          <p className="text-neutral-500 text-sm mt-1">Authenticate to access control panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5 font-medium">
              Operations Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
              className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded text-neutral-100 placeholder-neutral-700 text-sm focus:outline-none focus:border-neutral-700 disabled:opacity-50 transition-colors"
            />
          </div>

          {error && (
            <div className="text-xs text-red-500 bg-red-950/20 border border-red-900/50 p-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded text-sm font-medium disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Enter Operations'}
          </button>
        </form>
      </div>
    </main>
  );
}
