'use client';

import React, { useState } from 'react';
import { Settings, ShieldAlert } from 'lucide-react';

export default function AdminSettings() {
  const [qualityThreshold, setQualityThreshold] = useState(60);
  const [acceptThreshold, setAcceptThreshold] = useState(75);
  const [maintenance, setMaintenance] = useState(false);

  const saveSettings = () => {
    alert('Operational settings updated successfully.');
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Settings</h1>
        <p className="text-neutral-500 text-sm mt-0.5">
          Configure backend threshold parameters and platforms flags
        </p>
      </div>

      <div className="border border-neutral-900 bg-neutral-950 p-6 rounded space-y-6 max-w-xl">
        <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-500 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span>Discovery Controls</span>
        </h2>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs text-neutral-400 font-mono">
              Accept Opportunity Threshold ({qualityThreshold})
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={qualityThreshold}
              onChange={(e) => setQualityThreshold(Number(e.target.value))}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-100"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs text-neutral-400 font-mono">
              Manual Review Threshold ({acceptThreshold})
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={acceptThreshold}
              onChange={(e) => setAcceptThreshold(Number(e.target.value))}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-100"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-900 space-y-4">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-red-500 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Danger & Platforms Maintenance</span>
          </h2>

          <div className="flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-neutral-300 block">System Maintenance Mode</span>
              <span className="text-neutral-500">
                Restricts user bookmarks and personalization routes access
              </span>
            </div>
            <button
              onClick={() => setMaintenance(!maintenance)}
              className={`px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer text-[11px] ${
                maintenance
                  ? 'bg-red-650 text-red-100'
                  : 'border border-neutral-800 text-neutral-400 hover:bg-neutral-900'
              }`}
            >
              {maintenance ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        <button
          onClick={saveSettings}
          className="mt-6 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded text-sm font-semibold transition-colors cursor-pointer"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
