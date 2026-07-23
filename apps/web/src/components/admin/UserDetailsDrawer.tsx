'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, User, Activity, Database, Trash2 } from 'lucide-react';

interface UserDetailsDrawerProps {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
  onOpenDeleteModal: (user: any) => void;
}

export const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  isOpen,
  userId,
  onClose,
  onOpenDeleteModal,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    setError(null);
    const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    axios
      .get(`${apiHost}/api/v1/admin/users/${userId}`, { withCredentials: true })
      .then((res) => {
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError('Failed to fetch user details.');
        }
      })
      .catch((err) => {
        setError(
          err?.response?.data?.error?.message || err.message || 'Error loading user details.',
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-neutral-950/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-xl bg-neutral-950 border-l border-neutral-900 h-full flex flex-col justify-between shadow-2xl text-neutral-100 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-neutral-900 flex items-center justify-between shrink-0 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center font-semibold text-neutral-300">
              {data?.basic?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                {data?.basic?.displayName || 'User Details'}
              </h3>
              <p className="text-xs text-neutral-500 font-mono">{data?.basic?.email || userId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-300 rounded-lg hover:bg-neutral-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <p className="text-xs font-mono">Loading user intelligence & profile...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/40 border border-red-900/60 text-red-300 rounded-xl text-xs">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Basic Information */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Basic Information</span>
                </div>
                <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Name</span>
                    <span className="text-neutral-200">{data.basic.displayName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Email</span>
                    <span className="text-neutral-200 truncate block">{data.basic.email}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Auth Provider</span>
                    <span className="text-neutral-200">{data.basic.provider}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Role</span>
                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-300">
                      {data.basic.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Created At</span>
                    <span className="text-neutral-400">
                      {new Date(data.basic.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Last Seen</span>
                    <span className="text-neutral-400">
                      {new Date(data.basic.lastSeenAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-neutral-800/50">
                    <span className="text-neutral-500 text-[10px] block">User ID</span>
                    <span className="text-neutral-400 text-[11px] font-mono break-all">
                      {data.basic.id}
                    </span>
                  </div>
                </div>
              </section>

              {/* Profile Details */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  <span>Candidate Profile & Preferences</span>
                </div>
                {data.profile ? (
                  <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div>
                        <span className="text-neutral-500 text-[10px] block">Degree & Branch</span>
                        <span className="text-neutral-200">
                          {data.profile.degree} ({data.profile.branch || 'N/A'})
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] block">Year & Grad</span>
                        <span className="text-neutral-200">
                          Year {data.profile.currentYear || 'N/A'} (Class of{' '}
                          {data.profile.expectedGraduation || 'N/A'})
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] block">College</span>
                        <span className="text-neutral-200 truncate block">
                          {data.profile.college || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] block">Location</span>
                        <span className="text-neutral-200">
                          {data.profile.city
                            ? `${data.profile.city}, ${data.profile.state}`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    {data.profile.technicalSkills?.length > 0 && (
                      <div className="pt-2 border-t border-neutral-800/50">
                        <span className="text-neutral-500 text-[10px] block mb-1">
                          Technical Skills
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {data.profile.technicalSkills.map((s: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-neutral-900/30 border border-neutral-800/50 rounded-2xl text-xs text-neutral-500 font-mono">
                    No onboarding profile created yet.
                  </div>
                )}
              </section>

              {/* Activity & Recommendation Status */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  <span>Activity & Recommendation Status</span>
                </div>
                <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Packs Generated</span>
                    <span className="text-neutral-200 text-sm font-semibold">
                      {data.activity.recommendationsGenerated}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Saved Opportunities</span>
                    <span className="text-neutral-200 text-sm font-semibold">
                      {data.activity.savedOpportunitiesCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Resume Uploaded</span>
                    <span
                      className={`text-xs font-semibold ${
                        data.activity.resumeUploaded ? 'text-emerald-400' : 'text-neutral-500'
                      }`}
                    >
                      {data.activity.resumeUploaded ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] block">Analytics Events</span>
                    <span className="text-neutral-200">{data.activity.analyticsEventCount}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-neutral-800/50 space-y-1">
                    <span className="text-neutral-500 text-[10px] block">
                      Current Profile Fingerprint
                    </span>
                    <span className="text-neutral-400 text-[10px] font-mono break-all">
                      {data.recommendationStatus.currentFingerprint}
                    </span>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="h-16 px-6 border-t border-neutral-900 flex items-center justify-between bg-neutral-950 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-xs font-medium rounded-xl transition-colors"
          >
            Close
          </button>
          {data?.basic && (
            <button
              onClick={() => onOpenDeleteModal(data.basic)}
              className="px-4 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-800/50 text-red-300 text-xs font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete User Account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
