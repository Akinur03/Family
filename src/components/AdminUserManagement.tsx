import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert,
  UserX,
  UserPlus,
  Calendar,
  Heart,
} from 'lucide-react';

interface AdminUserManagementProps {
  users: User[];
  currentUserId?: string;
  onRefresh: () => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  users,
  currentUserId,
  onRefresh,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'active');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  const handleStatusChange = async (userId: string, newStatus: User['status'], reason?: string) => {
    setProcessingId(userId);
    setFeedback(null);
    try {
      await api.updateUserStatus(userId, newStatus, reason);
      setFeedback({
        type: 'success',
        message: `Account status updated to ${newStatus}.`,
      });
      setRejectingUserId(null);
      setRejectionReason('');
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update user' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    setProcessingId(userId);
    setFeedback(null);
    try {
      await api.updateUserRole(userId, newRole);
      setFeedback({
        type: 'success',
        message: `User role updated to ${newRole === 'admin' ? 'Family Head (Admin)' : 'Family Member'}.`,
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update role' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Pending Registrations Section (Requirement: Admin Approval for New Accounts) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Pending Registration Approvals
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {pendingUsers.length} Awaiting Review
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New accounts cannot log in or access family finances until you approve them.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No pending registrations right now. When family members sign up, they will appear here for verification.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map(user => {
                const isRejecting = rejectingUserId === user.id;
                const isProcessing = processingId === user.id;

                return (
                  <div
                    key={user.id}
                    className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`}
                        alt={user.fullName}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-white"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {user.fullName}
                          </h3>
                          <span className="text-xs font-mono text-slate-400">
                            @{user.username}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-medium text-amber-700 dark:text-amber-400">
                            Relationship: {user.relationship}
                          </span>
                          <span>•</span>
                          <span>Registered {new Date(user.createdAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>

                    {!isRejecting ? (
                      <div className="flex items-center gap-2">
                        <button
                          id={`btn-approve-user-${user.id}`}
                          onClick={() => handleStatusChange(user.id, 'active')}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Access</span>
                        </button>
                        <button
                          id={`btn-reject-user-${user.id}`}
                          onClick={() => setRejectingUserId(user.id)}
                          disabled={isProcessing}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          placeholder="Reason (e.g. Unrecognized email)..."
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                        />
                        <button
                          onClick={() => handleStatusChange(user.id, 'rejected', rejectionReason)}
                          disabled={isProcessing}
                          className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setRejectingUserId(null)}
                          className="px-2 py-2 text-xs text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active Family Members Directory */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Active Family Members ({approvedUsers.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Relationship</th>
                <th className="px-6 py-3">Family Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Role & Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {approvedUsers.map(user => {
                const isSelf = user.id === currentUserId;
                const isProcessing = processingId === user.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`}
                          alt={user.fullName}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-white"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {user.fullName} {isSelf && <span className="text-[10px] text-emerald-600 font-normal">(You)</span>}
                          </p>
                          <p className="text-[11px] text-slate-400">@{user.username}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {user.relationship}
                    </td>

                    <td className="px-6 py-3.5">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Family Head (Admin)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          Family Member
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Active Access
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-right">
                      {!isSelf ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'member' : 'admin')}
                            disabled={isProcessing}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition-colors"
                          >
                            {user.role === 'admin' ? 'Demote to Member' : 'Promote to Head'}
                          </button>
                          <button
                            onClick={() => handleStatusChange(user.id, 'rejected', 'Access revoked by Family Head')}
                            disabled={isProcessing}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors"
                          >
                            Revoke
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Primary Account</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejected Users Section */}
      {rejectedUsers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
            Declined / Suspended Accounts ({rejectedUsers.length})
          </h3>
          <div className="space-y-2">
            {rejectedUsers.map(u => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {u.fullName} (@{u.username})
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Reason: {u.rejectionReason || 'Declined by Administrator'}
                  </p>
                </div>
                <button
                  onClick={() => handleStatusChange(u.id, 'active')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors"
                >
                  Reinstate & Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
