import React, { useState, useMemo } from 'react';
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
  FileSpreadsheet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface FinancialReportsViewProps {
  summary: FinancialSummaryReport | null;
  transactions?: Transaction[];
  onInspectReceipt: (tx: Transaction) => void;
  onOpenGoogleSheets?: () => void;
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
  transactions = [],
  onInspectReceipt,
  onOpenGoogleSheets,
}) => {
  const [statusScope, setStatusScope] = useState<'approved' | 'all'>('approved');

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

  // Source transactions: prefer props.transactions if provided, fallback to summary.recentActivity
  const sourceTransactions = useMemo(() => {
    if (transactions && transactions.length > 0) return transactions;
    return recentActivity || [];
  }, [transactions, recentActivity]);

  // Aggregate monthly expenses versus income
  const monthlyChartData = useMemo(() => {
    const monthMap: Record<string, { income: number; expenses: number; count: number }> = {};

    sourceTransactions.forEach(tx => {
      if (!tx.date) return;
      if (statusScope === 'approved' && tx.status !== 'approved') return;
      if (statusScope === 'all' && tx.status === 'rejected') return;

      const date = new Date(tx.date);
      if (isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) {
        monthMap[key] = { income: 0, expenses: 0, count: 0 };
      }
      if (tx.type === 'income') {
        monthMap[key].income += tx.amount;
      } else {
        monthMap[key].expenses += tx.amount;
      }
      monthMap[key].count += 1;
    });

    // Establish continuous chronological months (at least past 6 months leading up to latest or current)
    let anchorDate = new Date();
    const existingKeys = Object.keys(monthMap).sort();
    if (existingKeys.length > 0) {
      const latestKey = existingKeys[existingKeys.length - 1];
      const [y, m] = latestKey.split('-').map(Number);
      anchorDate = new Date(y, m - 1, 1);
    }

    const finalKeysSet = new Set<string>(existingKeys);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      finalKeysSet.add(key);
      if (!monthMap[key]) {
        monthMap[key] = { income: 0, expenses: 0, count: 0 };
      }
    }

    const sortedKeys = Array.from(finalKeysSet).sort();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return sortedKeys.map(key => {
      const [y, m] = key.split('-').map(Number);
      const label = `${monthNames[m - 1]} ${y}`;
      const shortLabel = `${monthNames[m - 1]}`;
      const data = monthMap[key] || { income: 0, expenses: 0, count: 0 };
      const net = data.income - data.expenses;

      return {
        key,
        month: label,
        shortMonth: shortLabel,
        income: Number(data.income.toFixed(2)),
        expenses: Number(data.expenses.toFixed(2)),
        net: Number(net.toFixed(2)),
        count: data.count,
      };
    });
  }, [sourceTransactions, statusScope]);

  // Aggregate stats across the plotted chart timeline
  const chartTotals = useMemo(() => {
    const totalIncome = monthlyChartData.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpenses = monthlyChartData.reduce((acc, curr) => acc + curr.expenses, 0);
    const monthsWithActivity = monthlyChartData.filter(m => m.income > 0 || m.expenses > 0);
    const activeCount = Math.max(monthsWithActivity.length, 1);
    const avgExpense = totalExpenses / activeCount;
    const avgIncome = totalIncome / activeCount;
    const netSavingsPeriod = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavingsPeriod / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      avgExpense,
      avgIncome,
      netSavingsPeriod,
      savingsRate,
    };
  }, [monthlyChartData]);

  const handleDownloadSummaryCsv = () => {
    exportFinancialSummaryToCsv(summary, 'family_financial_summary');
  };

  // Custom Recharts Tooltip styled to the KinFinance design theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incomeVal = payload.find((p: any) => p.dataKey === 'income')?.value ?? 0;
      const expensesVal = payload.find((p: any) => p.dataKey === 'expenses')?.value ?? 0;
      const netVal = incomeVal - expensesVal;
      const monthItem = monthlyChartData.find(m => m.shortMonth === label || m.month === label);
      const fullMonthName = monthItem?.month || label;

      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xl text-xs space-y-2.5 min-w-48">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-bold text-slate-900 dark:text-white">{fullMonthName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              {monthItem?.count || 0} transaction{(monthItem?.count || 0) === 1 ? '' : 's'}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
                Income / Inflow:
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ${incomeVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0" />
                Expenses:
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                ${expensesVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Net Balance:</span>
            <span className={`font-bold ${netVal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {netVal >= 0 ? '+' : ''}${netVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      );
    }
    return null;
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenGoogleSheets && (
            <button
              id="btn-reports-google-sheets"
              onClick={onOpenGoogleSheets}
              className="py-2 px-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0"
              title="Export formatted report tabs directly to Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Google Sheets</span>
            </button>
          )}

          <button
            id="btn-download-financial-summary-csv"
            onClick={handleDownloadSummaryCsv}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0"
            title="Download consolidated family financial report and monthly summary as CSV for accounting"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
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

      {/* Monthly Expenses vs Income Bar Chart (Recharts) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Monthly Cash Flow: Expenses vs. Income
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Visual Trends
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comparing monthly family expenditures against total household inflows to track net savings momentum.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Status Scope Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusScope('approved')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusScope === 'approved'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Approved Only
              </button>
              <button
                type="button"
                onClick={() => setStatusScope('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusScope === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Include Pending
              </button>
            </div>

            {/* Custom Chart Legend Badges */}
            <div className="hidden md:flex items-center gap-3 text-xs pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Expenses</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Trend Sub-Metric Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span>Avg. Monthly Expenses</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              ${chartTotals.avgExpense.toFixed(2)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span>Avg. Monthly Income</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              ${chartTotals.avgIncome.toFixed(2)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span>Net Savings Rate</span>
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <p className={`text-base font-bold ${chartTotals.savingsRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {chartTotals.savingsRate.toFixed(1)}% ({chartTotals.netSavingsPeriod >= 0 ? '+' : ''}${chartTotals.netSavingsPeriod.toFixed(2)})
            </p>
          </div>
        </div>

        {/* Recharts BarChart Canvas */}
        <div className="h-72 sm:h-80 w-full min-w-0 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyChartData}
              margin={{ top: 10, right: 12, left: -10, bottom: 4 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#94a3b8"
                opacity={0.2}
              />
              <XAxis
                dataKey="shortMonth"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1', strokeWidth: 1, opacity: 0.3 }}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
              <Bar
                dataKey="income"
                name="Income"
                fill="#10b981"
                radius={[5, 5, 0, 0]}
                maxBarSize={42}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#f43f5e"
                radius={[5, 5, 0, 0]}
                maxBarSize={42}
              />
            </BarChart>
          </ResponsiveContainer>
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
