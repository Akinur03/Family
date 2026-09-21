import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ShieldCheck, UserCheck, Clock, UserPlus } from 'lucide-react';

interface RoleSwitcherBarProps {
  onOpenAuthModal: (tab?: 'login' | 'register') => void;
  pendingUserCount?: number;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({
  onOpenAuthModal,
  pendingUserCount = 0,
}) => {
  const { user, switchDemoUser } = useAuth();

  return (
    <div className="bg-slate-900 text-slate-300 px-3 sm:px-4 py-2 text-xs border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-medium text-[11px] border border-emerald-800 shrink-0">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Role Switcher</span>
          </div>
          <span className="text-[11px] text-slate-400 sm:text-xs">
            <span className="sm:hidden">Switch role:</span>
            <span className="hidden sm:inline">Switch between Family Head & Member personas in 1 click:</span>
          </span>
        </div>

        {/* Horizontally scrollable personas on mobile with touch-friendly padding */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar touch-pan-x -mx-1 px-1">
          {/* Admin / Family Head */}
          <button
            id="role-switch-admin"
            onClick={() => switchDemoUser('admin')}
            className={`min-h-[38px] sm:min-h-0 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all shrink-0 active:scale-95 ${
              user?.username === 'admin'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Arthur (Admin)</span>
          </button>

          {/* Eleanor (Member) */}
          <button
            id="role-switch-eleanor"
            onClick={() => switchDemoUser('eleanor')}
            className={`min-h-[38px] sm:min-h-0 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all shrink-0 active:scale-95 ${
              user?.username === 'eleanor'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Eleanor</span>
          </button>

          {/* Lucas (Member) */}
          <button
            id="role-switch-lucas"
            onClick={() => switchDemoUser('lucas')}
            className={`min-h-[38px] sm:min-h-0 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all shrink-0 active:scale-95 ${
              user?.username === 'lucas'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Lucas</span>
          </button>

          {/* Chloe (Pending registration) */}
          <button
            id="role-switch-chloe"
            onClick={() => onOpenAuthModal('login')}
            className="min-h-[38px] sm:min-h-0 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/80 flex items-center gap-1.5 font-medium transition-all shrink-0 active:scale-95"
            title="Test log-in with Chloe to experience the pending account barrier"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Chloe (Pending)</span>
            {pendingUserCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* Custom Sign In / Register */}
          <button
            id="btn-nav-custom-auth"
            onClick={() => onOpenAuthModal('register')}
            className="min-h-[38px] sm:min-h-0 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 font-medium transition-all shrink-0 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-400" />
            <span>Register</span>
          </button>
        </div>
      </div>
    </div>
  );
};
