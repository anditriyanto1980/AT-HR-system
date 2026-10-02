import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  User,
  Eye,
  EyeOff,
  Gem,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

export const LoginView: React.FC = () => {
  const { login, loginWithGoogle, switchRole, isFirebaseConnected } = useAuth();
  const [identifier, setIdentifier] = useState('triyanto.andi');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Username atau password tidak valid.');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setError(res.error || 'Login Google gagal.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan akun Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickLogin = (role: UserRole, demoUser: string, demoPass: string = 'password123') => {
    setIdentifier(demoUser);
    setPassword(demoPass);
    switchRole(role);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black shadow-lg shadow-amber-500/25">
            <Gem className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <span>AT-HR Enterprise</span>
            </h1>
            <p className="text-xs font-semibold text-amber-600 tracking-wide mt-1">
              Smart Solutions for Smart Business
            </p>
          </div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Platform HRIS, Presensi Pintar & Manajemen Karyawan Terintegrasi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-start gap-2">
                <span className="shrink-0 mt-0.5 font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username atau Email Perusahaan
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Username (cth: triyanto.andi) atau Email"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D63FF] focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Dapat login menggunakan Username, NIK, atau Email resmi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Password Akun</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D63FF] focus:bg-white transition-all text-slate-800 placeholder-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1D63FF] hover:bg-blue-600 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <span>{loading ? 'Memverifikasi Kredensial...' : 'Masuk ke Portal HRIS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider relative">
                atau
              </span>
            </div>

            {/* Google Firebase Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold shadow-xs hover:border-slate-300 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.27 21.43 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.1z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.27 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
                />
              </svg>
              <span>{googleLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Akun Google (Firebase)'}</span>
            </button>
          </form>

          {/* Firebase Connection Status Banner */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="font-semibold text-slate-700">Firebase Cloud Firestore</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFirebaseConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isFirebaseConnected ? 'Tersambung (Online)' : 'Standby'}
            </span>
          </div>

          {/* Quick Demo Role Logins */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Quick 1-Click Role Login
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('SUPER_ADMIN', 'triyanto.andi')
                }
                className="p-2.5 text-left bg-blue-50/50 hover:bg-blue-50 rounded-xl border border-blue-100 text-xs transition-colors group cursor-pointer"
              >
                <div className="font-bold text-slate-900 group-hover:text-[#1D63FF]">Super Admin</div>
                <div className="text-[10px] text-blue-600 font-mono font-medium">@triyanto.andi</div>
                <div className="text-[9px] text-slate-400">Triyanto Andi</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('HR_ADMIN', 'siti.rahmawati')
                }
                className="p-2.5 text-left bg-emerald-50/50 hover:bg-emerald-50 rounded-xl border border-emerald-100 text-xs transition-colors group cursor-pointer"
              >
                <div className="font-bold text-slate-900 group-hover:text-emerald-600">HR Admin</div>
                <div className="text-[10px] text-emerald-600 font-mono font-medium">@siti.rahmawati</div>
                <div className="text-[9px] text-slate-400">Siti Rahmawati</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('MANAGER', 'budi.santoso')
                }
                className="p-2.5 text-left bg-purple-50/50 hover:bg-purple-50 rounded-xl border border-purple-100 text-xs transition-colors group cursor-pointer"
              >
                <div className="font-bold text-slate-900 group-hover:text-purple-600">Team Manager</div>
                <div className="text-[10px] text-purple-600 font-mono font-medium">@budi.santoso</div>
                <div className="text-[9px] text-slate-400">Budi Santoso</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('EMPLOYEE', 'dewi.lestari')
                }
                className="p-2.5 text-left bg-amber-50/50 hover:bg-amber-50 rounded-xl border border-amber-100 text-xs transition-colors group cursor-pointer"
              >
                <div className="font-bold text-slate-900 group-hover:text-amber-600">Employee</div>
                <div className="text-[10px] text-amber-600 font-mono font-medium">@dewi.lestari</div>
                <div className="text-[9px] text-slate-400">Dewi Lestari</div>
              </button>
            </div>
            <div className="text-center text-[10px] text-slate-400">
              Default password semua akun demo: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700 font-semibold">password123</code>
            </div>
          </div>
        </div>

        {/* Security watermark footer */}
        <div className="text-center text-[11px] text-slate-400 font-medium">
          Protected with SHA-256 Authentication & Enterprise RBAC
        </div>
      </div>
    </div>
  );
};
