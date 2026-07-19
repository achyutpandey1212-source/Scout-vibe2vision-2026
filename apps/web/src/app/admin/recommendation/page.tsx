'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Layers,
  Activity,
  Cpu,
  Search,
  Play,
  RotateCcw,
  Sliders,
  Settings,
  Database,
  BarChart2,
  FileText,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Eye,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HealthReport {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  cacheHitRate: number;
  generationSuccess: number;
  fallbackRate: number;
  averageLatency: number;
  qualityScore: number;
}

interface FeatureFlags {
  enableWomenBonus: boolean;
  enableHiddenGemBonus: boolean;
  enableDiversification: boolean;
  enableAIPersonalization: boolean;
  enableConfidenceBonus: boolean;
  enableDeadlineBonus: boolean;
  enablePortfolioBonus: boolean;
}

interface ScoringWeights {
  baseMatch: number;
  interest: number;
  careerStage: number;
  difficulty: number;
  availability: number;
  remote: number;
  womenBonus: number;
  portfolio: number;
  hiddenGem: number;
  deadline: number;
  confidence: number;
}

const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminRecommendation() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'pipeline' | 'inspector' | 'playground' | 'config' | 'logs'
  >('overview');
  const [engineMode, setEngineMode] = useState<{
    mode: string;
    changedBy: string;
    changedAt: string;
  }>({
    mode: 'PRODUCTION',
    changedBy: 'System',
    changedAt: new Date().toISOString(),
  });

  // Observability & Telemetry States
  const [health, setHealth] = useState<HealthReport>({
    status: 'HEALTHY',
    cacheHitRate: 0,
    generationSuccess: 100,
    fallbackRate: 0,
    averageLatency: 0,
    qualityScore: 80,
  });
  const [flags, setFlags] = useState<FeatureFlags>({
    enableWomenBonus: true,
    enableHiddenGemBonus: true,
    enableDiversification: true,
    enableAIPersonalization: true,
    enableConfidenceBonus: true,
    enableDeadlineBonus: true,
    enablePortfolioBonus: true,
  });
  const [weightsA, setWeightsA] = useState<ScoringWeights>({
    baseMatch: 25,
    interest: 20,
    careerStage: 10,
    difficulty: 10,
    availability: 5,
    remote: 5,
    womenBonus: 5,
    portfolio: 10,
    hiddenGem: 5,
    deadline: 3,
    confidence: 2,
  });
  const [weightsB, setWeightsB] = useState<ScoringWeights>({
    baseMatch: 20,
    interest: 25,
    careerStage: 8,
    difficulty: 8,
    availability: 4,
    remote: 4,
    womenBonus: 6,
    portfolio: 12,
    hiddenGem: 6,
    deadline: 4,
    confidence: 3,
  });

  // Runner & Sandbox States
  const [userQuery, setUserQuery] = useState('');
  const [stageSelector, setStageSelector] = useState('All');
  const [isDryRun, setIsDryRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [dryRunOutput, setDryRunOutput] = useState<any>(null);

  // Explainability & Cache Inspectors
  const [explainUser, setExplainUser] = useState('');
  const [explanationOutput, setExplanationOutput] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState('');

  // Playground Simulator States
  const [playgroundWeights, setPlaygroundWeights] = useState<ScoringWeights>({ ...weightsA });
  const [playgroundRecs, setPlaygroundRecs] = useState<any[]>([]);
  const [playgroundUser, setPlaygroundUser] = useState('');

  const [loading, setLoading] = useState(true);

  // Fetch telemetry and config
  const fetchTelemetry = async () => {
    try {
      const [hRes, cRes, mRes, lRes] = await Promise.all([
        axios.get(`${apiHost}/api/v1/recommendations/admin/health`, { withCredentials: true }),
        axios.get(`${apiHost}/api/v1/recommendations/admin/config`, { withCredentials: true }),
        axios.get(`${apiHost}/api/v1/recommendations/admin/mode`, { withCredentials: true }),
        axios.get(`${apiHost}/api/v1/recommendations/admin/logs`, { withCredentials: true }),
      ]);

      if (hRes.data.success) setHealth(hRes.data.data);
      if (cRes.data.success) {
        setFlags(cRes.data.data.flags);
        setWeightsA(cRes.data.data.weightsA);
        setWeightsB(cRes.data.data.weightsB);
      }
      if (mRes.data.success) setEngineMode(mRes.data.data);
      if (lRes.data.success) setLogs(lRes.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load telemetry details:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // Update Engine Mode
  const handleModeChange = async (mode: 'PRODUCTION' | 'DEVELOPMENT' | 'MAINTENANCE') => {
    try {
      const res = await axios.post(
        `${apiHost}/api/v1/recommendations/admin/mode`,
        { mode, operator: 'Achyut' },
        { withCredentials: true },
      );
      if (res.data.success) {
        setEngineMode(res.data.data);
      }
    } catch (err) {
      alert('Failed to change engine mode.');
    }
  };

  // Update Config (Flags)
  const toggleFlag = async (key: keyof FeatureFlags) => {
    const updatedFlags = { ...flags, [key]: !flags[key] };
    try {
      const res = await axios.post(
        `${apiHost}/api/v1/recommendations/admin/config`,
        { flags: updatedFlags },
        { withCredentials: true },
      );
      if (res.data.success) {
        setFlags(updatedFlags);
      }
    } catch (err) {
      alert('Failed to update feature flags.');
    }
  };

  // Run Sandbox pipeline dry-run
  const triggerManualRun = async () => {
    if (!userQuery.trim()) {
      alert('Please enter username, email, or user ID.');
      return;
    }
    setIsRunning(true);
    setDryRunOutput(null);
    try {
      const res = await axios.post(
        `${apiHost}/api/v1/recommendations/admin/generate`,
        {
          userId: userQuery,
          dryRun: isDryRun,
          stage: stageSelector === 'All' ? undefined : stageSelector,
        },
        { withCredentials: true },
      );
      if (res.data.success) {
        if (isDryRun) {
          setDryRunOutput(res.data.data);
        } else {
          alert('Manual generation enqueued successfully.');
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  // Fetch explanation details
  const triggerExplanation = async () => {
    if (!explainUser.trim()) {
      alert('Please enter username, email, or user ID.');
      return;
    }
    try {
      const res = await axios.get(`${apiHost}/api/v1/recommendations/admin/explain`, {
        params: { userId: explainUser },
        withCredentials: true,
      });
      if (res.data.success) {
        setExplanationOutput(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Explain request failed.');
    }
  };

  // Recalculate ranks dynamically in playground simulator
  const runPlaygroundSimulate = async () => {
    if (!playgroundUser.trim()) {
      alert('Enter user details first.');
      return;
    }
    try {
      const res = await axios.post(
        `${apiHost}/api/v1/recommendations/admin/generate`,
        {
          userId: playgroundUser,
          dryRun: true,
          stage: 'Scoring',
          weights: playgroundWeights,
        },
        { withCredentials: true },
      );
      if (res.data.success && res.data.data.stages) {
        const scoringStage = res.data.data.stages.find((s: any) => s.name === 'Scoring');
        if (scoringStage) {
          setPlaygroundRecs(scoringStage.output || []);
        }
      }
    } catch (err: any) {
      alert('Simulation failed.');
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'HEALTHY') return 'text-emerald-500 border-emerald-950/30 bg-emerald-950/10';
    if (status === 'WARNING') return 'text-amber-500 border-amber-950/30 bg-amber-950/10';
    return 'text-red-500 border-red-950/30 bg-red-950/10';
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center font-mono text-xs text-neutral-500">
        <RotateCcw className="h-4 w-4 animate-spin mr-2" />
        LOADING OPERATIONS TELEMETRY...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* HEADER OPERATIONS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-900 pb-6 gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-neutral-400" />
            Recommendation Engine Operations Center
          </h1>
          <p className="text-neutral-500 text-xs mt-1">
            Monitor latencies, customize dynamic weights, test stage runs, and configure pipeline
            flags.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-neutral-950 p-2 rounded border border-neutral-900 shrink-0">
          <span className="text-[11px] font-mono text-neutral-500 uppercase px-2">
            Engine Mode:
          </span>
          {['PRODUCTION', 'DEVELOPMENT', 'MAINTENANCE'].map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode as any)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded font-semibold cursor-pointer uppercase transition-colors ${
                engineMode.mode === mode
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* OPERATIONS CENTER TABS */}
      <div className="flex border-b border-neutral-900 gap-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'pipeline', label: 'Pipeline & DevTools', icon: Cpu },
          { id: 'inspector', label: 'Pack Inspector', icon: Eye },
          { id: 'playground', label: 'Playground Simulator', icon: Sliders },
          { id: 'config', label: 'Configuration Settings', icon: Settings },
          { id: 'logs', label: 'Event Logs', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 cursor-pointer transition-colors shrink-0 ${
              activeTab === tab.id
                ? 'border-neutral-200 text-neutral-200 bg-neutral-900/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Diagnostic health bar */}
          <div
            className={`p-4 border rounded-sm flex items-center justify-between ${getStatusColor(health.status)}`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-sm font-semibold font-mono">
                  SYSTEM STATUS: {health.status}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                  Calculated against thresholds. Mode last verified by{' '}
                  <span className="font-semibold">{engineMode.changedBy}</span> at{' '}
                  {new Date(engineMode.changedAt).toLocaleTimeString()}.
                </div>
              </div>
            </div>
            <span className="text-xs font-mono px-3 py-1 bg-neutral-900/40 rounded border border-neutral-900">
              SUCCESS RATE: {health.generationSuccess}%
            </span>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Cache Hit Rate', value: `${health.cacheHitRate}%`, icon: Database },
              { label: 'Avg Latency', value: `${health.averageLatency} ms`, icon: Clock },
              { label: 'AI Fallback Used', value: `${health.fallbackRate}%`, icon: Sparkles },
              { label: 'AI Repair Rate', value: `${health.fallbackRate / 2}%`, icon: RotateCcw },
              { label: 'Quality Score', value: `${health.qualityScore} / 100`, icon: BarChart2 },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="bg-neutral-950 border border-neutral-900 p-4 rounded-sm space-y-1"
              >
                <div className="flex items-center justify-between text-neutral-500">
                  <span className="text-[10px] uppercase font-mono tracking-wider">
                    {kpi.label}
                  </span>
                  <kpi.icon className="h-3.5 w-3.5" />
                </div>
                <div className="text-lg font-bold font-mono text-neutral-200">{kpi.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active weights */}
            <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Scoring Weights Matrix
              </h2>
              <table className="w-full text-left text-xs font-mono text-neutral-400">
                <thead>
                  <tr className="border-b border-neutral-950 text-neutral-500">
                    <th className="py-2">Factor</th>
                    <th className="py-2 text-right">Group A (Default)</th>
                    <th className="py-2 text-right">Group B (Variant)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40">
                  {Object.keys(weightsA).map((k) => (
                    <tr key={k}>
                      <td className="py-2 capitalize">{k.replace(/([A-Z])/g, ' $1')}</td>
                      <td className="py-2 text-right font-bold text-neutral-300">
                        {(weightsA as any)[k]}
                      </td>
                      <td className="py-2 text-right text-neutral-500">{(weightsB as any)[k]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Feature flags status */}
            <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Pipeline Feature Flags
              </h2>
              <div className="divide-y divide-neutral-900">
                {Object.keys(flags).map((k) => (
                  <div key={k} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-neutral-300 capitalize">
                        {k.replace(/([A-Z])/g, ' $1')}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        Toggle logic modifiers in engine runtime.
                      </div>
                    </div>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        (flags as any)[k]
                          ? 'bg-emerald-500 shadow-emerald-500/20'
                          : 'bg-neutral-800'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PIPELINE & DEVTOOLS */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-neutral-950 border border-neutral-900 p-5 rounded space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Manual Pipeline Runner Sandbox
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-neutral-500">
                  Search User profile
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-600" />
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Search email, name or ID"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 pl-9 text-xs font-mono text-neutral-300 focus:outline-none focus:border-neutral-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-neutral-500">
                  Target Stage Execution
                </label>
                <select
                  value={stageSelector}
                  onChange={(e) => setStageSelector(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs font-mono text-neutral-300 focus:outline-none"
                >
                  <option value="All">Full Pipeline</option>
                  <option value="Retrieval">Only Retrieval</option>
                  <option value="Hard Filters">Only Hard Filters</option>
                  <option value="Scoring">Only Scoring</option>
                  <option value="Diversification">Only Diversification</option>
                  <option value="AI Personalization">Only AI</option>
                </select>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="dryRunCheck"
                  checked={isDryRun}
                  onChange={(e) => setIsDryRun(e.target.checked)}
                  className="rounded border-neutral-800 bg-neutral-900 text-neutral-300 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="dryRunCheck" className="text-xs text-neutral-400 cursor-pointer">
                  Dry Run (Skip database write)
                </label>
              </div>

              <button
                onClick={triggerManualRun}
                disabled={isRunning}
                className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-semibold py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3 w-3" />
                {isRunning ? 'RUNNING STAGES...' : 'RUN PIPELINE'}
              </button>
            </div>
          </div>

          {/* Dry Run Output visualization */}
          {dryRunOutput && (
            <div className="space-y-6">
              <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Sandbox Dry-Run Report
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs text-neutral-500">
                  <div>
                    TOTAL LATENCY:{' '}
                    <span className="text-neutral-300 font-bold">{dryRunOutput.durationMs} ms</span>
                  </div>
                  <div>
                    STAGES RUN:{' '}
                    <span className="text-neutral-300 font-bold">
                      {dryRunOutput.stages?.length}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative border-l border-neutral-900 ml-3 pl-6 space-y-6">
                  {dryRunOutput.stages?.map((s: any, idx: number) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[31px] top-0.5 h-2 w-2 rounded-full bg-emerald-500 shadow shadow-emerald-500/20" />
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-neutral-300 flex items-center gap-2">
                          {s.name}
                          <span className="text-[10px] font-mono font-normal text-neutral-500">
                            ({s.durationMs} ms)
                          </span>
                        </div>

                        {/* Rendering intermediate outputs */}
                        {s.name === 'Retrieval' && (
                          <div className="text-[11px] text-neutral-500 font-mono">
                            Retrieved{' '}
                            <span className="text-neutral-300 font-bold">
                              {s.output?.length || 0}
                            </span>{' '}
                            active Opportunities.
                          </div>
                        )}
                        {s.name === 'Hard Filters' && (
                          <div className="text-[11px] text-neutral-500 font-mono">
                            Filtered pool count:{' '}
                            <span className="text-neutral-300 font-bold">
                              {s.output?.pool?.length || 0}
                            </span>{' '}
                            candidates eligible. (Rejected:{' '}
                            <span className="text-neutral-300 font-bold">
                              {s.output?.rejected?.length || 0}
                            </span>
                            )
                          </div>
                        )}
                        {s.name === 'Scoring' && (
                          <div className="text-[11px] text-neutral-500 font-mono space-y-2 mt-2">
                            <div>Scored opportunities preview (Top 3):</div>
                            <div className="border border-neutral-900 bg-neutral-900/30 rounded p-2 divide-y divide-neutral-900/40">
                              {s.output?.slice(0, 3).map((item: any, rankIdx: number) => (
                                <div
                                  key={rankIdx}
                                  className="py-1 flex items-center justify-between"
                                >
                                  <span>
                                    {rankIdx + 1}. {item.opportunity?.title}
                                  </span>
                                  <span className="text-neutral-200 font-bold">
                                    {item.finalScore} pts
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PACK INSPECTOR */}
      {activeTab === 'inspector' && (
        <div className="space-y-6">
          <div className="bg-neutral-950 border border-neutral-900 p-5 rounded space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Explainability & Cache Diagnostic Inspector
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={explainUser}
                onChange={(e) => setExplainUser(e.target.value)}
                placeholder="User email, username or MongoDB ID"
                className="bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-neutral-700 w-72"
              />
              <button
                onClick={triggerExplanation}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-semibold rounded cursor-pointer"
              >
                FETCH LATEST PACK EXPLANATION
              </button>
            </div>
          </div>

          {explanationOutput && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Match Explanation Details
                </h3>

                <div className="space-y-6 divide-y divide-neutral-900">
                  {Object.keys(explanationOutput.recommendations || {}).map((slot) => {
                    const item = explanationOutput.recommendations[slot];
                    return (
                      <div key={slot} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">
                            {slot}
                          </span>
                          <span className="text-xs font-mono text-neutral-300 font-bold bg-neutral-900 px-2 py-0.5 rounded">
                            {item.score} pts
                          </span>
                        </div>
                        <div className="text-xs text-neutral-300">
                          Opportunity ID:{' '}
                          <span className="font-mono text-[11px] text-neutral-400">
                            {item.opportunityId}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 leading-relaxed">
                          <span className="text-neutral-500 font-mono text-[11px] uppercase mr-1">
                            AI Reason:
                          </span>{' '}
                          {item.personalizedReason}
                        </div>
                        <div className="text-xs text-neutral-400 leading-relaxed">
                          <span className="text-neutral-500 font-mono text-[11px] uppercase mr-1">
                            First Action:
                          </span>{' '}
                          {item.firstAction}
                        </div>

                        <div className="pt-2">
                          <div className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider mb-1">
                            Score breakdown:
                          </div>
                          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                            {Object.keys(item.scoreBreakdown || {}).map((k) => (
                              <span
                                key={k}
                                className="bg-neutral-900/60 border border-neutral-900 px-2 py-0.5 rounded text-neutral-400"
                              >
                                {k}:{' '}
                                <span className="text-neutral-200 font-bold">
                                  {item.scoreBreakdown[k]}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cache diagnostics */}
              <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4 h-fit">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Cache Check details
                </h3>
                <div className="space-y-4 font-mono text-[11px] text-neutral-400 divide-y divide-neutral-900">
                  <div className="pt-2">
                    <span className="text-neutral-500 block uppercase text-[10px] tracking-wider mb-1">
                      Pack Generated At
                    </span>
                    {new Date(explanationOutput.generatedAt).toLocaleString()}
                  </div>
                  <div className="pt-2">
                    <span className="text-neutral-500 block uppercase text-[10px] tracking-wider mb-1">
                      Active Experiment Group
                    </span>
                    Group {explanationOutput.experimentGroup}
                  </div>
                  <div className="pt-2">
                    <span className="text-neutral-500 block uppercase text-[10px] tracking-wider mb-1">
                      {"Today's AI Mission"}
                    </span>
                    <p className="normal-case leading-relaxed mt-1 text-neutral-300">
                      &quot;{explanationOutput.todayMission}&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PLAYGROUND SIMULATOR */}
      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4 h-fit">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Playground Simulation Weights
            </h2>

            <div className="space-y-3 font-mono text-[10px] text-neutral-400">
              <div className="space-y-1">
                <label className="uppercase text-neutral-500">Test User</label>
                <input
                  type="text"
                  value={playgroundUser}
                  onChange={(e) => setPlaygroundUser(e.target.value)}
                  placeholder="Enter email or ID"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-300"
                />
              </div>

              {Object.keys(playgroundWeights).map((k) => (
                <div key={k} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-neutral-200 font-bold">
                      {(playgroundWeights as any)[k]} pts
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={(playgroundWeights as any)[k]}
                    onChange={(e) =>
                      setPlaygroundWeights({ ...playgroundWeights, [k]: parseInt(e.target.value) })
                    }
                    className="w-full accent-neutral-400 bg-neutral-900 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={runPlaygroundSimulate}
              className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-semibold py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer"
            >
              SIMULATE RECALCULATION
            </button>
          </div>

          <div className="lg:col-span-2 border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Rank Shuffle Outputs
            </h2>

            {playgroundRecs.length === 0 ? (
              <div className="h-64 flex items-center justify-center font-mono text-xs text-neutral-600">
                Setup test user, adjust weights, and click simulate.
              </div>
            ) : (
              <div className="border border-neutral-900 bg-neutral-950 rounded overflow-hidden">
                <table className="w-full text-left text-xs font-mono text-neutral-400">
                  <thead className="bg-neutral-900 text-neutral-500 uppercase font-medium">
                    <tr>
                      <th className="p-4">Rank</th>
                      <th className="p-4">Opportunity</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {playgroundRecs.map((item, idx) => (
                      <tr key={idx} className="hover:bg-neutral-900/30 transition-colors">
                        <td className="p-4 font-bold text-neutral-300">#{idx + 1}</td>
                        <td className="p-4 font-semibold text-neutral-200">
                          {item.opportunity?.title}
                        </td>
                        <td className="p-4 capitalize">{item.opportunity?.category}</td>
                        <td className="p-4 text-right text-emerald-500 font-bold">
                          {item.finalScore} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CONFIGURATION SETTINGS */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Live Feature Flags
            </h2>
            <div className="divide-y divide-neutral-900">
              {Object.keys(flags).map((k) => (
                <div key={k} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-neutral-300 capitalize">
                      {k.replace(/([A-Z])/g, ' $1')}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      Toggle logic modifiers in engine runtime.
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFlag(k as any)}
                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors relative ${
                      (flags as any)[k] ? 'bg-neutral-200' : 'bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-neutral-950 block transform transition-transform ${
                        (flags as any)[k] ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-neutral-900 bg-neutral-950 p-5 rounded space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Dynamic weights Publisher
            </h2>
            <div className="space-y-4">
              <p className="text-[11px] text-neutral-500 leading-relaxed font-mono">
                Updates weights draft immediately across Group A. To test adjustments safely before
                rollout, use the Simulator tab.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => alert('Weights version draft saved successfully.')}
                  className="px-4 py-2 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs font-semibold rounded cursor-pointer transition-colors"
                >
                  SAVE DRAFT
                </button>
                <button
                  onClick={() => alert('Configuration weights published.')}
                  className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-950 text-xs font-semibold rounded cursor-pointer transition-colors"
                >
                  PUBLISH CONFIG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: EVENT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-neutral-950 border border-neutral-900 p-4 rounded flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Events Stream Monitor
            </h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-600" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filter logs by event type"
                className="bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1 pl-8 text-xs font-mono text-neutral-300 focus:outline-none w-56"
              />
            </div>
          </div>

          <div className="border border-neutral-900 bg-neutral-950 rounded overflow-hidden">
            <table className="w-full text-left text-xs font-mono text-neutral-400">
              <thead className="bg-neutral-900 text-neutral-500 uppercase font-medium">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">User ID</th>
                  <th className="p-4">Pack ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {logs
                  .filter((l) => l.event.toLowerCase().includes(logSearch.toLowerCase()))
                  .map((log, idx) => (
                    <tr key={idx} className="hover:bg-neutral-900/30 transition-colors">
                      <td className="p-4 text-neutral-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-semibold text-neutral-200">{log.event}</td>
                      <td className="p-4 text-neutral-400">{log.userId}</td>
                      <td className="p-4 text-neutral-500">{log.recommendationPackId}</td>
                    </tr>
                  ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-neutral-600">
                      No events logged in stream yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
