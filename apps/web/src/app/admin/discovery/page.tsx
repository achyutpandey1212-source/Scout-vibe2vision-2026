'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Play,
  Square,
  RefreshCcw,
  AlertOctagon,
  LineChart,
  History,
  Shield,
  Layers,
  Database,
  TrendingUp,
  Cpu,
  Globe,
  Settings,
  Search,
  CheckCircle,
  HelpCircle,
  BarChart,
  ExternalLink,
} from 'lucide-react';

export default function AdminDiscoveryControlCenter() {
  const [activeTab, setActiveTab] = useState<'health' | 'source' | 'daily' | 'metrics'>('daily');
  const [status, setStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Weekly Logs & Daily Pipeline Logs state
  const [weeklyLogs, setWeeklyLogs] = useState<string[]>([]);
  const [dailyLogs, setDailyLogs] = useState<string[]>([]);

  // Daily Mode Start controls
  const [runMode, setRunMode] = useState<'due' | 'all' | 'high-priority' | 'category' | 'custom'>(
    'due',
  );
  const [runCategory, setRunCategory] = useState<string>('TECH_CAREERS');
  const [customDomainsInput, setCustomDomainsInput] = useState<string>('');

  // Weekly setup overrides
  const [totalBatches, setTotalBatches] = useState<number>(6);
  const [batchSize, setBatchSize] = useState<number>(5);

  // Registry pagination/filtering
  const [sourcesList, setSourcesList] = useState<any[]>([]);
  const [sourcesCount, setSourcesCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const weeklyLogsEndRef = useRef<HTMLDivElement>(null);
  const dailyLogsEndRef = useRef<HTMLDivElement>(null);

  const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchRegistrySources = async () => {
    try {
      const res = await axios.get(`${apiHost}/api/v1/discovery/sources`, {
        params: {
          category: categoryFilter || undefined,
          isActive: undefined,
          page,
          limit: 10,
        },
        withCredentials: true,
      });
      // Handle clientside search query filter since endpoint only filters by category
      let filtered = res.data.data.sources || [];
      if (searchQuery.trim() !== '') {
        const term = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (s: any) =>
            s.domain.includes(term) ||
            s.organization.toLowerCase().includes(term) ||
            (s.reason && s.reason.toLowerCase().includes(term)),
        );
      }
      setSourcesList(filtered);
      setSourcesCount(res.data.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch registry sources:', err);
    }
  };

  const fetchState = async () => {
    try {
      const statusRes = await axios.get(`${apiHost}/api/v1/discovery/dashboard/status`, {
        withCredentials: true,
      });
      setStatus(statusRes.data.data);

      const historyRes = await axios.get(`${apiHost}/api/v1/admin/status`, {
        withCredentials: true,
      });
      setHistory(historyRes.data.data.runs || []);

      const metricsRes = await axios.get(`${apiHost}/api/v1/discovery/dashboard/metrics`, {
        withCredentials: true,
      });
      setMetrics(metricsRes.data.data);
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

  // Sync registry source listings whenever page, search or category filter updates
  useEffect(() => {
    fetchRegistrySources();
  }, [page, searchQuery, categoryFilter]);

  // Scroll consoles to bottom when new logs streaming updates
  useEffect(() => {
    weeklyLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [weeklyLogs]);

  useEffect(() => {
    dailyLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dailyLogs]);

  const handleStartDaily = async () => {
    try {
      const customDomains = customDomainsInput
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      await axios.post(
        `${apiHost}/api/v1/discovery/dashboard/run-daily`,
        {
          runMode,
          category: runMode === 'category' ? runCategory : undefined,
          customDomains: runMode === 'custom' ? customDomains : undefined,
        },
        { withCredentials: true },
      );
      setDailyLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Starting Daily Opportunity Discovery Pipeline (Mode: ${runMode.toUpperCase()})...`,
      ]);
      fetchState();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to start Daily Discovery pipeline.');
    }
  };

  const handleStartWeekly = async () => {
    try {
      setWeeklyLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Initializing Weekly Source Discovery Engine...`,
        `Configured query target: ${totalBatches} batches × ${batchSize} queries = ${totalBatches * batchSize} meta-searches.`,
      ]);
      await axios.post(
        `${apiHost}/api/v1/discovery/dashboard/run-weekly`,
        { totalBatches, batchSize },
        { withCredentials: true },
      );
      fetchState();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to start Source Discovery Engine.');
    }
  };

  const handleStartAffiliates = async () => {
    try {
      setWeeklyLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Triggering manual affiliate queue evaluation...`,
      ]);
      await axios.post(
        `${apiHost}/api/v1/discovery/dashboard/run-affiliates`,
        {},
        { withCredentials: true },
      );
      fetchState();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to evaluate affiliates.');
    }
  };

  const handleStopDaily = async () => {
    try {
      await axios.post(`${apiHost}/api/v1/discovery/dashboard/stop`, {}, { withCredentials: true });
      setDailyLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Daily crawl pipeline cancelled.`,
      ]);
      fetchState();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel daily crawl pipeline.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-sm text-neutral-500 font-mono">
        <RefreshCcw className="animate-spin h-4 w-4 mr-2" />
        Resolving system metrics and Source Registry coverage...
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
    <div className="space-y-8 select-none">
      {/* Platform Title */}
      <div className="flex items-center justify-between border-b border-neutral-900 pb-5">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-neutral-100">
            Scout Operations Control Center
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            Opportunity Intelligence Network: Weekly Knowledge Base Seeding vs Daily Pipeline
            Automation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-xs text-emerald-500 font-mono uppercase tracking-wider font-semibold">
            Active Node
          </span>
        </div>
      </div>

      {/* ─── SYSTEM HEALTH (ALWAYS VISIBLE) ─── */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div className="border border-neutral-900 bg-neutral-950/40 p-4 rounded flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
            Registry Size
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-medium text-neutral-100">
              {status?.registry?.registrySize || 0}
            </span>
            <span className="text-[10px] text-neutral-500">domains</span>
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-1.5 border-t border-neutral-900/60 pt-1.5">
            <Database className="h-3 w-3 text-neutral-600" />
            <span>Seed + Organic</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="border border-neutral-900 bg-neutral-950/40 p-4 rounded flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
            Active Sources
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-medium text-emerald-500">
              {status?.registry?.activeSources || 0}
            </span>
            <span className="text-[10px] text-emerald-500/80">🟢 Healthy</span>
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-1.5 border-t border-neutral-900/60 pt-1.5">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            <span>Auto-scheduled</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="border border-neutral-900 bg-neutral-950/40 p-4 rounded flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
            Sources Due Today
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-medium text-neutral-100">
              {status?.registry?.sourcesDueToday || 0}
            </span>
            <span className="text-[10px] text-neutral-500">pending</span>
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-1.5 border-t border-neutral-900/60 pt-1.5">
            <Globe className="h-3 w-3 text-neutral-600" />
            <span>Coverage Queue</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="border border-neutral-900 bg-neutral-950/40 p-4 rounded flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
            Affiliate Queue Depth
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-medium text-blue-400">
              {status?.registry?.affiliateQueueDepth || 0}
            </span>
            <span className="text-[10px] text-neutral-500">queued</span>
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-1.5 border-t border-neutral-900/60 pt-1.5">
            <TrendingUp className="h-3 w-3 text-blue-600" />
            <span>Organic Growth</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="border border-neutral-900 bg-neutral-950/40 p-4 rounded flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
            Weekly Status
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold font-mono text-neutral-300">IDLE</span>
            <span className="text-[10px] text-emerald-500">🟢 Standby</span>
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-1.5 border-t border-neutral-900/60 pt-1.5">
            <Cpu className="h-3 w-3 text-neutral-600" />
            <span>Registry Seeding</span>
          </div>
        </div>

        {/* Card 6 */}
        <div className="border border-neutral-900 bg-neutral-950/40 p-4 rounded flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
            Daily Pipeline Status
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold font-mono text-emerald-400">
              {status?.isRunning ? 'RUNNING' : 'IDLE'}
            </span>
            <span
              className={
                status?.isRunning
                  ? 'text-amber-500 font-bold text-[10px] animate-pulse'
                  : 'text-neutral-500 text-[10px]'
              }
            >
              {status?.isRunning ? '🟡 Active' : '🟢 Ready'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-neutral-400 flex items-center gap-1.5 border-t border-neutral-900/60 pt-1.5">
            <Layers className="h-3 w-3 text-neutral-600" />
            <span>Crawl Execution</span>
          </div>
        </div>
      </section>

      {/* Registry Coverage KPI Banner */}
      <section className="bg-neutral-950 border border-neutral-900 rounded p-4 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Registry Coverage KPI:</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              Total Active:{' '}
              <span className="text-neutral-200">{status?.registry?.activeSources || 0}</span>
            </div>
            <div className="text-neutral-700">|</div>
            <div>
              Today Due:{' '}
              <span className="text-neutral-200">{status?.registry?.sourcesDueToday || 0}</span>
            </div>
            <div className="text-neutral-700">|</div>
            <div>
              Already Crawled:{' '}
              <span className="text-emerald-500 font-bold">
                {status?.registry?.sourcesCrawledToday || 0}
              </span>
            </div>
            <div className="text-neutral-700">|</div>
            <div>
              Remaining Queue:{' '}
              <span className="text-amber-500 font-bold">
                {status?.registry?.remainingToday || 0}
              </span>
            </div>
          </div>
        </div>
        <div className="text-neutral-500 flex items-center gap-1 text-[10px]">
          <HelpCircle className="h-3.5 w-3.5 text-neutral-600" />
          <span>Derived from live crawler registry logs</span>
        </div>
      </section>

      {/* ─── TAB SELECTION CONTROLS ─── */}
      <div className="flex items-center border-b border-neutral-900 gap-6">
        <button
          onClick={() => setActiveTab('daily')}
          className={`pb-3 text-xs font-mono tracking-wider uppercase font-semibold cursor-pointer border-b-2 transition-all ${
            activeTab === 'daily'
              ? 'border-neutral-100 text-neutral-100'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Daily Discovery Engine
        </button>
        <button
          onClick={() => setActiveTab('source')}
          className={`pb-3 text-xs font-mono tracking-wider uppercase font-semibold cursor-pointer border-b-2 transition-all ${
            activeTab === 'source'
              ? 'border-neutral-100 text-neutral-100'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Source Intelligence
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 text-xs font-mono tracking-wider uppercase font-semibold cursor-pointer border-b-2 transition-all ${
            activeTab === 'metrics'
              ? 'border-neutral-100 text-neutral-100'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Intelligence Analytics
        </button>
      </div>

      {/* ─── TAB 1: DAILY OPPORTUNITY DISCOVERY ─── */}
      {activeTab === 'daily' && (
        <section className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls Console */}
            <div className="col-span-1 space-y-6">
              <div className="border border-neutral-900 bg-neutral-950/80 p-5 rounded space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-900/60 pb-3">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                    Pipeline Scheduler Mode
                  </h3>
                  <Settings className="h-4 w-4 text-neutral-600" />
                </div>

                <div className="space-y-3 font-mono text-xs text-neutral-400">
                  {/* Mode Selector */}
                  <div className="space-y-2">
                    <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                      Select Run Mode:
                    </span>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                        <input
                          type="radio"
                          name="runMode"
                          checked={runMode === 'due'}
                          onChange={() => setRunMode('due')}
                          disabled={status?.isRunning}
                          className="accent-neutral-100"
                        />
                        <span>Due Today ({status?.registry?.sourcesDueToday || 0} scheduled)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                        <input
                          type="radio"
                          name="runMode"
                          checked={runMode === 'all'}
                          onChange={() => setRunMode('all')}
                          disabled={status?.isRunning}
                          className="accent-neutral-100"
                        />
                        <span>All Sources ({status?.registry?.registrySize || 0} total)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                        <input
                          type="radio"
                          name="runMode"
                          checked={runMode === 'high-priority'}
                          onChange={() => setRunMode('high-priority')}
                          disabled={status?.isRunning}
                          className="accent-neutral-100"
                        />
                        <span>High Priority (Critical/High only)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                        <input
                          type="radio"
                          name="runMode"
                          checked={runMode === 'category'}
                          onChange={() => setRunMode('category')}
                          disabled={status?.isRunning}
                          className="accent-neutral-100"
                        />
                        <span>Filter by Category</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                        <input
                          type="radio"
                          name="runMode"
                          checked={runMode === 'custom'}
                          onChange={() => setRunMode('custom')}
                          disabled={status?.isRunning}
                          className="accent-neutral-100"
                        />
                        <span>Custom Domain list</span>
                      </label>
                    </div>
                  </div>

                  {/* Mode dependent forms */}
                  {runMode === 'category' && (
                    <div className="space-y-1.5 border-t border-neutral-900/60 pt-3">
                      <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                        Select Category:
                      </span>
                      <select
                        value={runCategory}
                        onChange={(e) => setRunCategory(e.target.value)}
                        disabled={status?.isRunning}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
                      >
                        <option value="TECH_CAREERS">Tech Careers</option>
                        <option value="WOMEN_IN_TECH">Women in Tech</option>
                        <option value="SCHOLARSHIPS">Scholarships</option>
                        <option value="FELLOWSHIPS">Fellowships</option>
                        <option value="GOVERNMENT">Government Schemes</option>
                        <option value="HACKATHONS">Hackathons</option>
                        <option value="ENTREPRENEURSHIP">Entrepreneurship</option>
                        <option value="RESEARCH">Research</option>
                        <option value="SKILL_DEVELOPMENT">Skill Development</option>
                        <option value="GENERAL">General</option>
                      </select>
                    </div>
                  )}

                  {runMode === 'custom' && (
                    <div className="space-y-1.5 border-t border-neutral-900/60 pt-3">
                      <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                        Domains (comma-separated):
                      </span>
                      <input
                        type="text"
                        placeholder="anitab.org, google.com"
                        value={customDomainsInput}
                        onChange={(e) => setCustomDomainsInput(e.target.value)}
                        disabled={status?.isRunning}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 outline-none font-mono"
                      />
                    </div>
                  )}

                  {/* Submit Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-neutral-900">
                    <button
                      onClick={handleStartDaily}
                      disabled={status?.isRunning}
                      className="flex items-center justify-center gap-1.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 disabled:opacity-50 text-xs font-semibold rounded cursor-pointer transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Start Crawl</span>
                    </button>
                    <button
                      onClick={handleStopDaily}
                      disabled={!status?.isRunning}
                      className="flex items-center justify-center gap-1.5 py-2 border border-neutral-850 hover:bg-neutral-900 text-neutral-400 disabled:opacity-50 text-xs font-semibold rounded cursor-pointer transition-colors"
                    >
                      <Square className="h-3.5 w-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Warning Diagnostics console */}
              {status?.firecrawlError && (
                <div className="border border-red-950 bg-red-950/15 p-5 rounded space-y-2">
                  <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                    <AlertOctagon className="h-4 w-4" />
                    <span>Crawl Warn Log</span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono leading-relaxed select-text">
                    {status?.firecrawlError}
                  </p>
                </div>
              )}
            </div>

            {/* Run Stage Progress Tracking */}
            <div className="col-span-2 space-y-6">
              <div className="border border-neutral-900 bg-neutral-950 p-6 rounded space-y-4">
                <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
                  Pipeline Crawl Execution
                </h2>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-400">
                  <div>
                    Status:{' '}
                    <span
                      className={
                        status?.isRunning ? 'text-emerald-400 font-bold' : 'text-neutral-400'
                      }
                    >
                      {status?.isRunning ? 'RUNNING' : 'IDLE'}
                    </span>
                  </div>
                  <div>
                    Current Stage:{' '}
                    <span className="text-neutral-200">{status?.currentStage || 'IDLE'}</span>
                  </div>
                  <div className="col-span-2 border-t border-neutral-900 pt-2 text-[11px] truncate">
                    Active Target:{' '}
                    <span className="text-neutral-300">{status?.currentUrl || 'None'}</span>
                  </div>
                </div>

                {/* Progress bar lists */}
                <div className="space-y-4 mt-6 pt-4 border-t border-neutral-900">
                  {stagesList.map((stg, idx) => {
                    const isCompleted = idx < activeStageIdx;
                    const isCurrent = idx === activeStageIdx;
                    return (
                      <div key={stg.key} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span
                            className={
                              isCurrent ? 'text-neutral-100 font-bold' : 'text-neutral-500'
                            }
                          >
                            {stg.label}
                          </span>
                          <span className={isCurrent ? 'text-neutral-100' : 'text-neutral-600'}>
                            {isCompleted ? '100% (Completed)' : isCurrent ? 'RUNNING' : 'WAITING'}
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

              {/* Crawl metrics breakdown */}
              <div className="border border-neutral-900 bg-neutral-950 p-6 rounded space-y-4">
                <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
                  Crawl Metrics
                </h2>
                <div className="grid grid-cols-4 gap-6 text-center font-mono select-text">
                  <div className="space-y-1">
                    <div className="text-neutral-500 text-[10px] uppercase font-bold">
                      Stage 1: URLs Discovered
                    </div>
                    <div className="text-lg font-medium text-neutral-100">
                      {status?.urlsFound || 0}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-neutral-500 text-[10px] uppercase font-bold">
                      Stage 2: Pages Crawled
                    </div>
                    <div className="text-lg font-medium text-neutral-100">
                      {status?.pagesCrawled || 0}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-neutral-500 text-[10px] uppercase font-bold">
                      Stage 3: Relevant Pages
                    </div>
                    <div className="text-lg font-medium text-emerald-400">
                      {status?.aiProcessed || 0}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-neutral-500 text-[10px] uppercase font-bold">
                      Stage 3: Skipped
                    </div>
                    <div className="text-lg font-medium text-neutral-500">
                      {status?.detectorSkipped || 0}
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-neutral-900 pt-4">
                    <div className="text-neutral-500 text-[10px] uppercase font-bold">
                      Stage 4: Accepted
                    </div>
                    <div className="text-lg font-medium text-emerald-500">
                      {status?.inserted || 0}
                    </div>
                  </div>
                  <div className="space-y-1 border-t border-neutral-900 pt-4">
                    <div className="text-neutral-500 text-[10px] uppercase font-bold">
                      Stage 5: Duplicates Merged
                    </div>
                    <div className="text-lg font-medium text-blue-500">{status?.updated || 0}</div>
                  </div>
                  <div className="space-y-1 border-t border-neutral-900 pt-4">
                    <div className="text-neutral-500 text-[10px] uppercase font-bold">
                      Stage 5: Archived
                    </div>
                    <div className="text-lg font-medium text-amber-500">
                      {status?.archived || 0}
                    </div>
                  </div>
                  <div className="space-y-1 border-t border-neutral-900 pt-4">
                    <div className="text-neutral-500 text-[10px] uppercase font-bold">
                      Stage 5: Failures
                    </div>
                    <div className="text-lg font-medium text-red-500">{status?.failures || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Console Log */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              Live Crawl Console
            </h3>
            <div className="h-64 border border-neutral-900 bg-neutral-950 p-5 rounded font-mono text-xs text-neutral-400 overflow-y-auto space-y-1.5 select-text">
              <div className="text-neutral-600">Daily engine stream interface listening...</div>
              {dailyLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
              <div ref={dailyLogsEndRef} />
            </div>
          </div>

          {/* Runs history */}
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              Crawl Pipeline History
            </h2>
            <div className="border border-neutral-900 bg-neutral-950 rounded overflow-hidden">
              <table className="w-full text-left text-xs font-mono text-neutral-450">
                <thead className="bg-neutral-900/60 text-neutral-500 uppercase font-bold">
                  <tr>
                    <th className="p-4">Run ID</th>
                    <th className="p-4">Started At</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4 text-center">Inserted</th>
                    <th className="p-4 text-center">Merged</th>
                    <th className="p-4 text-center">Failures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 select-text">
                  {history.map((run) => (
                    <tr
                      key={run._id}
                      onClick={() => setSelectedRun(run)}
                      className="hover:bg-neutral-900/40 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-semibold text-neutral-300">
                        #{run._id.substring(18)}
                      </td>
                      <td className="p-4">{new Date(run.startedAt).toLocaleString()}</td>
                      <td className="p-4">{(run.duration || 0).toFixed(1)}s</td>
                      <td className="p-4 text-center text-emerald-500">{run.inserted}</td>
                      <td className="p-4 text-center text-blue-500">{run.updated}</td>
                      <td className="p-4 text-center text-red-500">{run.failures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Detail modal */}
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
                    className="text-neutral-500 hover:text-neutral-300 font-semibold cursor-pointer text-xs"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-400 bg-neutral-900/50 p-4 rounded select-text">
                  <div>
                    Target: <span className="text-neutral-200">{selectedRun.targetAudience}</span>
                  </div>
                  <div>
                    Duration:{' '}
                    <span className="text-neutral-200">{selectedRun.duration.toFixed(1)}s</span>
                  </div>
                  <div>
                    Inserted:{' '}
                    <span className="text-emerald-500 font-bold">{selectedRun.inserted}</span>
                  </div>
                  <div>
                    Merged: <span className="text-blue-500 font-bold">{selectedRun.updated}</span>
                  </div>
                  <div>
                    Failures: <span className="text-red-500 font-bold">{selectedRun.failures}</span>
                  </div>
                  <div>
                    Sources target count:{' '}
                    <span className="text-neutral-200">{selectedRun.totalQueries}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─── TAB 2: SOURCE INTELLIGENCE (WEEKLY ENGINE) ─── */}
      {activeTab === 'source' && (
        <section className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Run controls / Params */}
            <div className="col-span-1 border border-neutral-900 bg-neutral-950 p-5 rounded space-y-5">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 border-b border-neutral-900 pb-3">
                Weekly Seeding Engine Controls
              </h3>

              <div className="space-y-4 font-mono text-xs text-neutral-400">
                <div className="space-y-1.5">
                  <label className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                    Discovery Batches:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={totalBatches}
                    onChange={(e) => setTotalBatches(parseInt(e.target.value, 10))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
                  />
                  <span className="text-[10px] text-neutral-500">
                    Each batch runs Tavily search calls
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                    Batch Size (Queries):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-neutral-900">
                  <button
                    onClick={handleStartWeekly}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold rounded cursor-pointer transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Run Weekly Discovery</span>
                  </button>
                  <button
                    onClick={handleStartAffiliates}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs font-semibold rounded cursor-pointer transition-colors"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    <span>
                      Evaluate Affiliate Queue ({status?.registry?.affiliateQueueDepth || 0})
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Registry overview status breakdown cards */}
            <div className="col-span-2 border border-neutral-900 bg-neutral-950 p-6 rounded space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
                Registry Overview
              </h3>
              <div className="grid grid-cols-4 gap-6 text-center font-mono">
                <div className="space-y-1">
                  <div className="text-neutral-500 text-[10px] uppercase font-bold">
                    Total sources
                  </div>
                  <div className="text-lg font-medium text-neutral-100">
                    {metrics?.byCategory
                      ? (Object.values(metrics.byCategory).reduce(
                          (a: any, b: any) => a + b,
                          0,
                        ) as number)
                      : status?.registry?.registrySize || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-neutral-500 text-[10px] uppercase font-bold">Active</div>
                  <div className="text-lg font-medium text-emerald-400">
                    {status?.registry?.activeSources || 0}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-neutral-500 text-[10px] uppercase font-bold">
                    Inactive / Blocked
                  </div>
                  <div className="text-lg font-medium text-red-500">
                    {Math.max(
                      0,
                      (status?.registry?.registrySize || 0) -
                        (status?.registry?.activeSources || 0),
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-neutral-500 text-[10px] uppercase font-bold">
                    Avg Opportunity Yield
                  </div>
                  <div className="text-lg font-medium text-blue-400">
                    {metrics?.topSources?.length > 0
                      ? `${((metrics.topSources.reduce((acc: any, s: any) => acc + (s.opportunityDensity || 0), 0) / metrics.topSources.length) * 100).toFixed(0)}%`
                      : '0%'}
                  </div>
                </div>
              </div>

              {/* Priority categories */}
              <div className="grid grid-cols-2 gap-4 border-t border-neutral-900 pt-4 text-xs font-mono text-neutral-400">
                <div className="space-y-1.5">
                  <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider block">
                    Priority Classification counts:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex justify-between border-b border-neutral-900/60 pb-1">
                      <span className="text-red-400">Critical:</span>
                      <span className="text-neutral-200">5</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900/60 pb-1">
                      <span className="text-amber-400">High:</span>
                      <span className="text-neutral-200">8</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900/60 pb-1">
                      <span className="text-blue-400">Medium:</span>
                      <span className="text-neutral-200">4</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900/60 pb-1">
                      <span className="text-neutral-500">Low:</span>
                      <span className="text-neutral-200">0</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider block">
                    Source Types:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex justify-between border-b border-neutral-900/60 pb-1">
                      <span>Organization:</span>
                      <span className="text-neutral-200">12</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900/60 pb-1">
                      <span>Platform:</span>
                      <span className="text-neutral-200">3</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900/60 pb-1">
                      <span>Government:</span>
                      <span className="text-neutral-200">1</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-900/60 pb-1">
                      <span>Research:</span>
                      <span className="text-neutral-200">1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Console Logs */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
              Weekly Seeding Logs console
            </h3>
            <div className="h-64 border border-neutral-900 bg-neutral-950 p-5 rounded font-mono text-xs text-neutral-400 overflow-y-auto space-y-1.5 select-text">
              <div className="text-neutral-600">Weekly engine run viewport stream listening...</div>
              {weeklyLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
              <div ref={weeklyLogsEndRef} />
            </div>
          </div>

          {/* Source Registry Table */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
                Registry Source Database
              </h3>

              {/* Filter interface */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-600" />
                  <input
                    type="text"
                    placeholder="Search domain..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="pl-8 pr-2.5 py-1 bg-neutral-950 border border-neutral-850 rounded text-xs text-neutral-200 outline-none w-44 font-mono"
                  />
                </div>
                {/* Category selector */}
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-neutral-950 border border-neutral-850 rounded px-2.5 py-1 text-xs text-neutral-300 outline-none font-mono"
                >
                  <option value="">All Categories</option>
                  <option value="TECH_CAREERS">Tech Careers</option>
                  <option value="WOMEN_IN_TECH">Women in Tech</option>
                  <option value="SCHOLARSHIPS">Scholarships</option>
                  <option value="FELLOWSHIPS">Fellowships</option>
                  <option value="GOVERNMENT">Government Schemes</option>
                  <option value="HACKATHONS">Hackathons</option>
                  <option value="ENTREPRENEURSHIP">Entrepreneurship</option>
                  <option value="RESEARCH">Research</option>
                  <option value="SKILL_DEVELOPMENT">Skill Development</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>
            </div>

            <div className="border border-neutral-900 bg-neutral-950 rounded overflow-hidden">
              <table className="w-full text-left text-xs font-mono text-neutral-450">
                <thead className="bg-neutral-900/60 text-neutral-500 uppercase font-bold">
                  <tr>
                    <th className="p-4">Organization</th>
                    <th className="p-4">Domain</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Priority</th>
                    <th className="p-4 text-center">Trust Score</th>
                    <th className="p-4 text-center">Density</th>
                    <th className="p-4">Last Crawled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 select-text">
                  {sourcesList.map((source) => (
                    <tr key={source.domain} className="hover:bg-neutral-900/30 transition-colors">
                      <td className="p-4 font-semibold text-neutral-300 flex items-center gap-1">
                        <span>{source.organization}</span>
                        <a
                          href={source.homepage}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-600 hover:text-neutral-400"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="p-4 text-neutral-450">{source.domain}</td>
                      <td className="p-4">
                        <span className="text-[10px] border border-neutral-850 px-2 py-0.5 rounded bg-neutral-900/40 text-neutral-300">
                          {source.category}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                            source.priority === 'critical'
                              ? 'bg-red-950/40 text-red-400 border border-red-900/30'
                              : source.priority === 'high'
                                ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                                : 'bg-neutral-900 text-neutral-400'
                          }`}
                        >
                          {source.priority}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-neutral-200">
                        {source.trustScore}/100
                      </td>
                      <td className="p-4 text-center text-blue-400 font-semibold">
                        {(source.opportunityDensity * 100).toFixed(0)}%
                      </td>
                      <td className="p-4 text-neutral-500">
                        {source.lastCrawledAt
                          ? new Date(source.lastCrawledAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                    </tr>
                  ))}
                  {sourcesList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-neutral-600">
                        No registry sources matching search filter domain.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sourcesCount > 10 && (
              <div className="flex justify-end gap-2 text-xs font-mono">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 disabled:opacity-50 text-neutral-300 rounded cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-neutral-500 flex items-center">
                  Page {page} of {Math.ceil(sourcesCount / 10)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(sourcesCount / 10)}
                  className="px-3 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 disabled:opacity-50 text-neutral-300 rounded cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── TAB 3: INTELLIGENCE ANALYTICS ─── */}
      {activeTab === 'metrics' && (
        <section className="space-y-6 animate-fadeIn font-mono text-xs text-neutral-450">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top performing sources */}
            <div className="border border-neutral-900 bg-neutral-950 p-6 rounded space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                  Top Performing Registry Sources
                </h3>
                <TrendingUp className="h-4 w-4 text-neutral-600" />
              </div>
              <div className="space-y-3">
                {(metrics?.topSources || []).map((s: any, idx: number) => (
                  <div
                    key={s.domain}
                    className="flex items-center justify-between border-b border-neutral-900/60 pb-2"
                  >
                    <div className="space-y-0.5">
                      <div className="text-neutral-250 font-bold flex items-center gap-1.5">
                        <span className="text-neutral-500">#{idx + 1}</span>
                        <span>{s.organization}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500">{s.domain}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold">
                        {s.totalOpportunitiesFound} opportunities
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        {(s.opportunityDensity * 100).toFixed(0)}% extraction yield
                      </span>
                    </div>
                  </div>
                ))}
                {(!metrics?.topSources || metrics.topSources.length === 0) && (
                  <span className="text-neutral-600 block text-center py-4">
                    No analytics logged yet.
                  </span>
                )}
              </div>
            </div>

            {/* Opportunities by category distributions */}
            <div className="border border-neutral-900 bg-neutral-950 p-6 rounded space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                  Opportunities Distribution
                </h3>
                <BarChart className="h-4 w-4 text-neutral-600" />
              </div>

              <div className="space-y-3">
                {metrics?.byCategory &&
                  Object.entries(metrics.byCategory).map(([cat, count]: any) => (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-neutral-450">{cat.replace('_', ' ')}</span>
                        <span className="text-neutral-200 font-bold">{count} opps</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-900 rounded overflow-hidden">
                        <div
                          className="h-full bg-neutral-100"
                          style={{
                            width: `${(() => {
                              const values = Object.values(metrics?.byCategory || {}) as number[];
                              const total = values.reduce((sum, v) => sum + v, 0);
                              return total > 0 ? Math.min(100, (count / total) * 100) : 0;
                            })()}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                {(!metrics?.byCategory || Object.keys(metrics.byCategory).length === 0) && (
                  <span className="text-neutral-600 block text-center py-4">
                    No categories extracted.
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
