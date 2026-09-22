import React, { useState, useRef, useEffect } from 'react';
import { Category, Transaction } from '../types';
import { api } from '../services/api';
import { formatBDT, BDT_SYMBOL } from '../utils/currency';
import {
  X,
  UploadCloud,
  FileText,
  Trash2,
  PlusCircle,
  Calendar,
  DollarSign,
  AlertCircle,
  Zap,
  Wifi,
  Home,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Car,
  Wallet,
  Tag,
  CheckCircle2,
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
  onOpenNewCategory: () => void;
  initialTransaction?: Transaction | null;
}

const ICON_MAP: Record<string, any> = {
  Zap,
  Wifi,
  Home,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Car,
  Wallet,
  Tag,
};

const sanitizeDateForInput = (d?: string): string => {
  if (!d) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {}
  return new Date().toISOString().split('T')[0];
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSuccess,
  onOpenNewCategory,
  initialTransaction,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  // Upload state
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptFileSize, setReceiptFileSize] = useState<number | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial transaction when editing
  useEffect(() => {
    if (initialTransaction) {
      setTitle(initialTransaction.title);
      setAmount(initialTransaction.amount.toString());
      setType(initialTransaction.type);
      setCategoryId(initialTransaction.categoryId);
      setDate(sanitizeDateForInput(initialTransaction.date));
      setNotes(initialTransaction.notes || '');
      setReceiptUrl(initialTransaction.receiptUrl || '');
      setReceiptFileName(initialTransaction.receiptFileName || '');
      setReceiptFileSize(initialTransaction.receiptFileSize);
    } else {
      resetForm();
    }
  }, [initialTransaction, isOpen, categories]);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setType('expense');
    const firstExpenseCat = categories.find(c => c.type === 'expense');
    setCategoryId(firstExpenseCat ? firstExpenseCat.id : (categories[0]?.id || ''));
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setReceiptUrl('');
    setReceiptFileName('');
    setReceiptFileSize(undefined);
    setFormError('');
    setUploadError('');
  };

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setUploadError('');
    setIsUploading(true);
    try {
      // First try standard multipart upload endpoint
      const result = await api.uploadReceipt(file);
      setReceiptUrl(result.url);
      setReceiptFileName(result.fileName);
      setReceiptFileSize(result.fileSize);
    } catch (err: any) {
      // Fallback to base64 reader if multipart fails in container
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const result = await api.uploadReceiptBase64(base64, file.name);
          setReceiptUrl(result.url);
          setReceiptFileName(result.fileName);
          setReceiptFileSize(result.fileSize);
        } catch (base64Err: any) {
          setUploadError('Failed to upload receipt: ' + base64Err.message);
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Error reading file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setFormError('Please enter a description or vendor title');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than ৳0');
      return;
    }
    if (!categoryId) {
      setFormError('Please select a category');
      return;
    }

    setSubmitting(true);
    try {
      if (initialTransaction) {
        await api.updateTransaction(initialTransaction.id, {
          title: title.trim(),
          amount: parsedAmount,
          type,
          categoryId,
          date,
          notes: notes.trim(),
          receiptUrl,
          receiptFileName,
          receiptFileSize,
        });
      } else {
        await api.createTransaction({
          title: title.trim(),
          amount: parsedAmount,
          type,
          categoryId,
          date,
          notes: notes.trim(),
          receiptUrl,
          receiptFileName,
          receiptFileSize,
        });
      }
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === type || c.type === 'expense');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh] sm:max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              {initialTransaction ? 'Edit Transaction' : 'Log New Transaction'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transactions are submitted to the Family Head for review and verification.
            </p>
          </div>
          <button
            id="btn-close-tx-modal"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 sm:space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              id="btn-type-expense"
              onClick={() => {
                setType('expense');
                const cat = categories.find(c => c.type === 'expense');
                if (cat) setCategoryId(cat.id);
              }}
              className={`min-h-[44px] sm:min-h-0 py-2.5 sm:py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Expense Submission
            </button>
            <button
              type="button"
              id="btn-type-income"
              onClick={() => {
                setType('income');
                const cat = categories.find(c => c.type === 'income');
                if (cat) setCategoryId(cat.id);
              }}
              className={`min-h-[44px] sm:min-h-0 py-2.5 sm:py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Income / Deposit
            </button>
          </div>

          {/* Title & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description / Title *
              </label>
              <input
                id="input-tx-title"
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Electric Bill August, Target Groceries"
                className="w-full min-h-[42px] sm:min-h-0 px-3.5 py-2 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Amount (BDT ৳) *
              </label>
              <div className="relative">
                <span className="font-bold text-slate-400 absolute left-3 top-2.5 sm:top-2 text-sm select-none">
                  {BDT_SYMBOL}
                </span>
                <input
                  id="input-tx-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-h-[42px] sm:min-h-0 pl-8 pr-3 py-2 text-base sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category *
                </label>
                <button
                  type="button"
                  id="btn-add-cat-inline"
                  onClick={onOpenNewCategory}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium min-h-[32px] sm:min-h-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> New Category
                </button>
              </div>
              <select
                id="select-tx-category"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                required
                className="w-full min-h-[42px] sm:min-h-0 px-3.5 py-2 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.monthlyBudget ? `(${formatBDT(cat.monthlyBudget, { hideDecimals: true })} budget)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date of Transaction
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 sm:top-2.5" />
                <input
                  id="input-tx-date"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full min-h-[42px] sm:min-h-0 pl-9 pr-3 py-2 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Receipt Proof & Screenshot Upload */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Proof Document / Screenshot (Receipt / Bill Copy)
              </label>
              {receiptUrl && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Attached
                </span>
              )}
            </div>

            {receiptUrl ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={receiptUrl}
                    alt="Receipt preview"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-white shrink-0"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {receiptFileName || 'Uploaded receipt image'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {receiptFileSize ? `${(receiptFileSize / 1024).toFixed(0)} KB • ` : ''}Ready for Admin verification
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[38px] px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptUrl('');
                      setReceiptFileName('');
                      setReceiptFileSize(undefined);
                    }}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Remove receipt"
                    aria-label="Remove receipt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500 mb-1.5 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {isUploading ? 'Uploading proof...' : 'Tap or drag receipt / bill screenshot here'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    PNG, JPG, WEBP, or PDF up to 15MB
                  </p>
                </div>
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{uploadError}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Notes or Context (Optional)
            </label>
            <textarea
              id="input-tx-notes"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Paid from personal debit card, reimbursement requested..."
              className="w-full px-3.5 py-2 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              id="btn-cancel-tx"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 sm:py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-tx"
              disabled={submitting || isUploading}
              className="min-h-[44px] px-5 py-2.5 sm:py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs active:scale-95"
            >
              {submitting ? 'Submitting...' : initialTransaction ? 'Save Changes' : 'Submit for Review'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
