import React, { useState, useEffect } from 'react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  getServerSupabaseStatus,
  testServerSupabaseConnection,
  DEFAULT_SUPABASE_URL,
  SUPABASE_SQL_SCHEMA,
} from '../services/supabase';
import { BDT_SYMBOL } from '../utils/currency';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Server,
  Key,
  Shield,
  Layers,
  Code2,
} from 'lucide-react';

interface SupabaseVercelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

export const SupabaseVercelModal: React.FC<SupabaseVercelModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'vercel' | 'sql'>('supabase');
  const [url, setUrl] = useState(DEFAULT_SUPABASE_URL);
  const [anonKey, setAnonKey] = useState('');
  const [serverStatus, setServerStatus] = useState<{ configured: boolean; url: string; hasKey: boolean; source: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSnippetCopied, setIsSnippetCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url || DEFAULT_SUPABASE_URL);
      setAnonKey(config.anonKey || '');
      setTestResult(null);

      // Fetch server Supabase configuration status
      getServerSupabaseStatus().then(status => {
        setServerStatus(status);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(url.trim(), anonKey.trim());
      setTestResult(res);
      if (res.success) {
        saveSupabaseConfig(url.trim(), anonKey.trim());
        if (onShowToast) onShowToast('Connected to Supabase PostgreSQL!', 'success');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveSupabaseConfig(url.trim(), anonKey.trim());
    if (onShowToast) onShowToast('Supabase settings saved.', 'success');
    setTestResult({ success: true, message: 'Settings saved locally for this app.' });
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    if (onShowToast) onShowToast('Supabase configuration cleared.', 'success');
  };

  const copySqlSchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsCopied(true);
    if (onShowToast) onShowToast('Supabase SQL Schema copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const currentConfig = getSupabaseConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-tight">
                Vercel & Supabase Integration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PostgreSQL Cloud Database • Bangladeshi Taka ({BDT_SYMBOL} BDT) • Production Edge Hosting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'supabase'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Connection</span>
            {currentConfig.isConfigured && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SQL Migration Schema (BDT)</span>
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'vercel'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Vercel Deployment</span>
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* SUPABASE TAB */}
          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                <span className="font-semibold">Supabase PostgreSQL Ready:</span> Connect your Supabase project to store household transactions, categories, and member approvals in real-time. Pre-configured for Bangladeshi Taka ({BDT_SYMBOL} BDT) budgets.
              </div>

              {/* Status pill & Server Detection */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Client Status:</span>
                    {currentConfig.isConfigured ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Configured ({currentConfig.source})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                        Using Local Family Store
                      </span>
                    )}
                  </div>
                  {currentConfig.isConfigured && (
                    <button
                      onClick={handleClear}
                      className="text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium self-start sm:self-auto"
                    >
                      Disconnect
                    </button>
                  )}
                </div>

                {/* Server-side status */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Server Backend Status:</span>
                    {serverStatus?.hasKey ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> SUPABASE_KEY Loaded ({serverStatus.source})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                        SUPABASE_KEY pending in server environment
                      </span>
                    )}
                  </div>
                  {serverStatus?.hasKey && (
                    <button
                      onClick={async () => {
                        setIsTesting(true);
                        setTestResult(null);
                        const res = await testServerSupabaseConnection();
                        setTestResult(res);
                        setIsTesting(false);
                      }}
                      disabled={isTesting}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                    >
                      Test Server Key
                    </button>
                  )}
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Project Supabase Client</span>
                  </div>
                  <button
                    onClick={() => {
                      const snippet = `import { createClient } from '@supabase/supabase-js'\nconst supabaseUrl = 'https://ivudmzdabfehxlkwyuab.supabase.co'\nconst supabaseKey = process.env.SUPABASE_KEY\nconst supabase = createClient(supabaseUrl, supabaseKey)`;
                      navigator.clipboard.writeText(snippet);
                      setIsSnippetCopied(true);
                      if (onShowToast) onShowToast('Client snippet copied to clipboard!', 'success');
                      setTimeout(() => setIsSnippetCopied(false), 2500);
                    }}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors"
                  >
                    {isSnippetCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isSnippetCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://ivudmzdabfehxlkwyuab.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)`}
                </pre>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Input Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Supabase Project URL (SUPABASE_URL / VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://ivudmzdabfehxlkwyuab.supabase.co"
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pre-set to your KinFinance Supabase instance (<span className="text-emerald-600 dark:text-emerald-400 font-mono">https://ivudmzdabfehxlkwyuab.supabase.co</span>).
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Supabase API Key (SUPABASE_KEY / VITE_SUPABASE_ANON_KEY)
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={e => setAnonKey(e.target.value)}
                    placeholder="Enter anon public or service_role key..."
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Obtained from Supabase Project Settings → API (<span className="font-mono">anon public</span> or <span className="font-mono">service_role</span> key).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting || !url || !anonKey}
                    className="min-h-[42px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  >
                    {isTesting ? 'Testing Connection...' : 'Test & Connect (Client)'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!anonKey) return;
                      setIsTesting(true);
                      setTestResult(null);
                      const res = await testServerSupabaseConnection(anonKey.trim(), url.trim());
                      setTestResult(res);
                      setIsTesting(false);
                    }}
                    disabled={isTesting || !anonKey}
                    className="min-h-[42px] px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                  >
                    {isTesting ? 'Testing Server...' : 'Test Server Proxy'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!url || !anonKey}
                    className="min-h-[42px] px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Save Credentials
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SQL SCHEMA TAB */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    PostgreSQL Schema & Seed Script for Supabase
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Copy and run in your Supabase SQL Editor. Pre-configured in Bangladeshi Taka ({BDT_SYMBOL} BDT).
                  </p>
                </div>
                <button
                  onClick={copySqlSchema}
                  className="min-h-[38px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed">
                  {SUPABASE_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          )}

          {/* VERCEL TAB */}
          {activeTab === 'vercel' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <Cloud className="w-4 h-4 text-sky-500" />
                  <span>Vercel Deployment Checklist</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  This application has been tailored specifically for Vercel with an optimized <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">vercel.json</code>, clean SPA rewrites, and asset caching rules.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    1. Vercel Configuration (<code className="font-mono text-emerald-600 dark:text-emerald-400">vercel.json</code>)
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    SPA routing rewrites and API passthrough are generated at the repository root to ensure browser refreshes on sub-routes work seamlessly.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    2. Environment Variables on Vercel
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mb-2">
                    In your Vercel Dashboard under <strong>Project Settings → Environment Variables</strong>, add:
                  </p>
                  <ul className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    <li className="p-1.5 rounded bg-slate-100 dark:bg-slate-800">VITE_SUPABASE_URL=https://your-project.supabase.co</li>
                    <li className="p-1.5 rounded bg-slate-100 dark:bg-slate-800">VITE_SUPABASE_ANON_KEY=your_supabase_anon_key</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    3. Build Command & Output Directory
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    Build command: <code className="font-mono text-emerald-600 dark:text-emerald-400">npm run build</code> (or <code className="font-mono text-emerald-600 dark:text-emerald-400">vite build</code>)<br />
                    Output directory: <code className="font-mono text-emerald-600 dark:text-emerald-400">dist</code>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Operating in Bangladeshi Taka ({BDT_SYMBOL} BDT)
          </span>
          <button
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
