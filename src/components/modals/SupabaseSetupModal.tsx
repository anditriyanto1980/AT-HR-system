import React, { useState, useEffect } from 'react';
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
  Flame,
  CheckCircle2,
  Server,
  Zap,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { testConnection } from '../../services/firebase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'FIREBASE' | 'SUPABASE'>('FIREBASE');
  const firebaseStatus = dataService.getFirebaseStatus();
  const currentStatus = dataService.getSupabaseStatus();

  const [url, setUrl] = useState(currentStatus.url || '');
  const [anonKey, setAnonKey] = useState(currentStatus.anonKey || '');
  const [loading, setLoading] = useState(false);
  const [fbTesting, setFbTesting] = useState(false);
  const [fbSyncing, setFbSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestFirebase = async () => {
    setFbTesting(true);
    setFeedback(null);
    try {
      const res = await testConnection();
      if (res.connected) {
        setFeedback({
          type: 'success',
          message: 'Koneksi ke Firebase Cloud Firestore BERHASIL! Database online dan siap digunakan.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Gagal tersambung ke Firebase. Periksa koneksi internet.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal menguji koneksi Firebase.',
      });
    } finally {
      setFbTesting(false);
    }
  };

  const handleSyncToFirebase = async () => {
    setFbSyncing(true);
    setFeedback(null);
    try {
      const res = await dataService.syncAllToFirebase();
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Berhasil menyinkronkan ${res.syncedCount} dokumen master (karyawan, cabang, shift, absensi) ke Firebase Cloud Firestore!`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Gagal menyinkronkan data ke Firebase.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat proses sinkronisasi.',
      });
    } finally {
      setFbSyncing(false);
    }
  };

  const handleTestAndSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !anonKey) {
      setFeedback({ type: 'error', message: 'Silakan isi Supabase URL dan Anon Key.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const res = await dataService.setSupabaseConfig(url.trim(), anonKey.trim());
    setLoading(false);

    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Berhasil terhubung ke Supabase! Perubahan data akan disinkronkan.',
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Koneksi Supabase gagal. Periksa URL dan Anon Key.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#0B132B] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950">
              <Database className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Database & Cloud Integrasi</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Firebase Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Status koneksi cloud, sinkronisasi data real-time, dan konfigurasi database.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('FIREBASE')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'FIREBASE'
                ? 'bg-white text-[#1D63FF] border-[#1D63FF] shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Firebase Cloud Firestore</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SUPABASE')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'SUPABASE'
                ? 'bg-white text-[#1D63FF] border-[#1D63FF] shadow-xs'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-600" />
            <span>Supabase / PostgreSQL</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-5 mt-4 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <div className="font-medium leading-relaxed">{feedback.message}</div>
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'FIREBASE' ? (
            <div className="space-y-4">
              {/* Status Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/60 to-blue-50/60 border border-amber-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Firebase Firestore Status</h4>
                      <p className="text-[11px] text-slate-500">Tersambung ke Google Cloud Platform</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ONLINE & READY
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">
                      Firebase Project ID
                    </span>
                    <span className="font-bold text-slate-800">{firebaseStatus.projectId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">
                      Firestore Database ID
                    </span>
                    <span className="font-bold text-slate-800 truncate block" title={firebaseStatus.databaseId}>
                      {firebaseStatus.databaseId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Information */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#1D63FF]" />
                  <span>Fitur Firebase yang Telah Terintegrasi:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                  <li>
                    <strong className="text-slate-700">Firebase Authentication:</strong> Mendukung Google Sign-In terverifikasi & multi-role session.
                  </li>
                  <li>
                    <strong className="text-slate-700">Cloud Firestore:</strong> Penyimpanan entitas karyawan, absensi geofence GPS, lembur, dan izin.
                  </li>
                  <li>
                    <strong className="text-slate-700">Hardened Security Rules:</strong> Akses RBAC terproteksi untuk Admin, Manager, & Karyawan.
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleTestFirebase}
                  disabled={fbTesting}
                  className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{fbTesting ? 'Menguji Koneksi...' : 'Uji Koneksi Firestore'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncToFirebase}
                  disabled={fbSyncing}
                  className="flex-1 py-2.5 px-4 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${fbSyncing ? 'animate-spin' : ''}`} />
                  <span>{fbSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data ke Firestore'}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleTestAndSaveSupabase} className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Opsional: Anda juga dapat menghubungkan database relasional eksternal Supabase PostgreSQL jika diperlukan.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project URL</label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Anon / Public API Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  {loading ? 'Menghubungkan...' : 'Simpan & Uji Koneksi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
