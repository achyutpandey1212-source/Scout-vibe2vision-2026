'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Play,
  Square,
  Pause,
  ListRestart,
  RefreshCcw,
  AlertOctagon,
  LineChart,
  History,
} from 'lucide-react';

export default function AdminDiscovery() {
  const [status, setStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchState = async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const statusRes = await axios.get(`${apiHost}/api/v1/discovery/dashboard/status`, {
        withCredentials: true,
      });
      setStatus(statusRes.data.data);

      const historyRes = await axios.get(`${apiHost}/api/v1/admin/status`, {
        withCredentials: true,
      });
      setHistory(historyRes.data.data.runs || []);
    } catch (err) {
      console.error('Failed to query dashboard status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll status statistics while running
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scroll logs console to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleStart = async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(
        `${apiHost}/api/v1/discovery/dashboard/start`,
        {},
        { withCredentials: true },
      );
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Discovery job started in background...`,
      ]);
      fetchState();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to start Discovery.');
    }
  };

  const handleStop = async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(`${apiHost}/api/v1/discovery/dashboard/stop`, {}, { withCredentials: true });
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Discovery job stopped.`]);
      fetchState();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to stop Discovery.');
    }
  };

  const handleJobTrigger = async (jobName: string) => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(
        `${apiHost}/api/v1/admin/jobs/trigger`,
        { jobName },
        { withCredentials: true },
      );
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Triggered manual job execution: ${jobName}`,
      ]);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to trigger job.');
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-neutral-500 font-mono">
        Loading discovery dashboard telemetry...
      </div>
    );
  }

  const stagesList = [
    { label: 'Stage 1: Discovery', key: 'STAGE_1_DISCOVERY' },
    { label: 'Stage 2: Crawling', key: 'STAGE_2_CRAWLING' },
    { label: 'Stage 3: Extraction', key: 'STAGE_3_EXTRACTION' },
    { label: 'Stage 4: Quality Check', key: 'STAGE_4_QUALITY' },
    { label: 'Stage 5: Persistence', key: 'STAGE_5_PERSISTENCE' },
  ];

  const activeStageIdx = stagesList.findIndex((s) => s.key === status?.currentStage);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Discovery Engine</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Control indexing pipelines and inspect live run analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleStart}
            disabled={status?.isRunning}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 disabled:opacity-50 text-xs font-semibold rounded cursor-pointer transition-colors"
          >
            <Play className="h-3 w-3" />
            <span>Start Discovery</span>
          </button>
          <button
            onClick={handleStop}
            disabled={!status?.isRunning}
            className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 hover:bg-neutral-900 disabled:opacity-50 text-xs font-semibold rounded cursor-pointer transition-colors"
          >
            <Square className="h-3 w-3" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      {/* 1. Execution Grid */}
      <section className="grid grid-cols-3 gap-8">
        {/* Active Stage & Statistics */}
        <div className="col-span-2 space-y-6">
          <div className="border border-neutral-900 bg-neutral-950 p-6 rounded space-y-4">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              Pipeline Execution
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div>
                <span className="text-neutral-500">Engine Status:</span>{' '}
                <span
                  className={status?.isRunning ? 'text-emerald-500 font-bold' : 'text-neutral-400'}
                >
                  {status?.isRunning ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Current Stage:</span>{' '}
                <span className="text-neutral-100 font-medium">
                  {status?.currentStage || 'IDLE'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-neutral-500">Active Scraping URL:</span>{' '}
                <span className="text-neutral-300 truncate block max-w-full text-xs">
                  {status?.currentUrl || 'None'}
                </span>
              </div>
            </div>

            {/* Progress Bar list */}
            <div className="space-y-3 mt-6 pt-4 border-t border-neutral-900">
              {stagesList.map((stg, idx) => {
                const isCompleted = idx < activeStageIdx;
                const isCurrent = idx === activeStageIdx;
                return (
                  <div key={stg.key} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span
                        className={isCurrent ? 'text-neutral-100 font-medium' : 'text-neutral-500'}
                      >
                        {stg.label}
                      </span>
                      <span className={isCurrent ? 'text-neutral-100' : 'text-neutral-600'}>
                        {isCompleted ? '100%' : isCurrent ? 'IN_PROGRESS' : 'WAITING'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-900 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-neutral-500'
                            : isCurrent
                              ? 'bg-neutral-100'
                              : 'bg-transparent'
                        }`}
                        style={{ width: isCompleted ? '100%' : isCurrent ? '50%' : '0%' }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics counter */}
          <div className="border border-neutral-900 bg-neutral-950 p-6 rounded space-y-4">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              Live Statistics
            </h2>
            <div className="grid grid-cols-4 gap-6 text-center font-mono">
              <div className="space-y-1">
                <div className="text-neutral-500 text-xs">URLs Discovered</div>
                <div className="text-lg font-medium">{status?.urlsFound || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-neutral-500 text-xs">Pages Crawled</div>
                <div className="text-lg font-medium">{status?.pagesCrawled || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-neutral-500 text-xs">Skipped (Detector)</div>
                <div className="text-lg font-medium">{status?.detectorSkipped || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="text-neutral-500 text-xs">AI Extractions</div>
                <div className="text-lg font-medium">{status?.aiProcessed || 0}</div>
              </div>
              <div className="space-y-1 border-t border-neutral-900 pt-4">
                <div className="text-neutral-500 text-xs">Accepted</div>
                <div className="text-lg font-medium text-emerald-500">{status?.inserted || 0}</div>
              </div>
              <div className="space-y-1 border-t border-neutral-900 pt-4">
                <div className="text-neutral-500 text-xs">Merged</div>
                <div className="text-lg font-medium text-blue-500">{status?.updated || 0}</div>
              </div>
              <div className="space-y-1 border-t border-neutral-900 pt-4">
                <div className="text-neutral-500 text-xs">Archived</div>
                <div className="text-lg font-medium text-amber-500">{status?.archived || 0}</div>
              </div>
              <div className="space-y-1 border-t border-neutral-900 pt-4">
                <div className="text-neutral-500 text-xs">Failures</div>
                <div className="text-lg font-medium text-red-500">{status?.failures || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostics & Logs Console */}
        <div className="space-y-6">
          <div className="border border-neutral-900 bg-neutral-950 p-6 rounded space-y-4">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              Scheduler Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => handleJobTrigger('discovery')}
                className="w-full text-left px-3 py-2 bg-neutral-900 hover:bg-neutral-850 rounded text-xs font-mono text-neutral-300 transition-colors cursor-pointer"
              >
                $ trigger run_discovery
              </button>
              <button
                onClick={() => handleJobTrigger('archive')}
                className="w-full text-left px-3 py-2 bg-neutral-900 hover:bg-neutral-850 rounded text-xs font-mono text-neutral-300 transition-colors cursor-pointer"
              >
                $ trigger archive_expired
              </button>
            </div>
          </div>

          {/* Diagnostic Error panel */}
          {status?.firecrawlError && (
            <div className="border border-red-950 bg-red-950/10 p-5 rounded space-y-2">
              <div className="flex items-center gap-2 text-red-500 text-xs font-semibold uppercase tracking-wider">
                <AlertOctagon className="h-4 w-4" />
                <span>Crawl Warning Diagnostics</span>
              </div>
              <p className="text-xs text-neutral-400 font-mono leading-relaxed">
                {status?.firecrawlError}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 2. Logging Stream terminal */}
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-wider font-medium text-neutral-500">
          Pipeline Active Terminal Outputs
        </h2>
        <div className="h-64 border border-neutral-900 bg-neutral-950 p-5 rounded font-mono text-xs text-neutral-400 overflow-y-auto space-y-1.5 select-text">
          <div className="text-neutral-600">Terminal connection listening ...</div>
          {logs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </section>

      {/* 3. Historical Runs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider font-medium text-neutral-500">
            Pipeline Run History
          </h2>
          <History className="h-4 w-4 text-neutral-600" />
        </div>
        <div className="border border-neutral-900 bg-neutral-950 rounded overflow-hidden">
          <table className="w-full text-left text-xs font-mono text-neutral-400">
            <thead className="bg-neutral-900 text-neutral-500 uppercase font-medium">
              <tr>
                <th className="p-4">Run ID</th>
                <th className="p-4">Started At</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-center">Inserted</th>
                <th className="p-4 text-center">Merged</th>
                <th className="p-4 text-center">Failures</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {history.map((run) => (
                <tr
                  key={run._id}
                  onClick={() => setSelectedRun(run)}
                  className="hover:bg-neutral-900/50 transition-colors cursor-pointer"
                >
                  <td className="p-4 font-semibold text-neutral-300">#{run._id.substring(18)}</td>
                  <td className="p-4">{new Date(run.startedAt).toLocaleString()}</td>
                  <td className="p-4">{(run.duration || 0).toFixed(1)}s</td>
                  <td className="p-4 text-center text-emerald-500">{run.inserted}</td>
                  <td className="p-4 text-center text-blue-500">{run.updated}</td>
                  <td className="p-4 text-center text-red-500">{run.failures}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-600">
                    No run logs registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Selected Run detail overlay */}
      {selectedRun && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-8 z-50">
          <div className="border border-neutral-900 bg-neutral-950 w-full max-w-lg p-6 rounded space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-neutral-200">
                  Crawl Run Details #{selectedRun._id.substring(18)}
                </h3>
                <p className="text-neutral-500 text-xs font-mono mt-0.5">
                  run_id: {selectedRun._id}
                </p>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-neutral-500 hover:text-neutral-300 font-semibold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-400 bg-neutral-900/50 p-4 rounded">
              <div>
                Target Audience:{' '}
                <span className="text-neutral-200">{selectedRun.targetAudience}</span>
              </div>
              <div>
                Duration:{' '}
                <span className="text-neutral-200">{selectedRun.duration.toFixed(1)}s</span>
              </div>
              <div>
                Inserted: <span className="text-emerald-500">{selectedRun.inserted}</span>
              </div>
              <div>
                Merged: <span className="text-blue-500">{selectedRun.updated}</span>
              </div>
              <div>
                Failures: <span className="text-red-500">{selectedRun.failures}</span>
              </div>
              <div>
                Target Queries: <span className="text-neutral-200">{selectedRun.totalQueries}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
