import React, { useState } from 'react';
import { Transaction, Category, User } from '../types';
import { exportTransactionsToCsv } from '../utils/csvExport';
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
      const q = search.toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchUser = tx.userName.toLowerCase().includes(q);
      const matchCat = tx.categoryName.toLowerCase().includes(q);
      const matchNotes = tx.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchUser && !matchCat && !matchNotes) return false;
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle} ({filtered.length} entries shown)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Quick status tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
              {['all', 'pending', 'approved', 'rejected'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all shrink-0 ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Download CSV button */}
            <button
              id="btn-download-transactions-csv"
              onClick={handleDownloadCsv}
              disabled={filtered.length === 0}
              title={filtered.length === 0 ? 'No transactions to export' : `Export ${filtered.length} filtered transactions to CSV`}
              className="py-1.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vendor, description, notes..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
              value={memberFilter}
              onChange={e => setMemberFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Types (Expense & Income)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No transactions match the selected filters or search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                      <span>Amount</span>
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
                          {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
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
        )}
      </div>
    </div>
  );
};
