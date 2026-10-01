import React, { useState } from 'react';
import {
  X,
  Database,
  Check,
  Copy,
  ExternalLink,
  Shield,
  Key,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { dataService } from '../../services/dataService';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const currentStatus = dataService.getSupabaseStatus();

  const [url, setUrl] = useState(currentStatus.url || '');
  const [anonKey, setAnonKey] = useState(currentStatus.anonKey || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !anonKey) {
      setFeedback({ type: 'error', message: 'Please provide both Supabase URL and Anon Key.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const res = await dataService.setSupabaseConfig(url.trim(), anonKey.trim());
    setLoading(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Successfully connected to Supabase project! Local changes will now sync.',
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Connection failed. Please check credentials and CORS.',
      });
    }
  };

  const handleResetToDemo = () => {
    dataService.resetToLocalDemo();
    setUrl('');
    setAnonKey('');
    setFeedback({
      type: 'success',
      message: 'Reset to local browser demo mode with 20 sample employees and attendance records.',
    });
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const sqlSample = `-- AT-HR PostgreSQL Migration (Run in Supabase SQL Editor)
-- 1. Create Enums & Tables
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent', 'early_checkout', 'leave', 'sick', 'business_trip', 'holiday', 'day_off', 'overtime');

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255)
);

CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INT DEFAULT 100
);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  nik VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role DEFAULT 'EMPLOYEE',
  company_id UUID REFERENCES companies(id),
  branch_id UUID REFERENCES branches(id)
);

CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  clock_in_time TIMESTAMPTZ,
  clock_in_lat DOUBLE PRECISION,
  clock_in_lng DOUBLE PRECISION,
  clock_in_distance_meters DOUBLE PRECISION,
  clock_in_status attendance_status DEFAULT 'present',
  late_minutes INT DEFAULT 0,
  work_duration_minutes INT DEFAULT 0
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees access own record" ON employees
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

CREATE POLICY "Attendance access" ON attendance_records
  FOR ALL TO authenticated USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between bg-[#0B132B] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Database className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Database & Supabase Configuration
              </h2>
              <p className="text-xs text-amber-400/90 font-medium">
                PostgreSQL schema, RLS policies, and environment connection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Alert */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              currentStatus.isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            <Shield className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-sm">
                {currentStatus.isConfigured
                  ? 'Connected to Live Supabase Backend'
                  : 'Currently Operating in Local Sandbox Demo Mode'}
              </div>
              <p className="text-slate-600">
                {currentStatus.isConfigured
                  ? 'All attendance events, employees, and shift configurations are synced with PostgreSQL via Supabase Auth & RLS.'
                  : 'All functionalities (GPS geofencing, webcam selfie, shift tolerance check, CRUD) are 100% active and saved to local state. You can link your live Supabase project below.'}
              </p>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-100 text-rose-900 border border-rose-200'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                VITE_SUPABASE_URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                VITE_SUPABASE_ANON_KEY (Public Key)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                <span>Save & Connect Project</span>
              </button>

              <button
                type="button"
                onClick={handleResetToDemo}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                Reset to Demo Sandbox
              </button>
            </div>
          </form>

          {/* SQL Migration Script Snippet */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                SQL Migration & Row Level Security (RLS)
              </span>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 border border-slate-200"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Full SQL Migration'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              The migration file is saved in <code>supabase/migrations/20260930_initial_schema.sql</code>.
              Paste it in the Supabase SQL Editor to provision all tables and security policies.
            </p>
            <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto max-h-40 border border-slate-800">
              {sqlSample}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200/80 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
