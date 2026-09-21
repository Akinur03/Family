import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BDT_SYMBOL } from '../utils/currency';
import {
  ShieldCheck,
  Lock,
  User,
  Users,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Database,
  Cloud,
} from 'lucide-react';

interface LoginGatewayProps {
  onOpenSupabaseDocs?: () => void;
}

export const LoginGateway: React.FC<LoginGatewayProps> = ({ onOpenSupabaseDocs }) => {
  const { login, register, switchDemoUser } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRelationship, setRegRelationship] = useState('Spouse');
  const [regPassword, setRegPassword] = useState('');
  const [regMessage, setRegMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!username.trim() || !password) {
      setLoginError('Please enter both your username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMessage(null);

    if (!regFullName.trim() || !regUsername.trim() || !regPassword) {
      setRegMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        fullName: regFullName.trim(),
        username: regUsername.trim().toLowerCase(),
        relationship: regRelationship,
        password: regPassword,
      });

      setRegMessage({
        type: 'success',
        text: res.message || 'Registration submitted! Please wait for Family Head approval.',
      });
      // Clear fields
      setRegFullName('');
      setRegUsername('');
      setRegPassword('');
    } catch (err: any) {
      setRegMessage({
        type: 'error',
        text: err.message || 'Registration failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (demoUsername: string) => {
    setLoginError(null);
    setIsSubmitting(true);
    try {
      await switchDemoUser(demoUsername);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to switch demo account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background aesthetic glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Container */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-950/40">
            <span className="text-2xl font-bold font-serif">{BDT_SYMBOL}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            KinFinance Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Family Expense Ledger & Financial Approvals System
          </p>

          {/* Bangladeshi Currency Badge & Deployment tag */}
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[11px] font-semibold tracking-wide">
              <span>🇧🇩</span>
              <span>Currency: Bangladeshi Taka ({BDT_SYMBOL} BDT)</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-medium">
              <Cloud className="w-3 h-3 text-sky-400" />
              <span>Vercel + Supabase Ready</span>
            </span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 p-5 sm:p-7 shadow-2xl">
          
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-xl mb-5 border border-slate-700/60">
            <button
              id="tab-btn-login"
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError(null);
                setRegMessage(null);
              }}
              className={`min-h-[40px] py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-btn-register"
              type="button"
              onClick={() => {
                setMode('register');
                setLoginError(null);
                setRegMessage(null);
              }}
              className={`min-h-[40px] py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Member
            </button>
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Username</span>
                  <span className="text-[11px] text-slate-400">e.g. admin or lucas</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    id="input-login-username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    required
                    className="w-full min-h-[44px] pl-9 pr-3.5 py-2 text-base sm:text-sm rounded-xl border border-slate-600 bg-slate-900/90 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    id="input-login-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full min-h-[44px] pl-9 pr-3.5 py-2 text-base sm:text-sm rounded-xl border border-slate-600 bg-slate-900/90 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Unlock Family Vault</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTRATION FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {regMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                    regMessage.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  {regMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <span>{regMessage.text}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Full Name *
                </label>
                <input
                  id="input-reg-fullname"
                  type="text"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="e.g. Rafiq Chowdhury"
                  required
                  className="w-full min-h-[42px] px-3 py-2 text-base sm:text-sm rounded-xl border border-slate-600 bg-slate-900/90 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Username *
                  </label>
                  <input
                    id="input-reg-username"
                    type="text"
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="rafiq"
                    required
                    className="w-full min-h-[42px] px-3 py-2 text-base sm:text-sm rounded-xl border border-slate-600 bg-slate-900/90 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">
                    Household Role *
                  </label>
                  <select
                    id="select-reg-relationship"
                    value={regRelationship}
                    onChange={e => setRegRelationship(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 text-base sm:text-sm rounded-xl border border-slate-600 bg-slate-900/90 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Parent">Parent / Elder</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other Family</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Password *
                </label>
                <input
                  id="input-reg-password"
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="w-full min-h-[42px] px-3 py-2 text-base sm:text-sm rounded-xl border border-slate-600 bg-slate-900/90 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700/60 text-[11px] text-slate-400 leading-relaxed">
                🛡️ Security rule: New accounts require verification and approval by the Family Head (Arthur) before accessing family finances.
              </div>

              <button
                id="btn-reg-submit"
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Request Household Access'}
              </button>
            </form>
          )}

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-5 border-t border-slate-700/70">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant Demo Login</span>
              </span>
              <span className="text-[10px] text-slate-500">Tap to test role</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="demo-login-admin"
                disabled={isSubmitting}
                onClick={() => handleQuickDemoLogin('admin')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 text-left transition-colors flex flex-col group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400">
                    Arthur (Admin)
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 font-semibold">
                    Head
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Full approvals & budget
                </span>
              </button>

              <button
                type="button"
                id="demo-login-eleanor"
                disabled={isSubmitting}
                onClick={() => handleQuickDemoLogin('eleanor')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 text-left transition-colors flex flex-col group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400">
                    Eleanor (Spouse)
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-950 text-blue-300 font-semibold">
                    Member
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Logs groceries & bills
                </span>
              </button>

              <button
                type="button"
                id="demo-login-lucas"
                disabled={isSubmitting}
                onClick={() => handleQuickDemoLogin('lucas')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 text-left transition-colors flex flex-col group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400">
                    Lucas (Son)
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-950 text-purple-300 font-semibold">
                    Member
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Submits college receipts
                </span>
              </button>

              <button
                type="button"
                id="demo-login-chloe"
                disabled={isSubmitting}
                onClick={() => handleQuickDemoLogin('chloe')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 text-left transition-colors flex flex-col group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-amber-400">
                    Chloe (Daughter)
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-950 text-amber-300 font-semibold">
                    Pending
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Tests approval barrier
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info & architecture link */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted Family Vault</span>
          </span>
          <span>•</span>
          <span>Bangladeshi Taka (৳ BDT)</span>
        </div>
      </div>
    </div>
  );
};
