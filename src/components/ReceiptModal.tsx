import React, { useState } from 'react';
import { Transaction } from '../types';
import { X, ZoomIn, ZoomOut, RotateCw, Download, CheckCircle2, XCircle, ExternalLink, Calendar, User, Tag, FileText } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onApprove?: (id: string, notes?: string) => Promise<void>;
  onReject?: (id: string, notes: string) => Promise<void>;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  isOpen,
  onClose,
  isAdmin = false,
  onApprove,
  onReject,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen || !transaction) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleReviewSubmit = async () => {
    if (!reviewAction) return;
    setSubmitting(true);
    try {
      if (reviewAction === 'approved' && onApprove) {
        await onApprove(transaction.id, reviewNote);
      } else if (reviewAction === 'rejected' && onReject) {
        await onReject(transaction.id, reviewNote || 'Receipt details insufficient or invalid.');
      }
      setIsReviewing(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const hasReceipt = Boolean(transaction.receiptUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: transaction.categoryColor || '#10b981' }}
            />
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                {transaction.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submitted by {transaction.userName} • {new Date(transaction.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full uppercase tracking-wider ${
                transaction.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : transaction.status === 'rejected'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}
            >
              {transaction.status}
            </span>
            <button
              id="btn-close-receipt-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Two columns if receipt exists */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* Left Column: Receipt Document Viewport */}
          <div className="lg:col-span-7 bg-slate-950/95 flex flex-col relative min-h-[320px] lg:min-h-0 border-r border-slate-800">
            {hasReceipt ? (
              <>
                {/* Control bar */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-200 shadow-md">
                  <button
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono px-1">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={handleZoomIn}
                    title="Zoom In"
                    className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRotate}
                    title="Rotate 90°"
                    className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors ml-1"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  {transaction.receiptUrl && (
                    <a
                      href={transaction.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open full resolution"
                      className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors ml-1 text-slate-400"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Viewport canvas */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-6 select-none">
                  <img
                    src={transaction.receiptUrl}
                    alt={`Receipt proof for ${transaction.title}`}
                    referrerPolicy="no-referrer"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                    className="max-h-[500px] max-w-full object-contain rounded shadow-lg"
                  />
                </div>

                {/* Receipt footer info */}
                <div className="bg-slate-900/80 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate max-w-[240px]">
                    📄 {transaction.receiptFileName || 'Uploaded receipt proof'}
                  </span>
                  {transaction.receiptFileSize && (
                    <span>{(transaction.receiptFileSize / 1024).toFixed(0)} KB</span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FileText className="w-12 h-12 stroke-[1.2] text-slate-600 mb-3" />
                <p className="font-medium text-slate-300">No Receipt Attached</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  This transaction was logged without an uploaded invoice or payment screenshot.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Transaction Details & Verification */}
          <div className="lg:col-span-5 p-6 overflow-y-auto flex flex-col bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
            <div className="space-y-5 flex-1">
              
              {/* Amount Display */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  Amount Requested
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-bold tracking-tight ${
                      transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </span>
                  <span className="text-xs font-medium uppercase text-slate-500">
                    USD ({transaction.type})
                  </span>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-400" /> Category
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {transaction.categoryName}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" /> Submitted By
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {transaction.userName}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" /> Date of Expense
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {transaction.date}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {transaction.notes && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Member Notes
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 leading-relaxed">
                    {transaction.notes}
                  </p>
                </div>
              )}

              {/* Review Audit Trail if reviewed */}
              {transaction.reviewedAt && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Reviewed by {transaction.reviewedByName || 'Admin'}
                    </span>
                    <span className="text-slate-400">
                      {new Date(transaction.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {transaction.reviewNotes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      "{transaction.reviewNotes}"
                    </p>
                  )}
                </div>
              )}

              {/* Admin Review Action Box */}
              {isAdmin && transaction.status === 'pending' && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                  {!isReviewing ? (
                    <div className="flex items-center gap-3">
                      <button
                        id="btn-modal-quick-approve"
                        onClick={() => {
                          setReviewAction('approved');
                          setIsReviewing(true);
                        }}
                        className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve Expense
                      </button>
                      <button
                        id="btn-modal-quick-reject"
                        onClick={() => {
                          setReviewAction('rejected');
                          setIsReviewing(true);
                        }}
                        className="flex-1 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          {reviewAction === 'approved' ? 'Confirm Approval' : 'Rejection Reason'}
                        </span>
                        <button
                          onClick={() => setIsReviewing(false)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                      <input
                        type="text"
                        value={reviewNote}
                        onChange={e => setReviewNote(e.target.value)}
                        placeholder={
                          reviewAction === 'approved'
                            ? 'Optional verification remark...'
                            : 'Explain why receipt was rejected (e.g. amount mismatch)...'
                        }
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={handleReviewSubmit}
                          disabled={submitting}
                          className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors ${
                            reviewAction === 'approved'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-rose-600 hover:bg-rose-700'
                          }`}
                        >
                          {submitting ? 'Updating...' : reviewAction === 'approved' ? 'Approve Now' : 'Confirm Rejection'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                id="btn-close-receipt-bottom"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
