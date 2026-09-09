import { Transaction, FinancialSummaryReport } from '../types';

/**
 * Escapes a single CSV cell value according to RFC 4180
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // If string contains comma, double-quote, or newline, escape double quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Triggers a browser file download of CSV content
 */
export function downloadCsv(filename: string, csvContent: string): void {
  // Prepend UTF-8 BOM so Excel opens non-ASCII characters without encoding glitches
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports an array of transactions to a CSV format formatted for external accounting software
 */
export function exportTransactionsToCsv(transactions: Transaction[], filenamePrefix = 'transactions_ledger'): void {
  const headers = [
    'Date',
    'Title / Description',
    'Type',
    'Category',
    'Amount ($)',
    'Member Name',
    'Status',
    'Receipt Proof Attached',
    'Receipt File Name',
    'Member Notes',
    'Reviewed By',
    'Review Notes',
    'Transaction ID',
    'Created Timestamp',
  ];

  const rows = transactions.map(tx => [
    tx.date,
    tx.title,
    tx.type.toUpperCase(),
    tx.categoryName,
    tx.amount.toFixed(2),
    tx.userName,
    tx.status.toUpperCase(),
    tx.receiptUrl ? 'YES' : 'NO',
    tx.receiptFileName || '',
    tx.notes || '',
    tx.reviewedByName || '',
    tx.reviewNotes || '',
    tx.id,
    tx.createdAt,
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`${filenamePrefix}_${dateStr}.csv`, csvContent);
}

/**
 * Exports the financial summary report to a structured CSV for external accounting and audits
 */
export function exportFinancialSummaryToCsv(summary: FinancialSummaryReport, filenamePrefix = 'family_financial_summary'): void {
  const lines: string[] = [];

  // Header / Title section
  lines.push(['=== KINFINANCE FAMILY FINANCIAL SUMMARY REPORT ==='].map(escapeCsvCell).join(','));
  lines.push(['Generated At', new Date().toLocaleString()].map(escapeCsvCell).join(','));
  lines.push(['Billing Cycle / Scope', 'Consolidated Family Accounting'].map(escapeCsvCell).join(','));
  lines.push('');

  // 1. EXECUTIVE KPI SUMMARY
  lines.push(['--- 1. EXECUTIVE FINANCIAL METRICS ---'].map(escapeCsvCell).join(','));
  lines.push(['Metric', 'Amount / Value ($)', 'Description'].map(escapeCsvCell).join(','));
  lines.push([
    'Total Approved Family Expenses',
    summary.totalApprovedExpenses.toFixed(2),
    'Verified receipts approved by Family Head',
  ].map(escapeCsvCell).join(','));
  lines.push([
    'Total Approved Family Inflow / Income',
    summary.totalApprovedIncome.toFixed(2),
    'Verified family deposits and income',
  ].map(escapeCsvCell).join(','));
  lines.push([
    'Net Family Reserve / Savings',
    summary.netSavings.toFixed(2),
    summary.netSavings >= 0 ? 'Surplus retained in family vault' : 'Deficit across current period',
  ].map(escapeCsvCell).join(','));
  lines.push([
    'Total Pending in Approval Queue',
    summary.pendingAmount.toFixed(2),
    `${summary.pendingCount} transactions awaiting verification`,
  ].map(escapeCsvCell).join(','));
  lines.push([
    'Total Rejected Submissions',
    summary.rejectedCount.toString(),
    'Transactions declined with reviewer remarks',
  ].map(escapeCsvCell).join(','));
  lines.push('');

  // 2. CATEGORY BREAKDOWN
  lines.push(['--- 2. CATEGORY EXPENDITURE BREAKDOWN ---'].map(escapeCsvCell).join(','));
  lines.push([
    'Category ID',
    'Category Name',
    'Total Spent ($)',
    'Share (%)',
    'Transactions Count',
    'Monthly Budget Limit ($)',
    'Budget Utilization (%)',
    'Budget Status',
  ].map(escapeCsvCell).join(','));

  summary.categoryBreakdown.forEach(cat => {
    const budget = cat.budget || 0;
    const utilPercent = budget > 0 ? ((cat.amount / budget) * 100).toFixed(1) : 'N/A';
    const status = budget > 0 && cat.amount > budget ? 'OVER BUDGET' : budget > 0 ? 'Within Budget' : 'No Budget Set';
    lines.push([
      cat.categoryId,
      cat.categoryName,
      cat.amount.toFixed(2),
      `${cat.percentage}%`,
      cat.count.toString(),
      budget > 0 ? budget.toFixed(2) : '0.00',
      utilPercent === 'N/A' ? 'N/A' : `${utilPercent}%`,
      status,
    ].map(escapeCsvCell).join(','));
  });
  lines.push('');

  // 3. MEMBER CONTRIBUTIONS
  lines.push(['--- 3. MEMBER SPENDING CONTRIBUTIONS ---'].map(escapeCsvCell).join(','));
  lines.push([
    'User ID',
    'Member Name',
    'Relationship',
    'Total Spent ($)',
    'Share of Approved Expenses (%)',
    'Transactions Count',
  ].map(escapeCsvCell).join(','));

  summary.memberContributions.forEach(mem => {
    lines.push([
      mem.userId,
      mem.userName,
      mem.relationship,
      mem.totalSpent.toFixed(2),
      `${mem.percentage}%`,
      mem.transactionCount.toString(),
    ].map(escapeCsvCell).join(','));
  });
  lines.push('');

  // 4. RECENT ACTIVITY DETAIL
  lines.push(['--- 4. DETAILED TRANSACTION LOG ---'].map(escapeCsvCell).join(','));
  lines.push([
    'Date',
    'Title / Vendor',
    'Type',
    'Category',
    'Amount ($)',
    'Submitted By',
    'Status',
    'Receipt Proof Attached',
    'Notes',
    'Reviewed By',
    'Review Remarks',
  ].map(escapeCsvCell).join(','));

  summary.recentActivity.forEach(tx => {
    lines.push([
      tx.date,
      tx.title,
      tx.type.toUpperCase(),
      tx.categoryName,
      tx.amount.toFixed(2),
      tx.userName,
      tx.status.toUpperCase(),
      tx.receiptUrl ? 'YES' : 'NO',
      tx.notes || '',
      tx.reviewedByName || '',
      tx.reviewNotes || '',
    ].map(escapeCsvCell).join(','));
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`${filenamePrefix}_${dateStr}.csv`, lines.join('\r\n'));
}
