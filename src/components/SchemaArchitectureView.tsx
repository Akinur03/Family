import React, { useState } from 'react';
import { SUPABASE_SQL_SCHEMA, STORAGE_BUCKET_INSTRUCTIONS } from '../data/schemaDocs';
import { Database, HardDrive, Copy, Check, ShieldAlert, CheckCircle2, Code2, Server } from 'lucide-react';

export const SchemaArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sql' | 'storage'>('sql');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedStorage, setCopiedStorage] = useState(false);

  const copyToClipboard = (text: string, type: 'sql' | 'storage') => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else {
      setCopiedStorage(true);
      setTimeout(() => setCopiedStorage(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Deliverable 1 & 2: Database Schema & Storage Bucket Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Production-ready schemas for Supabase (PostgreSQL + RLS) and Firebase Storage bucket policies for handling document/screenshot uploads.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'sql'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>1. PostgreSQL / Supabase Schema</span>
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'storage'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>2. Storage Bucket Instructions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schema Content View */}
      {activeTab === 'sql' ? (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl text-slate-200">
          <div className="px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-slate-300 font-semibold">
                supabase_family_finance_schema.sql
              </span>
              <span className="text-slate-500">• 5 Relational Tables & RLS Policies</span>
            </div>

            <button
              onClick={() => copyToClipboard(SUPABASE_SQL_SCHEMA, 'sql')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
            </button>
          </div>

          <div className="p-6 overflow-x-auto text-xs font-mono leading-relaxed bg-slate-950 text-emerald-300 max-h-[600px] overflow-y-auto">
            <pre className="text-slate-300 font-mono">{SUPABASE_SQL_SCHEMA}</pre>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl text-slate-200">
          <div className="px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="font-mono text-slate-300 font-semibold">
                storage_bucket_setup_guide.md
              </span>
              <span className="text-slate-500">• Supabase & Firebase Storage Bucket Rules</span>
            </div>

            <button
              onClick={() => copyToClipboard(STORAGE_BUCKET_INSTRUCTIONS, 'storage')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {copiedStorage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStorage ? 'Copied Guide!' : 'Copy Setup Guide'}</span>
            </button>
          </div>

          <div className="p-6 overflow-x-auto text-xs font-mono leading-relaxed bg-slate-950 text-slate-300 max-h-[600px] overflow-y-auto">
            <pre className="text-slate-300 font-mono whitespace-pre-wrap">{STORAGE_BUCKET_INSTRUCTIONS}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
