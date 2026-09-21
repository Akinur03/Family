import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatBDT } from '../utils/currency';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface AdminApprovalQueueProps {
  pendingTransactions: Transaction[];
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, notes: string) => Promise<void>;
  onInspectReceipt: (transaction: Transaction) => void;
  onRefresh: () => void;
}

export const AdminApprovalQueue: React.FC<AdminApprovalQueueProps> = ({
  pendingTransactions,
  onApprove,
  onReject,
  onInspectReceipt,
  onRefresh,
}) => {
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const totalPendingValue = pendingTransactions.reduce((acc, t) => acc + t.amount, 0);

  const handleApproveClick = async (id: string) => {
    setProcessingId(id);
    try {
      await onApprove(id, 'Verified by Family Head.');
      onRefresh();
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (id: string) => {
    if (!rejectReason.trim()) return;
    setProcessingId(id);
    try {
      await onReject(id, rejectReason.trim());
      setActiveRejectId(null);
      setRejectReason('');
      onRefresh();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Expense Verification Queue
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {pendingTransactions.length} Pending
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review receipts and payment proofs submitted by family members before they are charged to the consolidated ledger.
            </p>
          </div>
        </div>

        <div className="sm:text-right bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Pending Approval
          </span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {formatBDT(totalPendingValue)}
          </span>
        </div>
      </div>

      {/* Pending Items List */}
      {pendingTransactions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            All Caught Up!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            No family expenses are currently waiting for your review. When members upload new receipts, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingTransactions.map(tx => {
            const hasReceipt = Boolean(tx.receiptUrl);
            const isRejecting = activeRejectId === tx.id;
            const isProcessing = processingId === tx.id;

            return (
              <div
                key={tx.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  {/* Card Header: Amount & Category */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: tx.categoryColor || '#10b981' }}
                      />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {tx.categoryName}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatBDT(tx.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        {tx.type}
                      </span>
                    </div>
                  </div>

                  {/* Title & Submitter */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 leading-snug">
                    {tx.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {tx.userName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {tx.date}
                    </span>
                  </div>

                  {/* Notes if provided */}
                  {tx.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 mb-3 italic">
                      "{tx.notes}"
                    </p>
                  )}

                  {/* Attached Proof Receipt preview block */}
                  <div className="mb-4">
                    {hasReceipt ? (
                      <div
                        onClick={() => onInspectReceipt(tx)}
                        className="group flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={tx.receiptUrl}
                            alt="Receipt proof"
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors truncate">
                              📄 {tx.receiptFileName || 'Receipt Proof'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Click to view & zoom receipt
                            </p>
                          </div>
                        </div>

                        <span className="p-2 text-slate-400 group-hover:text-emerald-600 shrink-0">
                          <Eye className="w-4 h-4" />
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>No image proof attached</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Approve / Reject Flow */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  {!isRejecting ? (
                    <div className="flex items-center gap-2">
                      <button
                        id={`btn-approve-${tx.id}`}
                        onClick={() => handleApproveClick(tx.id)}
                        disabled={isProcessing}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isProcessing ? 'Processing...' : 'Approve'}</span>
                      </button>

                      <button
                        id={`btn-reject-trigger-${tx.id}`}
                        onClick={() => {
                          setActiveRejectId(tx.id);
                          setRejectReason('');
                        }}
                        disabled={isProcessing}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      {hasReceipt && (
                        <button
                          onClick={() => onInspectReceipt(tx)}
                          title="Inspect full image proof"
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Inline Rejection Reason Box */
                    <div className="space-y-2 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                      <div className="flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 font-semibold">
                        <span>Reason for Rejection</span>
                        <button
                          onClick={() => setActiveRejectId(null)}
                          className="text-[11px] text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="e.g. Receipt unreadable, duplicate entry, personal item"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleRejectSubmit(tx.id)}
                          disabled={!rejectReason.trim() || isProcessing}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          {isProcessing ? 'Saving...' : 'Confirm Rejection'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
