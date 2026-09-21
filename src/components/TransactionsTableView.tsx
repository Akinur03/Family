import React, { useState } from 'react';
import { Transaction, Category, User } from '../types';
import { exportTransactionsToCsv } from '../utils/csvExport';
import { formatBDT, BDT_SYMBOL } from '../utils/currency';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  User as UserIcon,
  Tag,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  X,
} from 'lucide-react';

interface TransactionsTableViewProps {
  transactions: Transaction[];
  categories: Category[];
  users: User[];
  currentUserId?: string;
  isAdmin?: boolean;
  onInspectReceipt: (tx: Transaction) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onApproveTransaction?: (id: string) => Promise<void>;
  onRejectTransaction?: (id: string, notes: string) => Promise<void>;
  title?: string;
  subtitle?: string;
  onOpenGoogleSheets?: () => void;
}

export const TransactionsTableView: React.FC<TransactionsTableViewProps> = ({
  transactions,
  categories,
  users,
  currentUserId,
  isAdmin = false,
  onInspectReceipt,
  onEditTransaction,
  onDeleteTransaction,
  onApproveTransaction,
  onRejectTransaction,
  title = 'Family Transactions Ledger',
  subtitle = 'Review and manage daily expenses, income deposits, and proof documents.',
  onOpenGoogleSheets,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter logic
  const filtered = transactions.filter(tx => {
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
    if (memberFilter !== 'all' && tx.userId !== memberFilter) return false;
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchNotes = Boolean(tx.notes && tx.notes.toLowerCase().includes(q));
      const matchCat = tx.categoryName.toLowerCase().includes(q);
      const matchUser = tx.userName.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchCat && !matchUser) return false;
    }

    return true;
  });

  // Sort logic
  filtered.sort((a, b) => {
    if (sortBy === 'amount') {
      return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
    }
    return sortOrder === 'desc'
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDownloadCsv = () => {
    const isPersonal = title.toLowerCase().includes('personal') || title.toLowerCase().includes('my');
    const prefix = isPersonal ? 'my_transactions_ledger' : 'family_transactions_ledger';
    exportTransactionsToCsv(filtered, prefix);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      {/* Search & Filter Header Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle} ({filtered.length} entries shown)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick status tabs with mobile touch targets */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar max-w-full">
              {['all', 'pending', 'approved', 'rejected'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`min-h-[36px] sm:min-h-0 px-3 py-1.5 rounded-lg capitalize transition-all shrink-0 ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Google Sheets button */}
            {onOpenGoogleSheets && (
              <button
                id="btn-export-transactions-sheets"
                onClick={onOpenGoogleSheets}
                className="min-h-[38px] sm:min-h-0 py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
                title="Open Google Sheets Hub to export or sync transactions"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Google Sheets</span>
              </button>
            )}

            {/* Download CSV button */}
            <button
              id="btn-download-transactions-csv"
              onClick={handleDownloadCsv}
              disabled={filtered.length === 0}
              title={filtered.length === 0 ? 'No transactions to export' : `Export ${filtered.length} filtered transactions to CSV`}
              className="min-h-[38px] sm:min-h-0 py-1.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Prominent Real-time Search Input Bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-transactions-search-bar"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') setSearch('');
              }}
              placeholder="Search by transaction title, notes, or category name..."
              className="w-full pl-10 pr-24 py-2.5 sm:py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-xs"
            />
            {search && (
              <div className="absolute right-2 flex items-center gap-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hidden xs:inline-block">
                  {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
                </span>
                <button
                  id="btn-clear-transaction-search"
                  type="button"
                  onClick={() => setSearch('')}
                  className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                  title="Clear search (Esc)"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Secondary Dropdown Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {/* Category filter */}
            <div>
              <select
                id="select-category-filter"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full min-h-[42px] sm:min-h-0 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Member filter */}
            <div>
              <select
                id="select-member-filter"
                value={memberFilter}
                onChange={e => setMemberFilter(e.target.value)}
                className="w-full min-h-[42px] sm:min-h-0 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Family Members</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.relationship})
                  </option>
                ))}
              </select>
            </div>

            {/* Type filter */}
            <div>
              <select
                id="select-type-filter"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full min-h-[42px] sm:min-h-0 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Types (Expense & Income)</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs space-y-2">
            <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {search.trim()
                ? `No transactions found matching "${search}"`
                : 'No transactions match the selected filters'}
            </p>
            <p className="text-slate-400">
              {search.trim()
                ? 'Try checking the title, category, or note spelling, or clear the search.'
                : 'Try adjusting your status or category filters.'}
            </p>
            {search.trim() && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-2 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear search</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile View: Responsive Touch-Friendly Card Feed */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(tx => {
                const isOwner = tx.userId === currentUserId;
                const canEdit = isAdmin || (isOwner && tx.status !== 'approved');
                const canDelete = isAdmin || (isOwner && tx.status === 'pending');
                const hasReceipt = Boolean(tx.receiptUrl);

                return (
                  <div
                    key={`mobile-${tx.id}`}
                    id={`tx-card-mobile-${tx.id}`}
                    className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Header: Title, Category & Amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{
                              backgroundColor: `${tx.categoryColor || '#10b981'}18`,
                              color: tx.categoryColor || '#10b981',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: tx.categoryColor || '#10b981' }}
                            />
                            {tx.categoryName}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              tx.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                : tx.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {tx.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                            {tx.status === 'rejected' && <XCircle className="w-3 h-3" />}
                            {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                            <span>{tx.status}</span>
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                          {tx.title}
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-bold text-base ${
                            tx.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}{formatBDT(tx.amount)}
                        </span>
                        <span className="block text-[10px] text-slate-400 capitalize">
                          {tx.type}
                        </span>
                      </div>
                    </div>

                    {/* Subtitle / Notes / Review Notes */}
                    {tx.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        {tx.notes}
                      </p>
                    )}
                    {tx.reviewNotes && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 italic bg-amber-50/50 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                        Review note: {tx.reviewNotes}
                      </p>
                    )}

                    {/* Meta info: Date & Member */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {tx.date}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tx.userName}</span>
                        {isOwner && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-0.5">
                            (You)
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Actions & Proof Bar */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div>
                        {hasReceipt ? (
                          <button
                            type="button"
                            onClick={() => onInspectReceipt(tx)}
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Proof Attached</span>
                            <Eye className="w-3 h-3 ml-0.5 opacity-70" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic pl-1">
                            No proof
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Admin quick approve on mobile */}
                        {isAdmin && tx.status === 'pending' && onApproveTransaction && (
                          <button
                            type="button"
                            onClick={() => onApproveTransaction(tx.id)}
                            className="min-h-[38px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1"
                            title="Approve transaction"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            className="min-h-[38px] min-w-[38px] p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center active:scale-95"
                            title="Edit transaction"
                            aria-label="Edit transaction"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="min-h-[38px] min-w-[38px] p-2 text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition-colors flex items-center justify-center active:scale-95"
                            title="Delete transaction"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop / Tablet View: Full Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th
                      onClick={() => toggleSort('date')}
                      className="px-5 py-3 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-5 py-3">Details / Vendor</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Member</th>
                    <th className="px-5 py-3">Receipt Proof</th>
                    <th className="px-5 py-3">Status</th>
                    <th
                      onClick={() => toggleSort('amount')}
                      className="px-5 py-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Amount (৳)</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map(tx => {
                    const isOwner = tx.userId === currentUserId;
                    const canEdit = isAdmin || (isOwner && tx.status !== 'approved');
                    const canDelete = isAdmin || (isOwner && tx.status === 'pending');
                    const hasReceipt = Boolean(tx.receiptUrl);

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Date */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                          {tx.date}
                        </td>

                        {/* Title & Notes */}
                        <td className="px-5 py-3.5 max-w-xs">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {tx.title}
                          </p>
                          {tx.notes && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {tx.notes}
                            </p>
                          )}
                          {tx.reviewNotes && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 italic">
                              Review note: {tx.reviewNotes}
                            </p>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: tx.categoryColor || '#10b981' }}
                            />
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {tx.categoryName}
                            </span>
                          </div>
                        </td>

                        {/* Member */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {tx.userName}
                          {isOwner && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-1 font-semibold">
                              (You)
                            </span>
                          )}
                        </td>

                        {/* Receipt */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {hasReceipt ? (
                            <button
                              onClick={() => onInspectReceipt(tx)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Proof Attached</span>
                              <Eye className="w-3 h-3 ml-0.5 opacity-70" />
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              No proof
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                              tx.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                : tx.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                            }`}
                          >
                            {tx.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                            {tx.status === 'rejected' && <XCircle className="w-3 h-3" />}
                            {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                            <span>{tx.status}</span>
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          <span
                            className={`font-bold text-sm ${
                              tx.type === 'income'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}{formatBDT(tx.amount)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {hasReceipt && (
                              <button
                                onClick={() => onInspectReceipt(tx)}
                                title="Inspect Receipt & Review"
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            {canEdit && (
                              <button
                                onClick={() => onEditTransaction(tx)}
                                title="Edit transaction"
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() => onDeleteTransaction(tx.id)}
                                title="Delete transaction"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Quick Admin Actions if pending */}
                            {isAdmin && tx.status === 'pending' && onApproveTransaction && (
                              <button
                                onClick={() => onApproveTransaction(tx.id)}
                                title="Quick Approve"
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-[10px] transition-colors ml-1"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
