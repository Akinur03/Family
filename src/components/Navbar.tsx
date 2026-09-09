import React from 'react';
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
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'transactions'
  | 'my-submissions'
  | 'approvals'
  | 'members'
  | 'categories'
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

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <div
              onClick={() => onSelectTab('overview')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
                <WalletCards className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                  KinFinance
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Family Vault
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">
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
                  <span>Approvals Queue</span>
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

          {/* Right Header: Log Transaction & Profile */}
          <div className="flex items-center gap-3">
            {/* Action button */}
            <button
              id="btn-nav-log-expense"
              onClick={onOpenNewTransaction}
              className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Log Expense / Proof</span>
              <span className="sm:hidden">Log</span>
            </button>

            {/* User profile dropdown / info */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
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
                </div>

                <button
                  id="btn-logout"
                  onClick={logout}
                  title="Sign out / Switch account"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-nav-signin"
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-slate-100 dark:border-slate-800 no-scrollbar text-xs">
          <button
            onClick={() => onSelectTab('overview')}
            className={`px-2.5 py-1 rounded-lg shrink-0 font-medium ${
              activeTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectTab('transactions')}
            className={`px-2.5 py-1 rounded-lg shrink-0 font-medium ${
              activeTab === 'transactions' ? 'bg-slate-900 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Ledger
          </button>
          <button
            onClick={() => onSelectTab('my-submissions')}
            className={`px-2.5 py-1 rounded-lg shrink-0 font-medium ${
              activeTab === 'my-submissions' ? 'bg-slate-900 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            My Entries
          </button>
          {isAdmin && (
            <button
              onClick={() => onSelectTab('approvals')}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium flex items-center gap-1 ${
                activeTab === 'approvals' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Approvals ({pendingTransactionsCount})
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => onSelectTab('members')}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium ${
                activeTab === 'members' ? 'bg-slate-900 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Family ({pendingUsersCount})
            </button>
          )}
          <button
            onClick={() => onSelectTab('categories')}
            className={`px-2.5 py-1 rounded-lg shrink-0 font-medium ${
              activeTab === 'categories' ? 'bg-slate-900 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => onSelectTab('architecture')}
            className={`px-2.5 py-1 rounded-lg shrink-0 font-medium ${
              activeTab === 'architecture' ? 'bg-slate-900 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Schema Docs
          </button>
        </div>

      </div>
    </header>
  );
};
