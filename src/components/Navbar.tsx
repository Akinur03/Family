import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  WalletCards,
  PlusCircle,
  LayoutDashboard,
  Receipt,
  CheckCircle,
  Users,
  Tags,
  Database,
  LogOut,
  User,
  Shield,
  Clock,
  FileSpreadsheet,
  Menu,
  X,
  Plus,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'transactions'
  | 'my-submissions'
  | 'approvals'
  | 'members'
  | 'categories'
  | 'sheets'
  | 'architecture';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenNewTransaction: () => void;
  pendingTransactionsCount: number;
  pendingUsersCount: number;
  onOpenAuth: (tab?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTransaction,
  pendingTransactionsCount,
  pendingUsersCount,
  onOpenAuth,
}) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleMobileTabSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 sm:h-16">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 sm:gap-6">
              <div
                onClick={() => handleMobileTabSelect('overview')}
                className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-700 transition-colors shrink-0">
                  <WalletCards className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>KinFinance</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Vault
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-none hidden xs:block">
                    Expense & Approval Hub
                  </p>
                </div>
              </div>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1">
                <button
                  id="nav-tab-overview"
                  onClick={() => onSelectTab('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>

                <button
                  id="nav-tab-transactions"
                  onClick={() => onSelectTab('transactions')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'transactions'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Family Ledger</span>
                </button>

                <button
                  id="nav-tab-my-submissions"
                  onClick={() => onSelectTab('my-submissions')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'my-submissions'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Submissions</span>
                </button>

                {isAdmin && (
                  <button
                    id="nav-tab-approvals"
                    onClick={() => onSelectTab('approvals')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors relative ${
                      activeTab === 'approvals'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Approvals</span>
                    {pendingTransactionsCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                        {pendingTransactionsCount}
                      </span>
                    )}
                  </button>
                )}

                {isAdmin && (
                  <button
                    id="nav-tab-members"
                    onClick={() => onSelectTab('members')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors relative ${
                      activeTab === 'members'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Family & Access</span>
                    {pendingUsersCount > 0 && (
                      <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                        {pendingUsersCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  id="nav-tab-categories"
                  onClick={() => onSelectTab('categories')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'categories'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Tags className="w-3.5 h-3.5" />
                  <span>Categories</span>
                </button>

                <button
                  id="nav-tab-sheets"
                  onClick={() => onSelectTab('sheets')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'sheets'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Google Sheets</span>
                </button>

                <button
                  id="nav-tab-architecture"
                  onClick={() => onSelectTab('architecture')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeTab === 'architecture'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Deliverable Schema & Storage Bucket Setup"
                >
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  <span>Schema Docs</span>
                </button>
              </nav>
            </div>

            {/* Right Header: Log Transaction & Profile & Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Log button */}
              <button
                id="btn-nav-log-expense"
                onClick={onOpenNewTransaction}
                className="min-h-[40px] py-1.5 px-3 sm:px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Log Expense / Proof</span>
                <span className="sm:hidden">Log</span>
              </button>

              {/* User profile dropdown / info */}
              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.fullName)}`}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      {isAdmin ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" /> Family Head (Admin)
                        </span>
                      ) : (
                        <span>{user.relationship || 'Member'}</span>
                      )}
                    </p>
                  </div>

                  <button
                    id="btn-logout"
                    onClick={logout}
                    title="Sign out / Switch account"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="btn-nav-signin"
                  onClick={() => onOpenAuth('login')}
                  className="min-h-[40px] px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                >
                  Sign In
                </button>
              )}

              {/* Mobile Drawer Hamburger Trigger */}
              <button
                id="btn-mobile-menu-toggle"
                onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
                className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                aria-label="Toggle menu"
              >
                {isMobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                {(pendingTransactionsCount > 0 || pendingUsersCount > 0) && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>
            </div>

          </div>

          {/* Mobile Horizontal Sub-Navigation Strip (Quick swipeable tabs) */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 no-scrollbar touch-pan-x text-xs">
            <button
              onClick={() => handleMobileTabSelect('overview')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl shrink-0 font-medium transition-all ${
                activeTab === 'overview' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleMobileTabSelect('transactions')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl shrink-0 font-medium transition-all ${
                activeTab === 'transactions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60'
              }`}
            >
              Ledger
            </button>
            <button
              onClick={() => handleMobileTabSelect('my-submissions')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl shrink-0 font-medium transition-all ${
                activeTab === 'my-submissions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60'
              }`}
            >
              My Entries
            </button>
            {isAdmin && (
              <button
                onClick={() => handleMobileTabSelect('approvals')}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl shrink-0 font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'approvals' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60'
                }`}
              >
                <span>Approvals</span>
                {pendingTransactionsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {pendingTransactionsCount}
                  </span>
                )}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => handleMobileTabSelect('members')}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl shrink-0 font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'members' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60'
                }`}
              >
                <span>Family</span>
                {pendingUsersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {pendingUsersCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => handleMobileTabSelect('categories')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl shrink-0 font-medium transition-all ${
                activeTab === 'categories' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => handleMobileTabSelect('sheets')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl shrink-0 font-medium flex items-center gap-1 transition-all ${
                activeTab === 'sheets' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Google Sheets</span>
            </button>
            <button
              onClick={() => handleMobileTabSelect('architecture')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl shrink-0 font-medium transition-all ${
                activeTab === 'architecture' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60'
              }`}
            >
              Schema Docs
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Backdrop & Slide-Over Menu */}
      {isMobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="flex-1 w-full"
          />
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Drawer Pull handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.fullName || 'User')}`}
                  alt={user?.fullName || 'User'}
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {user?.fullName || 'Guest User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAdmin ? 'Family Head (Admin)' : user?.relationship || 'Family Member'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation List in Mobile Drawer */}
            <div className="space-y-1">
              <button
                onClick={() => handleMobileTabSelect('overview')}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>Overview & Analytics</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                onClick={() => handleMobileTabSelect('transactions')}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                  activeTab === 'transactions'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Family Ledger</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                onClick={() => handleMobileTabSelect('my-submissions')}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                  activeTab === 'my-submissions'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>My Submissions</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {isAdmin && (
                <button
                  onClick={() => handleMobileTabSelect('approvals')}
                  className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                    activeTab === 'approvals'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Expense Approvals Queue</span>
                  </div>
                  {pendingTransactionsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                      {pendingTransactionsCount}
                    </span>
                  )}
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => handleMobileTabSelect('members')}
                  className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                    activeTab === 'members'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Family & Access Management</span>
                  </div>
                  {pendingUsersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
                      {pendingUsersCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => handleMobileTabSelect('categories')}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                  activeTab === 'categories'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Tags className="w-4 h-4 text-emerald-600" />
                  <span>Categories & Budgets</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                onClick={() => handleMobileTabSelect('sheets')}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                  activeTab === 'sheets'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Google Sheets Sync</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                onClick={() => handleMobileTabSelect('architecture')}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                  activeTab === 'architecture'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span>Deliverable Architecture & Schema</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            </div>

            {/* Bottom Quick Actions inside drawer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onOpenNewTransaction();
                }}
                className="flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-95 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Log Expense</span>
              </button>
              {user && (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    logout();
                  }}
                  className="min-h-[48px] px-4 border border-slate-200 dark:border-slate-700 text-rose-600 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar for Mobile (Always thumb-accessible) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          {/* Overview Tab */}
          <button
            onClick={() => handleMobileTabSelect('overview')}
            className={`min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
              activeTab === 'overview'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Overview</span>
          </button>

          {/* Ledger Tab */}
          <button
            onClick={() => handleMobileTabSelect('transactions')}
            className={`min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
              activeTab === 'transactions'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px]">Ledger</span>
          </button>

          {/* Center Elevated Quick Log Action Button */}
          <div className="flex-1 flex items-center justify-center -mt-4">
            <button
              onClick={onOpenNewTransaction}
              title="Log New Expense / Proof"
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white shadow-lg flex items-center justify-center transition-all active:scale-90 border-3 border-white dark:border-slate-900 ring-2 ring-emerald-500/30"
              aria-label="Add transaction"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Approvals (if Admin) or Sheets */}
          {isAdmin ? (
            <button
              onClick={() => handleMobileTabSelect('approvals')}
              className={`min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 rounded-xl relative transition-colors ${
                activeTab === 'approvals'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="text-[10px]">Approvals</span>
              {pendingTransactionsCount > 0 && (
                <span className="absolute top-1 right-3 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingTransactionsCount}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => handleMobileTabSelect('sheets')}
              className={`min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                activeTab === 'sheets'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span className="text-[10px]">Sheets</span>
            </button>
          )}

          {/* More Menu Drawer */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className={`min-h-[48px] flex-1 flex flex-col items-center justify-center gap-1 rounded-xl relative transition-colors ${
              isMobileDrawerOpen
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px]">More</span>
            {(pendingUsersCount > 0 || (!isAdmin && pendingTransactionsCount > 0)) && (
              <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

        </div>
      </nav>
    </>
  );
};
