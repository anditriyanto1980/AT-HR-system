import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  User,
  Lock,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Clock,
  Send,
  Building,
} from 'lucide-react';
import { Employee, UserRole } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../contexts/AuthContext';

interface UserAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSaved: () => void;
}

export const UserAccessModal: React.FC<UserAccessModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSaved,
}) => {
  const { currentUser } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [loginAccessEnabled, setLoginAccessEnabled] = useState(true);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      const initialUser =
        employee.username ||
        (employee.email ? employee.email.split('@')[0] : employee.employee_code)
          .replace(/[^a-zA-Z0-9._-]/g, '')
          .toLowerCase();

      setUsername(initialUser);
      setPassword(''); // Blank means do not alter password unless typed
      setShowPassword(false);
      setRole(employee.role || 'EMPLOYEE');
      setLoginAccessEnabled(employee.login_access_enabled !== false);
      setForcePasswordChange(!!employee.force_password_change);
      setError(null);
      setSuccessNotice(null);
      setCopied(false);
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const handleGeneratePassword = () => {
    const randomPass = dataService.generateRandomPassword(10);
    setPassword(randomPass);
    setShowPassword(true);
  };

  const handleCopyCredentials = () => {
    const appUrl = window.location.origin;
    const passText = password || employee.password || 'password123';
    const comp = dataService.getCompany();
    const appTitle = comp.app_name?.toUpperCase() || 'AT-HR ENTERPRISE';
    const textToCopy = `*AKSES LOGIN ${appTitle}*\nHalo ${employee.full_name},\nBerikut kredensial akun portal absensi dan HRIS Anda:\n\n🌐 *Portal Aplikasi*: ${appUrl}\n👤 *Username*: ${username}\n🔑 *Password*: ${passText}\n👔 *Role Akses*: ${role}\n\nSilakan simpan informasi ini dan jangan bagikan ke pihak lain.`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Username wajib diisi.');
      return;
    }

    if (dataService.checkUsernameExists(cleanUsername, employee.id)) {
      setError(`Username "${cleanUsername}" sudah digunakan karyawan lain. Silakan pilih username lain.`);
      return;
    }

    if (password && password.length < 6) {
      setError('Password minimal terdiri dari 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    const result = dataService.updateLoginCredentials(
      employee.id,
      {
        username: cleanUsername,
        password: password.trim() ? password.trim() : undefined,
        login_access_enabled: loginAccessEnabled,
        role: role,
        force_password_change: forcePasswordChange,
      },
      currentUser?.full_name || 'Administrator'
    );
    setIsSubmitting(false);

    if (result.success) {
      setSuccessNotice('Hak akses login dan kredensial berhasil disimpan!');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 900);
    } else {
      setError(result.error || 'Gagal menyimpan perubahan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0B132B] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Key className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight text-white">
                Hak Akses & Kredensial Login
              </h3>
              <p className="text-xs text-amber-400/90 font-medium">
                Kelola username, password, dan status izin login karyawan
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

        {/* Employee Summary Card */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-200 border-2 border-white shadow-xs flex items-center justify-center font-bold text-slate-700 text-sm">
              {employee.full_name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>{employee.full_name}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {employee.employee_code}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {employee.position_name} · {employee.department_name}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                loginAccessEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  loginAccessEnabled ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              {loginAccessEnabled ? 'Akses Aktif' : 'Akses Diblokir'}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Toggle Login Access Switch */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <span>Izinkan Karyawan Login ke Sistem</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Jika dinonaktifkan, karyawan tidak akan bisa login ke aplikasi web/PWA.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLoginAccessEnabled(!loginAccessEnabled)}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                loginAccessEnabled ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  loginAccessEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Credentials Inputs Grid */}
          <div className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username Login
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm font-semibold">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="cth: dewi.lestari"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Huruf kecil, angka, titik, atau strip (tanpa spasi).</span>
                <button
                  type="button"
                  onClick={() =>
                    setUsername(
                      (employee.email ? employee.email.split('@')[0] : employee.employee_code)
                        .replace(/[^a-zA-Z0-9._-]/g, '')
                        .toLowerCase()
                    )
                  }
                  className="text-blue-600 hover:underline font-medium"
                >
                  Gunakan email prefix
                </button>
              </div>
            </div>

            {/* Password Input + Generator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Password Akun
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate Password Acak</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    employee.password
                      ? '•••••••• (Biarkan kosong jika tidak ingin mengubah)'
                      : 'Ketik password awal baru...'
                  }
                  className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {password
                  ? `Password baru akan disimpan: ${password}`
                  : 'Jika tidak diisi, password lama karyawan tetap berlaku.'}
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Role Akses Sistem (RBAC)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium"
              >
                <option value="EMPLOYEE">Employee (Karyawan Self-Service, Absensi, Cuti, Slip Gaji)</option>
                <option value="MANAGER">Team Manager (Persetujuan Cuti/Lembur & Monitoring Tim)</option>
                <option value="HR_ADMIN">HR Admin (Kelola Karyawan, Shift, Libur, Operasional HR)</option>
                <option value="SUPER_ADMIN">Super Admin (Akses Penuh Seluruh Sistem & Konfigurasi)</option>
              </select>
            </div>

            {/* Force Password Change Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="forcePass"
                checked={forcePasswordChange}
                onChange={(e) => setForcePasswordChange(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="forcePass" className="text-xs text-slate-600 cursor-pointer select-none">
                Wajibkan karyawan mengganti password saat login berikutnya
              </label>
            </div>
          </div>

          {/* Quick Share Credentials Banner */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 flex items-center justify-between">
            <div className="space-y-0.5 min-w-0 pr-3">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-slate-600" />
                <span>Bagikan Akses Login</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Salin format pesan siap kirim (WhatsApp / Email) untuk karyawan
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300 shadow-2xs flex items-center gap-1.5 shrink-0 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Salin Info Login</span>
                </>
              )}
            </button>
          </div>

          {/* Audit / Last Login info */}
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Terakhir Login:{' '}
              {employee.last_login_at
                ? new Date(employee.last_login_at).toLocaleString('id-ID')
                : 'Belum pernah login'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-300" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Hak Akses'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
