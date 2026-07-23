'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Users,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Trash2,
  Eye,
  Loader2,
  UserCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { UserDetailsDrawer } from '@/components/admin/UserDetailsDrawer';
import { DeleteUserModal } from '@/components/admin/DeleteUserModal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [authProvider, setAuthProvider] = useState('ALL');
  const [recStatus, setRecStatus] = useState('ALL');
  const [profileCompletion, setProfileCompletion] = useState('ALL');
  const [role, setRole] = useState('ALL');
  const [sortBy, setSortBy] = useState('Newest');

  // Modal / Drawer state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [deleteTargetUser, setDeleteTargetUser] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${apiHost}/api/v1/admin/users`, {
        params: {
          search: search || undefined,
          authProvider: authProvider !== 'ALL' ? authProvider : undefined,
          recStatus: recStatus !== 'ALL' ? recStatus : undefined,
          profileCompletion: profileCompletion !== 'ALL' ? profileCompletion : undefined,
          role: role !== 'ALL' ? role : undefined,
          sortBy,
        },
        withCredentials: true,
      });

      if (res.data?.success) {
        setUsers(res.data.data);
      } else {
        setError('Failed to load registered users.');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message || err.message || 'Error connecting to admin API.',
      );
    }
    {
      setLoading(false);
    }
  }, [apiHost, search, authProvider, recStatus, profileCompletion, role, sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenDrawer = (userId: string) => {
    setSelectedUserId(userId);
    setIsDrawerOpen(true);
  };

  const handleOpenDeleteModal = (user: any) => {
    setDeleteTargetUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (userId: string) => {
    const res = await axios.delete(`${apiHost}/api/v1/admin/users/${userId}`, {
      withCredentials: true,
    });

    if (res.data?.success) {
      setSuccessMessage('User deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchUsers();
    }
  };

  const clearFilters = () => {
    setSearch('');
    setAuthProvider('ALL');
    setRecStatus('ALL');
    setProfileCompletion('ALL');
    setRole('ALL');
    setSortBy('Newest');
  };

  // Metrics summary
  const totalUsersCount = users.length;
  const readyPacksCount = users.filter((u) => u.recommendationStatus === 'READY').length;
  const avgCompletion =
    totalUsersCount > 0
      ? Math.round(users.reduce((acc, u) => acc + (u.profileCompletion || 0), 0) / totalUsersCount)
      : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none font-sans pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            <h1 className="text-xl font-semibold text-neutral-100">User Management</h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Operational dashboard for inspecting testing accounts, onboarding progress, and
            cascading deletions.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-400 flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Internal Development Control</span>
        </div>
      </div>

      {/* ── Toast Success Message ── */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 rounded-2xl text-xs font-medium flex items-center gap-3 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Stat Badges Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
            Total Users Registered
          </span>
          <div className="text-xl font-bold text-neutral-100 font-mono">{totalUsersCount}</div>
        </div>

        <div className="p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
            Ready Recommendation Packs
          </span>
          <div className="text-xl font-bold text-emerald-400 font-mono">{readyPacksCount}</div>
        </div>

        <div className="p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
            Avg Profile Completion
          </span>
          <div className="text-xl font-bold text-blue-400 font-mono">{avgCompletion}%</div>
        </div>
      </div>

      {/* ── Search & Filters Bar ── */}
      <div className="p-4 bg-neutral-900/40 border border-neutral-800/60 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user name or email..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-100 focus:outline-none focus:border-neutral-700 placeholder:text-neutral-600"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-300 focus:outline-none focus:border-neutral-700"
            >
              <option value="Newest">Sort: Newest First</option>
              <option value="Oldest">Sort: Oldest First</option>
              <option value="Last Active">Sort: Last Active</option>
              <option value="Most Recommendations">Sort: Most Recs</option>
              <option value="Profile Completion">Sort: Profile Completion</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Auth Provider */}
          <select
            value={authProvider}
            onChange={(e) => setAuthProvider(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none"
          >
            <option value="ALL">Auth: All</option>
            <option value="Google">Google</option>
            <option value="Guest">Guest</option>
          </select>

          {/* Rec Status */}
          <select
            value={recStatus}
            onChange={(e) => setRecStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none"
          >
            <option value="ALL">Rec Status: All</option>
            <option value="READY">READY</option>
            <option value="GENERATING">BUILDING / GENERATING</option>
            <option value="FAILED">FAILED</option>
            <option value="NO_PACK">NO_PACK</option>
          </select>

          {/* Profile Completion */}
          <select
            value={profileCompletion}
            onChange={(e) => setProfileCompletion(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none"
          >
            <option value="ALL">Profile: All</option>
            <option value="Complete">Complete (100%)</option>
            <option value="Incomplete">Incomplete (&lt;100%)</option>
          </select>

          {/* Role */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-300 focus:outline-none"
          >
            <option value="ALL">Role: All</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          {(search ||
            authProvider !== 'ALL' ||
            recStatus !== 'ALL' ||
            profileCompletion !== 'ALL' ||
            role !== 'ALL') && (
            <button
              onClick={clearFilters}
              className="text-emerald-400 hover:underline text-[11px] font-mono ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-neutral-500 space-y-3 font-mono">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
            <p className="text-xs">Querying registered users & activity intelligence...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 font-mono text-xs space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p>{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <UserCheck className="w-8 h-8 text-neutral-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-neutral-300">
                {search || authProvider !== 'ALL' || recStatus !== 'ALL'
                  ? 'No users match your search.'
                  : 'No registered users yet.'}
              </h3>
              <p className="text-xs text-neutral-500 font-mono">
                {search || authProvider !== 'ALL'
                  ? 'Try clearing active search filters.'
                  : 'Registered accounts will appear here automatically.'}
              </p>
            </div>
            {(search || authProvider !== 'ALL') && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-900/40 text-neutral-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-3 font-semibold">Auth</th>
                  <th className="py-3.5 px-3 font-semibold">Persona & Stage</th>
                  <th className="py-3.5 px-3 font-semibold">Profile %</th>
                  <th className="py-3.5 px-3 font-semibold">Rec Status</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Recs</th>
                  <th className="py-3.5 px-3 font-semibold text-center">Saved</th>
                  <th className="py-3.5 px-3 font-semibold">Joined</th>
                  <th className="py-3.5 px-3 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-900/30 transition-colors group">
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center font-semibold text-neutral-300 shrink-0">
                          {u.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="max-w-[160px] truncate">
                          <span className="font-medium text-neutral-200 block truncate">
                            {u.displayName}
                          </span>
                          <span className="text-[11px] text-neutral-500 truncate block">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Auth */}
                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-900 border border-neutral-800 text-neutral-400">
                        {u.provider?.includes('google') ? 'Google' : 'Guest'}
                      </span>
                    </td>

                    {/* Persona & Stage */}
                    <td className="py-3 px-3">
                      <span className="text-neutral-300 block">{u.persona}</span>
                      <span className="text-[11px] text-neutral-500 block">{u.careerStage}</span>
                    </td>

                    {/* Profile % */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-neutral-800">
                          <div
                            className={`h-full rounded-full ${
                              u.profileCompletion === 100
                                ? 'bg-emerald-500'
                                : u.profileCompletion > 50
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                            }`}
                            style={{ width: `${u.profileCompletion}%` }}
                          />
                        </div>
                        <span className="text-neutral-400 text-[11px]">{u.profileCompletion}%</span>
                      </div>
                    </td>

                    {/* Rec Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.recommendationStatus === 'READY'
                            ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-400'
                            : u.recommendationStatus === 'GENERATING' ||
                                u.recommendationStatus === 'BUILDING'
                              ? 'bg-amber-950/60 border border-amber-800/60 text-amber-400'
                              : u.recommendationStatus === 'FAILED'
                                ? 'bg-red-950/60 border border-red-800/60 text-red-400'
                                : 'bg-neutral-900 border border-neutral-800 text-neutral-500'
                        }`}
                      >
                        {u.recommendationStatus}
                      </span>
                    </td>

                    {/* Recs Generated */}
                    <td className="py-3 px-3 text-center text-neutral-300">
                      {u.recommendationsGenerated}
                    </td>

                    {/* Saved Opps */}
                    <td className="py-3 px-3 text-center text-neutral-300">
                      {u.savedOpportunitiesCount}
                    </td>

                    {/* Joined */}
                    <td className="py-3 px-3 text-neutral-400 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-950/60 border border-purple-800/60 text-purple-400'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDrawer(u.id)}
                          className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(u)}
                          className="px-2.5 py-1.5 bg-red-950/50 hover:bg-red-900/80 border border-red-900/60 text-red-300 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── User Details Drawer ── */}
      <UserDetailsDrawer
        isOpen={isDrawerOpen}
        userId={selectedUserId}
        onClose={() => setIsDrawerOpen(false)}
        onOpenDeleteModal={(u) => {
          setIsDrawerOpen(false);
          handleOpenDeleteModal(u);
        }}
      />

      {/* ── Destructive Delete Modal ── */}
      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        user={deleteTargetUser}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
