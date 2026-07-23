'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Trash2, Loader2 } from 'lucide-react';

interface DeleteUserModalProps {
  isOpen: boolean;
  user: { id: string; displayName: string; email: string; role?: string } | null;
  onClose: () => void;
  onConfirmDelete: (userId: string) => Promise<void>;
  isSelf?: boolean;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirmDelete,
  isSelf = false,
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isConfirmed = confirmInput.trim() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed || isSelf || isDeleting) return;
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirmDelete(user.id);
      setConfirmInput('');
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message || err.message || 'Failed to delete user account',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-6 p-6 text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800/40 text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-neutral-100">Delete User Account</h3>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-neutral-500 hover:text-neutral-300 p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Self-deletion Warning Guard */}
        {isSelf ? (
          <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl text-red-300 text-xs leading-relaxed space-y-1">
            <p className="font-semibold">Operation Blocked</p>
            <p>You cannot delete the currently authenticated administrator.</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-neutral-950/80 border border-neutral-800/80 rounded-xl space-y-2 text-neutral-300">
              <p className="font-medium text-red-400 uppercase tracking-wider text-[10px]">
                This action is permanent.
              </p>
              <p className="text-neutral-400">
                The following data will also be permanently deleted:
              </p>
              <ul className="space-y-1 text-neutral-300 font-mono text-[11px] list-disc list-inside pt-1">
                <li>User Profile</li>
                <li>Recommendation Packs</li>
                <li>Bookmarks & Saved Opportunities</li>
                <li>Uploaded Resume</li>
                <li>Analytics Events</li>
                <li>User Intelligence & Sessions</li>
                <li>Every other record associated with this user</li>
              </ul>
              <p className="text-neutral-400 text-[11px] pt-1">This operation cannot be undone.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/50 border border-red-900/80 text-red-300 rounded-xl text-xs">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-neutral-400 text-xs">
                Type <strong className="text-red-400 font-mono">DELETE</strong> below to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                disabled={isDeleting}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-100 focus:outline-none focus:border-red-500/80 placeholder:text-neutral-700"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {!isSelf && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Permanently</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
