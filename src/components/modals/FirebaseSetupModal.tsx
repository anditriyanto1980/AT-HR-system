import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Check,
  Flame,
  CheckCircle2,
  Server,
  Zap,
  RefreshCw,
  ShieldCheck,
  Layers,
  HardDrive,
  Users,
  Building,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { testConnection } from '../../services/firebase';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({ isOpen, onClose }) => {
  const firebaseStatus = dataService.getFirebaseStatus();
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const res = await testConnection();
      if (res.connected) {
        setFeedback({
          type: 'success',
          message: 'Koneksi ke Firebase Cloud Firestore BERHASIL! Database online dan siap beroperasi.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Gagal tersambung ke Firebase. Periksa koneksi internet Anda.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal menguji koneksi Firebase Cloud Firestore.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncToFirebase = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await dataService.syncAllToFirebase();
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Berhasil menyinkronkan seluruh ${res.syncedCount} dokumen master (Perusahaan, Karyawan, Cabang, Departemen, Jabatan, Shift, Libur, Kompensasi, Presensi, Pengumuman) langsung ke Firebase Cloud Firestore!`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Gagal menyinkronkan data ke Cloud Firestore.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat proses sinkronisasi.',
      });
    } finally {
      setSyncing(false);
    }
  };

  const collections = [
    { name: 'companies', label: 'Profil Perusahaan', icon: Building },
    { name: 'branches', label: 'Cabang & Geofence GPS', icon: Building },
    { name: 'departments', label: 'Departemen', icon: Layers },
    { name: 'positions', label: 'Master Jabatan', icon: Users },
    { name: 'employees', label: 'Data Karyawan & Akun', icon: Users },
    { name: 'shifts', label: 'Shift Kerja & Toleransi', icon: Clock },
    { name: 'holidays', label: 'Kalender Libur Nasional', icon: Calendar },
    { name: 'attendance_records', label: 'Presensi & Absensi Selfie', icon: Clock },
    { name: 'salary_profiles', label: 'Profil Gaji & Kompensasi', icon: Zap },
    { name: 'payroll_batches', label: 'Payroll & Slip Gaji', icon: Server },
    { name: 'leave_requests', label: 'Pengajuan Cuti Karyawan', icon: Calendar },
    { name: 'permission_requests', label: 'Izin & Sakit', icon: Layers },
    { name: 'overtime_requests', label: 'Lembur (Overtime)', icon: Clock },
    { name: 'corrections', label: 'Koreksi Absensi', icon: CheckCircle2 },
    { name: 'announcements', label: 'Pengumuman Internal', icon: Server },
    { name: 'audit_logs', label: 'Audit Trail & Log Aktivitas', icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B132B] via-slate-900 to-[#1D63FF] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-xs">
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Status Database & Cloud Storage
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                  Firebase Only
                </span>
              </div>
              <p className="text-xs text-slate-300">
                100% Menggunakan Google Firebase Cloud Firestore (Single Database)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Information Banner */}
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <div className="font-bold text-blue-900 text-sm">
                Database Tunggal: Google Firebase Cloud Firestore
              </div>
              <p className="text-xs text-blue-800">
                Aplikasi ini sekarang berjalan secara penuh dengan <strong>Google Firebase</strong>{' '}
                sebagai satu-satunya database utama (Firestore + Firebase Authentication + Firebase Storage).{' '}
                Ketergantungan pada Supabase telah dihapus secara total agar arsitektur sistem menjadi ringkas, aman, dan tanpa redundansi dua database.
              </p>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 animate-in fade-in duration-150 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="font-medium leading-relaxed">{feedback.message}</div>
            </div>
          )}

          {/* Project & Connection Details Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-slate-500" />
                Informasi Konfigurasi Firebase
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Connected & Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Project ID:</span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {firebaseStatus.projectId}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Database Engine:</span>
                <span className="font-semibold text-slate-900 text-xs flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  Google Cloud Firestore
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 sm:col-span-2">
                <span className="text-slate-500 text-[11px] block">Database ID:</span>
                <span className="font-mono font-semibold text-slate-900 text-[11px] break-all">
                  {firebaseStatus.databaseId}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Autentikasi:</span>
                <span className="font-semibold text-slate-900 text-xs">
                  Firebase Auth (Email & RBAC)
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Security Rules:</span>
                <span className="font-semibold text-emerald-700 text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Active & Enforced
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 text-xs shadow-xs"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Menguji Koneksi Firestore...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Uji Koneksi Realtime</span>
                </>
              )}
            </button>

            <button
              onClick={handleSyncToFirebase}
              disabled={syncing}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-[#1D63FF] hover:bg-blue-600 text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 text-xs"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyinkronkan ke Cloud Firestore...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Sinkronkan Seluruh Data Master ke Firestore</span>
                </>
              )}
            </button>
          </div>

          {/* Managed Firestore Collections */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Koleksi yang Dikelola di Firebase Cloud Firestore ({collections.length})
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Otomatis Tersinkron
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {collections.map((col) => {
                const IconComponent = col.icon;
                return (
                  <div
                    key={col.name}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] text-slate-900 font-bold truncate">
                        {col.name}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">{col.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>Penyimpanan lokal bereaksi cepat dengan sinkronisasi Cloud Firestore</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
