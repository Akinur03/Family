import React from 'react';
import { FinancialSummaryReport, Transaction } from '../types';
import { exportFinancialSummaryToCsv } from '../utils/csvExport';
import {
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Clock,
  PieChart,
  Users,
  CheckCircle2,
  FileCheck,
  Zap,
  Wifi,
  Home,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Car,
  Wallet,
  Tag,
  Download,
} from 'lucide-react';

interface FinancialReportsViewProps {
  summary: FinancialSummaryReport | null;
  onInspectReceipt: (tx: Transaction) => void;
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

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  summary,
  onInspectReceipt,
}) => {
  if (!summary) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Loading consolidated family financial metrics...
      </div>
    );
  }

  const {
    totalApprovedExpenses,
    totalApprovedIncome,
    netSavings,
    pendingCount,
    pendingAmount,
    categoryBreakdown,
    memberContributions,
    recentActivity,
  } = summary;

  const handleDownloadSummaryCsv = () => {
    exportFinancialSummaryToCsv(summary, 'family_financial_summary');
  };

  return (
    <div className="space-y-6">
      {/* View Header & CSV Export */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Family Financial Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Consolidated summaries, budget allocations, and verified household expenditure metrics.
          </p>
        </div>

        <button
          id="btn-download-financial-summary-csv"
          onClick={handleDownloadSummaryCsv}
          className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0 self-start sm:self-auto"
          title="Download consolidated family financial report and monthly summary as CSV for accounting"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download CSV Report</span>
        </button>
      </div>

      {/* 4 KPI Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Approved Family Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            ${totalApprovedExpenses.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Verified receipts by Family Head
          </p>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Family Inflow & Income
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            ${totalApprovedIncome.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Total verified family deposits
          </p>
        </div>

        {/* Net Savings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Net Family Reserve
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-bold ${
              netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            ${netSavings.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {netSavings >= 0 ? 'Surplus retained in family vault' : 'Deficit across current billing cycle'}
          </p>
        </div>

        {/* Pending Verification */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Pending In Queue
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            ${pendingAmount.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {pendingCount} transaction{pendingCount === 1 ? '' : 's'} awaiting approval
          </p>
        </div>
      </div>

      {/* Grid: Category Breakdown & Member Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Family Expense Categories Breakdown
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {categoryBreakdown.length} active categories
            </span>
          </div>

          <div className="space-y-4">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No approved expenses logged yet.
              </p>
            ) : (
              categoryBreakdown.map(item => {
                const IconComponent = ICON_MAP[item.icon] || Tag;
                const budget = item.budget || 0;
                const isOverBudget = budget > 0 && item.amount > budget;
                const budgetPercent = budget > 0 ? Math.min(Math.round((item.amount / budget) * 100), 100) : 0;

                return (
                  <div key={item.categoryId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: item.color || '#10b981' }}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.categoryName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({item.count} tx{item.count === 1 ? '' : 's'})
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ${item.amount.toFixed(2)}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1.5">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color || '#10b981',
                        }}
                      />
                    </div>

                    {/* Budget Context */}
                    {budget > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>
                          Monthly Budget: ${budget.toFixed(0)}
                        </span>
                        <span className={isOverBudget ? 'text-rose-500 font-bold' : 'text-slate-500'}>
                          {isOverBudget ? 'Budget Exceeded!' : `${budgetPercent}% of monthly limit`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Member Contributions Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Member Spending Share
                </h3>
              </div>
            </div>

            <div className="space-y-3.5">
              {memberContributions.map(member => (
                <div
                  key={member.userId}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {member.userName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {member.relationship} • {member.transactionCount} entries
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 dark:text-white">
                        ${member.totalSpent.toFixed(2)}
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {member.percentage}% of total
                      </p>
                    </div>
                  </div>

                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${member.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <p className="flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Figures only reflect expenditures approved by the Family Head.
              </span>
            </p>
          </div>
        </div>

      </div>

      {/* Recent Ledger Activity */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Recent Family Financial Submissions
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentActivity.map(tx => (
            <div
              key={tx.id}
              className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tx.categoryColor || '#10b981' }}
                />
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {tx.title}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {tx.userName} • {tx.categoryName} • {tx.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {tx.receiptUrl && (
                  <button
                    onClick={() => onInspectReceipt(tx)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1"
                  >
                    View Proof
                  </button>
                )}

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    tx.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : tx.status === 'rejected'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {tx.status}
                </span>

                <span
                  className={`font-bold text-sm ${
                    tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
