'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { HardDrive, RefreshCw } from 'lucide-react';

const JOBS_LIST = [
  {
    name: 'discovery',
    label: 'Massive Discovery & Extraction Pipeline',
    schedule: 'Every 24 hours',
    status: 'WAITING',
  },
  {
    name: 'archive',
    label: 'Archive Expired Opportunities Scans',
    schedule: 'Every 12 hours',
    status: 'IDLE',
  },
  {
    name: 'recommendation',
    label: 'User Recommendation Cache Refresh',
    schedule: 'On-demand',
    status: 'IDLE',
  },
];

export default function AdminJobs() {
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const runJob = async (name: string) => {
    setRunningJob(name);
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(
        `${apiHost}/api/v1/admin/jobs/trigger`,
        { jobName: name },
        { withCredentials: true },
      );
      alert(`Job "${name}" scheduled successfully in the background.`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to trigger job.');
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-medium tracking-tight">Jobs & Scheduler</h1>
        <p className="text-neutral-500 text-sm mt-0.5">
          Manually trigger scheduled backend operational jobs
        </p>
      </div>

      <div className="border border-neutral-900 bg-neutral-950 rounded overflow-hidden">
        <table className="w-full text-left text-xs font-mono text-neutral-400">
          <thead className="bg-neutral-900 text-neutral-500 uppercase font-medium">
            <tr>
              <th className="p-4">Job Name</th>
              <th className="p-4">Schedule</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {JOBS_LIST.map((job) => (
              <tr key={job.name} className="hover:bg-neutral-900/30 transition-colors">
                <td className="p-4 font-semibold text-neutral-300 flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-neutral-600" />
                  <span>{job.label}</span>
                </td>
                <td className="p-4">{job.schedule}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-900 text-neutral-500 border border-neutral-800">
                    {job.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => runJob(job.name)}
                    disabled={runningJob !== null}
                    className="flex items-center gap-2 px-3 py-1.5 border border-neutral-800 hover:bg-neutral-900 transition-colors rounded text-[11px] font-semibold cursor-pointer disabled:opacity-50 ml-auto"
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${runningJob === job.name ? 'animate-spin' : ''}`}
                    />
                    <span>Run Manually</span>
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
