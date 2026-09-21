import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, Category, User, FinancialSummaryReport } from '../types';
import { useGoogleSheets } from '../context/GoogleSheetsContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import { GoogleSheetsConfirmModal } from './GoogleSheetsConfirmModal';
import { formatBDT } from '../utils/currency';
import {
  listDriveSpreadsheets,
  createKinFinanceSpreadsheet,
  appendTransactionsToSheet,
  getSpreadsheetDetails,
  readSpreadsheetValues,
  parseSheetRowsToTransactions,
  DriveSpreadsheetFile,
  SpreadsheetDetails,
} from '../services/googleSheets';
import {
  Table2,
  ExternalLink,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  Clock,
  Shield,
  FileText,
  User as UserIcon,
} from 'lucide-react';

interface GoogleSheetsViewProps {
  transactions: Transaction[];
  categories: Category[];
  users: User[];
  summary: FinancialSummaryReport | null;
  onRefreshData: () => Promise<void>;
  onImportTransactions: (
    items: Array<{
      title: string;
      amount: number;
      type: 'expense' | 'income';
      categoryId: string;
      date: string;
      notes?: string;
    }>
  ) => Promise<void>;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  transactions,
  categories,
  users,
  summary,
  onRefreshData,
  onImportTransactions,
  onShowToast,
}) => {
  const {
    isGoogleConnected,
    googleUser,
    googleAccessToken,
    isLoading: isAuthLoading,
    error: authError,
    connectGoogle,
    disconnectGoogle,
    clearError,
  } = useGoogleSheets();

  // Active section tab
  const [subTab, setSubTab] = useState<'export' | 'browse' | 'import'>('export');

  // Export to new sheet state
  const [exportTitle, setExportTitle] = useState<string>(
    `KinFinance Family Financial Ledger (${new Date().toISOString().slice(0, 10)})`
  );
  const [exportFilter, setExportFilter] = useState<'all' | 'approved' | 'pending'>('approved');
  const [includeSummaryTabs, setIncludeSummaryTabs] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [lastExportedSheet, setLastExportedSheet] = useState<{ id: string; url: string; title: string } | null>(null);

  // Drive sheets list
  const [driveSheets, setDriveSheets] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Append / Sync to existing sheet state
  const [targetSpreadsheet, setTargetSpreadsheet] = useState<DriveSpreadsheetFile | null>(null);
  const [targetDetails, setTargetDetails] = useState<SpreadsheetDetails | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('');
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isAppending, setIsAppending] = useState<boolean>(false);

  // Import from sheet state
  const [importSpreadsheetId, setImportSpreadsheetId] = useState<string>('');
  const [importRange, setImportRange] = useState<string>('Sheet1!A1:Z50');
  const [isReadingSheet, setIsReadingSheet] = useState<boolean>(false);
  const [previewRows, setPreviewRows] = useState<
    Array<{
      date: string;
      title: string;
      amount: number;
      type: 'expense' | 'income';
      categoryName: string;
      notes?: string;
      selected: boolean;
      matchedCategoryId?: string;
    }>
  >([]);
  const [isSubmittingImport, setIsSubmittingImport] = useState<boolean>(false);

  // Filter transactions for export
  const filteredTransactions = transactions.filter(t => {
    if (exportFilter === 'all') return true;
    return t.status === exportFilter;
  });

  // Fetch drive spreadsheets when connected
  const loadDriveSheets = useCallback(async () => {
    if (!googleAccessToken) return;
    setIsLoadingDrive(true);
    try {
      const files = await listDriveSpreadsheets(googleAccessToken);
      setDriveSheets(files);
    } catch (err: any) {
      console.error('Failed to list drive spreadsheets', err);
      onShowToast(err.message || 'Failed to fetch Google Sheets from Drive', 'error');
    } finally {
      setIsLoadingDrive(false);
    }
  }, [googleAccessToken, onShowToast]);

  useEffect(() => {
    if (isGoogleConnected && googleAccessToken) {
      loadDriveSheets();
    }
  }, [isGoogleConnected, googleAccessToken, loadDriveSheets]);

  // Handle export to new spreadsheet
  const handleCreateAndExport = async () => {
    if (!googleAccessToken) {
      onShowToast('Please connect your Google account first', 'error');
      return;
    }

    if (filteredTransactions.length === 0 && !includeSummaryTabs) {
      onShowToast('No transactions match the selected filter', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const result = await createKinFinanceSpreadsheet(
        googleAccessToken,
        exportTitle.trim() || 'KinFinance Family Ledger',
        filteredTransactions,
        includeSummaryTabs ? summary : null
      );
      setLastExportedSheet({
        id: result.spreadsheetId,
        url: result.spreadsheetUrl,
        title: exportTitle.trim() || 'KinFinance Family Ledger',
      });
      onShowToast('Google Sheet created and formatted successfully!');
      loadDriveSheets();
    } catch (err: any) {
      console.error('Export failed', err);
      onShowToast(err.message || 'Failed to create Google Sheet', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle selecting a sheet to inspect tabs for appending
  const handleSelectSheetForAppend = async (sheet: DriveSpreadsheetFile) => {
    if (!googleAccessToken) return;
    setTargetSpreadsheet(sheet);
    setIsLoadingDetails(true);
    try {
      const details = await getSpreadsheetDetails(googleAccessToken, sheet.id);
      setTargetDetails(details);
      if (details.sheets.length > 0) {
        setSelectedSheetTab(details.sheets[0].title);
      }
    } catch (err: any) {
      console.error('Failed to get sheet details', err);
      onShowToast(err.message || 'Failed to inspect spreadsheet tabs', 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle confirmation to append rows to existing sheet
  const handleExecuteAppend = async () => {
    if (!googleAccessToken || !targetSpreadsheet || !selectedSheetTab) return;

    setIsAppending(true);
    try {
      const result = await appendTransactionsToSheet(
        googleAccessToken,
        targetSpreadsheet.id,
        selectedSheetTab,
        filteredTransactions
      );
      setIsConfirmModalOpen(false);
      onShowToast(`Appended ${result.updatedRows} transactions to "${targetSpreadsheet.name}" (${selectedSheetTab})!`);
    } catch (err: any) {
      console.error('Append failed', err);
      onShowToast(err.message || 'Failed to append to spreadsheet', 'error');
    } finally {
      setIsAppending(false);
    }
  };

  // Read range for importing
  const handleReadSheetForImport = async (sheetIdToRead?: string) => {
    if (!googleAccessToken) {
      onShowToast('Please connect your Google account first', 'error');
      return;
    }

    const id = sheetIdToRead || importSpreadsheetId.trim();
    if (!id) {
      onShowToast('Please provide a Google Spreadsheet ID or select a sheet', 'error');
      return;
    }

    setIsReadingSheet(true);
    setPreviewRows([]);
    try {
      const rawRows = await readSpreadsheetValues(googleAccessToken, id, importRange.trim() || 'Sheet1!A1:Z50');
      const candidates = parseSheetRowsToTransactions(rawRows);

      if (candidates.length === 0) {
        onShowToast('No transaction rows could be detected in the specified range.', 'error');
      } else {
        // Match category names with existing categories or default to first category
        const mapped = candidates.map(c => {
          const matched = categories.find(cat =>
            cat.name.toLowerCase() === c.categoryName.toLowerCase() ||
            c.title.toLowerCase().includes(cat.name.toLowerCase())
          );
          return {
            ...c,
            selected: true,
            matchedCategoryId: matched ? matched.id : categories[0]?.id || '',
          };
        });
        setPreviewRows(mapped);
        onShowToast(`Detected ${mapped.length} candidate transaction rows!`);
      }
    } catch (err: any) {
      console.error('Read sheet failed', err);
      onShowToast(err.message || 'Failed to read spreadsheet range', 'error');
    } finally {
      setIsReadingSheet(false);
    }
  };

  // Execute import of selected rows
  const handleConfirmImport = async () => {
    const selected = previewRows.filter(r => r.selected);
    if (selected.length === 0) {
      onShowToast('No rows selected to import', 'error');
      return;
    }

    setIsSubmittingImport(true);
    try {
      const itemsToImport = selected.map(item => ({
        title: item.title,
        amount: item.amount,
        type: item.type,
        categoryId: item.matchedCategoryId || categories[0]?.id || '',
        date: item.date,
        notes: item.notes ? `${item.notes} (Imported from Google Sheets)` : 'Imported from Google Sheets',
      }));

      await onImportTransactions(itemsToImport);
      setPreviewRows([]);
      onShowToast(`Successfully imported ${itemsToImport.length} transactions into KinFinance!`);
      await onRefreshData();
    } catch (err: any) {
      console.error('Import failed', err);
      onShowToast(err.message || 'Failed to import transactions', 'error');
    } finally {
      setIsSubmittingImport(false);
    }
  };

  const filteredDriveSheets = driveSheets.filter(s =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Google Workspace Connection Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Brand & Explanation */}
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Google Sheets & Drive Integration
                  </h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Cloud Workspace
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Export family ledgers, synchronize budget reports, and import external accounting spreadsheets with permission.
                </p>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center justify-between gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{authError}</span>
                </div>
                <button
                  onClick={clearError}
                  className="text-rose-700 dark:text-rose-300 hover:underline font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Connection State / Button */}
          <div className="shrink-0 flex items-center gap-3">
            {isGoogleConnected && googleUser ? (
              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google Account'}
                    className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    {googleUser.displayName?.charAt(0) || googleUser.email?.charAt(0) || 'G'}
                  </div>
                )}
                <div className="pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {googleUser.displayName || 'Google User'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[170px]">
                    {googleUser.email}
                  </span>
                </div>
                <button
                  onClick={disconnectGoogle}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
                  title="Disconnect Google account and clear in-memory token"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <GoogleSignInButton
                onClick={connectGoogle}
                isLoading={isAuthLoading}
                label="Connect with Google"
              />
            )}
          </div>

        </div>

        {/* Sub-Navigation Tabs */}
        {isGoogleConnected && (
          <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
            <button
              onClick={() => setSubTab('export')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                subTab === 'export'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export to New Google Sheet</span>
            </button>

            <button
              onClick={() => setSubTab('browse')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                subTab === 'browse'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Browse & Sync My Sheets ({driveSheets.length})</span>
            </button>

            <button
              onClick={() => setSubTab('import')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                subTab === 'import'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import from Google Sheet</span>
            </button>
          </div>
        )}
      </div>

      {/* When NOT connected: Informational Walkthrough Banner */}
      {!isGoogleConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              1-Click Formatted Spreadsheets
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Export approved transactions, monthly category limits, and member shares directly into Google Sheets with professional styling, currency formats, and frozen header rows.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sync to Existing Drive Files
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Browse your personal Google Drive spreadsheets and append new household expenses into your existing financial tracker with explicit user confirmation.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Bidirectional Data Import
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Read external bank transactions or credit card logs from any Google Sheet range and import them cleanly into KinFinance for verification and tracking.
            </p>
          </div>
        </div>
      )}

      {/* TAB 1: EXPORT TO NEW GOOGLE SHEET */}
      {isGoogleConnected && subTab === 'export' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export KinFinance Ledger to a New Google Spreadsheet</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Creates a multi-tab Google Sheet in your Drive with formatted tables, bold headers, and calculated financial summaries.
            </p>
          </div>

          {/* Configuration Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Spreadsheet Title
              </label>
              <input
                type="text"
                value={exportTitle}
                onChange={e => setExportTitle(e.target.value)}
                placeholder="e.g. KinFinance Family Ledger"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Transaction Status Filter
              </label>
              <select
                value={exportFilter}
                onChange={e => setExportFilter(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="approved">Approved & Verified Only ({transactions.filter(t => t.status === 'approved').length} items)</option>
                <option value="all">All Transactions ({transactions.length} items)</option>
                <option value="pending">Pending Verification Queue Only ({transactions.filter(t => t.status === 'pending').length} items)</option>
              </select>
            </div>
          </div>

          {/* Included Sheets Options */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Tabs to Generate in Google Sheet:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tab 1: Transactions Ledger ({filteredTransactions.length} rows)</span>
              </div>
              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSummaryTabs}
                  onChange={e => setIncludeSummaryTabs(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Include Tabs 2 & 3: Executive KPI Summary & Category Budgets</span>
              </label>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              {filteredTransactions.length} transactions ready for export
            </span>
            <button
              id="btn-create-google-sheet"
              onClick={handleCreateAndExport}
              disabled={isExporting}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Generating Google Sheet...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Create & Export Spreadsheet</span>
                </>
              )}
            </button>
          </div>

          {/* Last Created Success Banner */}
          {lastExportedSheet && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    "{lastExportedSheet.title}" was created in your Google Drive!
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Spreadsheet ID: <code className="font-mono">{lastExportedSheet.id}</code>
                  </p>
                </div>
              </div>
              <a
                href={lastExportedSheet.url}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
              >
                <span>Open in Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BROWSE & SYNC TO EXISTING SHEETS */}
      {isGoogleConnected && subTab === 'browse' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>My Google Drive Spreadsheets</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Browse existing spreadsheets in your Google account and append or sync transactions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search spreadsheets..."
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white w-48 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={loadDriveSheets}
                disabled={isLoadingDrive}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
                title="Refresh spreadsheets list"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingDrive ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Drive Sheets List */}
          {isLoadingDrive ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin mx-auto" />
              <p>Fetching spreadsheets from your Google Drive...</p>
            </div>
          ) : filteredDriveSheets.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                {searchFilter ? 'No matching spreadsheets found' : 'No Google Sheets found in your Drive'}
              </p>
              <p className="text-slate-400 mt-1">
                You can create a new one using the "Export to New Google Sheet" tab above!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {filteredDriveSheets.map(sheet => (
                <div
                  key={sheet.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Table2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {sheet.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Modified: {sheet.modifiedTime ? new Date(sheet.modifiedTime).toLocaleDateString() : 'N/A'}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">ID: {sheet.id.slice(0, 12)}...</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSelectSheetForAppend(sheet)}
                      className="py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Append Rows</span>
                    </button>

                    <button
                      onClick={() => {
                        setImportSpreadsheetId(sheet.id);
                        setSubTab('import');
                        handleReadSheetForImport(sheet.id);
                      }}
                      className="py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Inspect & Import</span>
                    </button>

                    {sheet.webViewLink && (
                      <a
                        href={sheet.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Open in Google Sheets"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Append Configuration Panel when sheet is selected */}
          {targetSpreadsheet && (
            <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Append Transactions into "{targetSpreadsheet.name}"
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Select target sheet tab and review row count.
                  </p>
                </div>
                <button
                  onClick={() => setTargetSpreadsheet(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Close
                </button>
              </div>

              {isLoadingDetails ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-1" />
                  Loading sheet tabs...
                </div>
              ) : targetDetails ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Target Sheet Tab
                    </label>
                    <select
                      value={selectedSheetTab}
                      onChange={e => setSelectedSheetTab(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      {targetDetails.sheets.map(s => (
                        <option key={s.sheetId} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      id="btn-open-confirm-append"
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Append {filteredTransactions.length} Transactions</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: IMPORT FROM GOOGLE SHEET */}
      {isGoogleConnected && subTab === 'import' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Import Transactions from a Google Spreadsheet</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Reads external expense and income rows from your Google Sheet, matches categories, and records them into KinFinance.
            </p>
          </div>

          {/* Range selection form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Spreadsheet ID or URL
              </label>
              <input
                type="text"
                value={importSpreadsheetId}
                onChange={e => setImportSpreadsheetId(e.target.value)}
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms or select from Browse tab"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cell Range
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={importRange}
                  onChange={e => setImportRange(e.target.value)}
                  placeholder="Sheet1!A1:Z50"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => handleReadSheetForImport()}
                  disabled={isReadingSheet}
                  className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isReadingSheet ? 'Reading...' : 'Fetch'}
                </button>
              </div>
            </div>
          </div>

          {/* Candidate rows preview table */}
          {previewRows.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Detected Candidate Rows ({previewRows.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Verify matched categories and select rows to import into KinFinance.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewRows(prev => prev.map(r => ({ ...r, selected: true })))}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    onClick={() => setPreviewRows(prev => prev.map(r => ({ ...r, selected: false })))}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0">
                    <tr>
                      <th className="p-3 w-10">
                        <input
                          type="checkbox"
                          checked={previewRows.every(r => r.selected)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setPreviewRows(prev => prev.map(r => ({ ...r, selected: checked })));
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Vendor / Title</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Amount (BDT ৳)</th>
                      <th className="p-3">Assign Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={e => {
                              const checked = e.target.checked;
                              setPreviewRows(prev =>
                                prev.map((r, i) => (i === idx ? { ...r, selected: checked } : r))
                              );
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {row.date}
                        </td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">
                          {row.title}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                              row.type === 'expense'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">
                          {formatBDT(row.amount)}
                        </td>
                        <td className="p-3">
                          <select
                            value={row.matchedCategoryId}
                            onChange={e => {
                              const newCatId = e.target.value;
                              setPreviewRows(prev =>
                                prev.map((r, i) => (i === idx ? { ...r, matchedCategoryId: newCatId } : r))
                              );
                            }}
                            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  {previewRows.filter(r => r.selected).length} of {previewRows.length} items selected for import
                </span>
                <button
                  id="btn-confirm-import-transactions"
                  onClick={handleConfirmImport}
                  disabled={isSubmittingImport || previewRows.filter(r => r.selected).length === 0}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingImport ? (
                    'Importing...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Import {previewRows.filter(r => r.selected).length} Transactions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mandatory User Confirmation Modal for Mutating / Appending to User's Google Sheet */}
      <GoogleSheetsConfirmModal
        isOpen={isConfirmModalOpen}
        title="Append Rows to Google Sheet"
        description={`You are about to append ${filteredTransactions.length} transaction entries to the spreadsheet "${targetSpreadsheet?.name}" in tab "${selectedSheetTab}".`}
        details={[
          `Target Spreadsheet: ${targetSpreadsheet?.name}`,
          `Target Tab: ${selectedSheetTab}`,
          `Rows to Append: ${filteredTransactions.length} entries`,
          `Authorized Account: ${googleUser?.email}`,
        ]}
        confirmLabel="Confirm & Append"
        isLoading={isAppending}
        onConfirm={handleExecuteAppend}
        onClose={() => setIsConfirmModalOpen(false)}
      />

    </div>
  );
};
