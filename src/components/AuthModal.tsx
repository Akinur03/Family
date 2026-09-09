import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Lock,
  User,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
}) => {
  const { login, register, switchDemoUser } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);

  // Login inputs
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regRelationship, setRegRelationship] = useState('Family Member');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPendingNotice(null);
    setLoading(true);

    try {
      await login(loginUsername.trim(), loginPassword);
      onClose();
    } catch (err: any) {
      if (err.data?.status === 'pending' || err.status === 403) {
        setPendingNotice(
          err.data?.message ||
            'Your account is in Pending status awaiting review by the Family Head. Once an Admin approves your account, you will have immediate access.'
        );
      } else {
        setErrorMsg(err.message || 'Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setPendingNotice(null);
    setLoading(true);

    try {
      const res = await register({
        username: regUsername.trim(),
        password: regPassword,
        fullName: regFullName.trim(),
        relationship: regRelationship,
      });

      if (res.isPending) {
        setPendingNotice(
          'Registration successful! As required by family security policy, your account is now in Pending status. The Family Head will review and approve your access shortly.'
        );
        setTab('login');
      } else {
        setSuccessNotice('Account registered and activated!');
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base">
              K
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                Family Portal Access
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Secure Role-Based Financial Management
              </p>
            </div>
          </div>
          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-3 bg-white dark:bg-slate-900">
          <button
            id="tab-login"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider relative mr-6 transition-colors ${
              tab === 'login'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Sign In
            {tab === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
          <button
            id="tab-register"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider relative transition-colors ${
              tab === 'register'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Register Account
            {tab === 'register' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Pending Approval Notice */}
          {pendingNotice && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2 text-xs text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Account Status: Pending Approval</span>
              </div>
              <p className="leading-relaxed text-amber-700 dark:text-amber-300">
                {pendingNotice}
              </p>
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between">
                <span className="text-[11px] text-amber-600 dark:text-amber-400">
                  Testing? Log in as Family Head to approve this account:
                </span>
                <button
                  type="button"
                  id="btn-quick-switch-admin"
                  onClick={async () => {
                    await switchDemoUser('admin');
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-[11px] transition-colors"
                >
                  Switch to Arthur (Admin)
                </button>
              </div>
            </div>
          )}

          {/* Success notice */}
          {successNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-login-username"
                    type="text"
                    required
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-login-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Family Hub'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Admin Approval Required:</strong> All newly registered accounts default to <em>Pending</em> status. You cannot access the app until the Family Head approves your registration.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name *
                </label>
                <input
                  id="input-reg-fullname"
                  type="text"
                  required
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="e.g. David Pendelton"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Relationship in Family *
                </label>
                <select
                  id="select-reg-relationship"
                  value={regRelationship}
                  onChange={e => setRegRelationship(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Family Member">Family Member</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Choose Username *
                </label>
                <input
                  id="input-reg-username"
                  type="text"
                  required
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  placeholder="e.g. davidp"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Set Password *
                </label>
                <input
                  id="input-reg-password"
                  type="password"
                  required
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Submitting...' : 'Register for Family Approval'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Test Accounts (1-Click Switch):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                id="btn-demo-arthur"
                onClick={async () => {
                  await switchDemoUser('admin');
                  onClose();
                }}
                className="p-2 text-left rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  👑 Arthur
                </p>
                <p className="text-[10px] text-slate-500">Admin (Family Head)</p>
              </button>

              <button
                type="button"
                id="btn-demo-eleanor"
                onClick={async () => {
                  await switchDemoUser('eleanor');
                  onClose();
                }}
                className="p-2 text-left rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  👤 Eleanor
                </p>
                <p className="text-[10px] text-slate-500">Member (Active)</p>
              </button>

              <button
                type="button"
                id="btn-demo-lucas"
                onClick={async () => {
                  await switchDemoUser('lucas');
                  onClose();
                }}
                className="p-2 text-left rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  👤 Lucas
                </p>
                <p className="text-[10px] text-slate-500">Member (Active)</p>
              </button>

              <button
                type="button"
                id="btn-demo-chloe"
                onClick={() => {
                  // Try to log in with chloe to demonstrate the pending check!
                  setLoginUsername('chloe');
                  setLoginPassword('member123');
                  setTab('login');
                }}
                className="p-2 text-left rounded-lg bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 border border-amber-200 dark:border-amber-800 transition-colors"
              >
                <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                  ⏳ Chloe
                </p>
                <p className="text-[10px] text-amber-700 dark:text-amber-400">Pending Approval</p>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
