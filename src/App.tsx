import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleSheetsProvider } from './context/GoogleSheetsContext';
import { api } from './services/api';
import { Transaction, Category, User, FinancialSummaryReport } from './types';
import { Navbar, ActiveTab } from './components/Navbar';
import { RoleSwitcherBar } from './components/RoleSwitcherBar';
import { FinancialReportsView } from './components/FinancialReportsView';
import { TransactionsTableView } from './components/TransactionsTableView';
import { AdminApprovalQueue } from './components/AdminApprovalQueue';
import { AdminUserManagement } from './components/AdminUserManagement';
import { CategoriesView } from './components/CategoriesView';
import { GoogleSheetsView } from './components/GoogleSheetsView';
import { SchemaArchitectureView } from './components/SchemaArchitectureView';
import { TransactionModal } from './components/TransactionModal';
import { CategoryModal } from './components/CategoryModal';
import { ReceiptModal } from './components/ReceiptModal';
import { AuthModal } from './components/AuthModal';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

function AppContent() {
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<FinancialSummaryReport | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [inspectingReceiptTx, setInspectingReceiptTx] = useState<Transaction | null>(null);

  // Toast banner
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [txData, catData, userData, summaryData] = await Promise.all([
        api.getTransactions(),
        api.getCategories(),
        api.getUsers(),
        api.getSummaryReport(),
      ]);
      setTransactions(txData);
      setCategories(catData);
      setUsers(userData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, user]);

  const isAdmin = user?.role === 'admin';
  const isPending = user?.status === 'pending';

  // Guard admin tabs if member
  useEffect(() => {
    if (!isAdmin && (activeTab === 'approvals' || activeTab === 'members')) {
      setActiveTab('overview');
    }
  }, [isAdmin, activeTab]);

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const pendingUsers = users.filter(u => u.status === 'pending');
  const myTransactions = transactions.filter(t => t.userId === user?.id);

  // Actions
  const handleApproveTransaction = async (id: string, notes?: string) => {
    try {
      await api.reviewTransaction(id, 'approved', notes || 'Approved by Family Head');
      showToast('Transaction verified and approved to family ledger!');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve', 'error');
    }
  };

  const handleRejectTransaction = async (id: string, notes: string) => {
    try {
      await api.reviewTransaction(id, 'rejected', notes);
      showToast('Transaction rejected with note sent to member.', 'error');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject', 'error');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction entry?')) return;
    try {
      await api.deleteTransaction(id);
      showToast('Transaction deleted.');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset sample transactions, categories, and family accounts to defaults?')) return;
    try {
      await api.resetDemoData();
      await loadAllData();
      showToast('Database reset to defaults.');
    } catch (err: any) {
      showToast(err.message || 'Reset failed', 'error');
    }
  };

  const handleImportTransactions = async (
    items: Array<{
      title: string;
      amount: number;
      type: 'expense' | 'income';
      categoryId: string;
      date: string;
      notes?: string;
    }>
  ) => {
    for (const item of items) {
      await api.createTransaction({
        title: item.title,
        amount: item.amount,
        type: item.type,
        categoryId: item.categoryId,
        date: item.date,
        notes: item.notes,
      });
    }
    await loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Top Test Role Switcher Banner */}
      <RoleSwitcherBar
        onOpenAuthModal={tab => {
          setAuthModalTab(tab || 'login');
          setIsAuthModalOpen(true);
        }}
        pendingUserCount={pendingUsers.length}
      />

      {/* Main Header & Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setIsTxModalOpen(true);
        }}
        pendingTransactionsCount={pendingTransactions.length}
        pendingUsersCount={pendingUsers.length}
        onOpenAuth={tab => {
          setAuthModalTab(tab || 'login');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : 'bg-rose-900 text-rose-100 border-rose-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Pending Account Barrier Notice if current user is pending */}
      {isPending && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold">
                  Account Pending Approval: {user?.fullName}
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  As required by the family security system, newly registered accounts are placed in <em>Pending</em> status until the Family Head (Arthur) approves your registration.
                </p>
              </div>
            </div>
            <button
              onClick={() => api.switchDemoUser('admin').then(() => refreshUser())}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs"
            >
              Switch to Arthur (Admin) to Approve
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 lg:pb-8">
        {activeTab === 'overview' && (
          <FinancialReportsView
            summary={summary}
            transactions={transactions}
            onInspectReceipt={tx => setInspectingReceiptTx(tx)}
            onOpenGoogleSheets={() => setActiveTab('sheets')}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsTableView
            transactions={transactions}
            categories={categories}
            users={users}
            currentUserId={user?.id}
            isAdmin={isAdmin}
            onInspectReceipt={tx => setInspectingReceiptTx(tx)}
            onEditTransaction={tx => {
              setEditingTransaction(tx);
              setIsTxModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onApproveTransaction={handleApproveTransaction}
            onRejectTransaction={handleRejectTransaction}
            onOpenGoogleSheets={() => setActiveTab('sheets')}
            title="Family Transactions Ledger"
            subtitle="Consolidated record of all verified and pending expenses across all household members."
          />
        )}

        {activeTab === 'my-submissions' && (
          <TransactionsTableView
            transactions={myTransactions}
            categories={categories}
            users={users}
            currentUserId={user?.id}
            isAdmin={isAdmin}
            onInspectReceipt={tx => setInspectingReceiptTx(tx)}
            onEditTransaction={tx => {
              setEditingTransaction(tx);
              setIsTxModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenGoogleSheets={() => setActiveTab('sheets')}
            title={`Personal Log: ${user?.fullName || 'My Account'}`}
            subtitle="Track, view, and edit your submitted daily expenses, income, and uploaded screenshot proofs."
          />
        )}

        {activeTab === 'approvals' && isAdmin && (
          <AdminApprovalQueue
            pendingTransactions={pendingTransactions}
            onApprove={handleApproveTransaction}
            onReject={handleRejectTransaction}
            onInspectReceipt={tx => setInspectingReceiptTx(tx)}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'members' && isAdmin && (
          <AdminUserManagement
            users={users}
            currentUserId={user?.id}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesView
            categories={categories}
            transactions={transactions}
            onOpenNewCategory={() => setIsCatModalOpen(true)}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsView
            transactions={transactions}
            categories={categories}
            users={users}
            summary={summary}
            onRefreshData={loadAllData}
            onImportTransactions={handleImportTransactions}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'architecture' && <SchemaArchitectureView />}
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        categories={categories}
        onSuccess={() => {
          loadAllData();
          showToast(editingTransaction ? 'Transaction updated.' : 'Transaction submitted for Family Head approval!');
        }}
        onOpenNewCategory={() => setIsCatModalOpen(true)}
        initialTransaction={editingTransaction}
      />

      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        onCategoryCreated={newCat => {
          setCategories(prev => [...prev, newCat]);
          showToast(`Category "${newCat.name}" created!`);
          loadAllData();
        }}
      />

      <ReceiptModal
        isOpen={Boolean(inspectingReceiptTx)}
        transaction={inspectingReceiptTx}
        onClose={() => setInspectingReceiptTx(null)}
        isAdmin={isAdmin}
        onApprove={handleApproveTransaction}
        onReject={handleRejectTransaction}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mb-16 lg:mb-0 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>KinFinance Family Vault • Secure Role-Based Expense & Financial System</span>
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('architecture')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Schema Architecture
            </button>
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              title="Reset sample seed data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Data
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GoogleSheetsProvider>
        <AppContent />
      </GoogleSheetsProvider>
    </AuthProvider>
  );
}
