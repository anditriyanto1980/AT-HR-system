import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Briefcase,
  User,
  Coffee,
  CalendarDays,
  FileText,
  Timer,
  DollarSign,
  Receipt,
  Plane,
  History,
  BookOpen,
  Camera,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Eye,
  Check,
  Building,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate, formatTime } from '../../utils/attendance';

interface EmployeeDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = dataService.getTodayAttendance(currentUser.id, todayStr);
  const shifts = dataService.getShifts();
  const activeShift = shifts.find((s) => s.is_active) || shifts[0];
  const locations = dataService.getLocations();
  const myLocation =
    locations.find((l) => l.branch_id === currentUser.branch_id) || locations[0];

  // Balances & pending requests
  const myBalances = dataService.getLeaveBalances(currentUser.id);
  const annualBalance = myBalances.find((b) => b.leave_type_name === 'Annual Leave');

  const pendingLeaves = dataService
    .getLeaveRequests()
    .filter((r) => r.employee_id === currentUser.id && r.status === 'PENDING');
  const pendingPerms = dataService
    .getPermissionRequests()
    .filter((p) => p.employee_id === currentUser.id && p.status === 'PENDING');
  const pendingOTs = dataService
    .getOvertimeRequests()
    .filter((o) => o.employee_id === currentUser.id && o.status === 'PENDING');

  const totalPending = pendingLeaves.length + pendingPerms.length + pendingOTs.length;

  // Recent attendance records
  const myRecords = dataService
    .getAttendanceRecords()
    .filter((r) => r.employee_id === currentUser.id)
    .sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime())
    .slice(0, 5);

  const isClockedIn = Boolean(todayAttendance?.clock_in_time);
  const isClockedOut = Boolean(todayAttendance?.clock_out_time);

  // Latest payslip
  const myItems = dataService.getEmployeePayrollItems(currentUser.id);
  const latestPayslip = myItems[0];

  // Time greeting helper
  const hour = currentTime.getHours();
  const greeting =
    hour < 11
      ? 'Selamat Pagi'
      : hour < 15
      ? 'Selamat Siang'
      : hour < 18
      ? 'Selamat Sore'
      : 'Selamat Malam';

  // Format date indonesian
  const formattedDay = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-[1400px] mx-auto pb-4">
      {/* ========================================================================= */}
      {/* 1. EMPLOYEE HEADER & GREETING BAR (Optimized for Mobile & Desktop)        */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0B1528] via-[#10203E] to-[#162A52] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="relative">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="w-full h-full bg-[#0B1528] rounded-2xl flex items-center justify-center font-bold text-amber-400 text-lg sm:text-xl">
                  {currentUser.full_name.charAt(0)}
                </div>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0B1528] rounded-full" title="Status: Online" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                {greeting},
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                Karyawan Aktif
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
              {currentUser.full_name}
            </h1>
            <p className="text-xs text-slate-300 truncate mt-0.5">
              {currentUser.position_name || 'Staff'} • {currentUser.department_name}
            </p>
          </div>
        </div>

        {/* Live Date, Shift & Geofence pill */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs border-t border-slate-700/60 md:border-t-0 pt-3 md:pt-0">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-100">{formattedDay}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-100 truncate max-w-[140px] sm:max-w-xs">
              {myLocation?.name || 'Kantor Pusat'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO ATTENDANCE CARD (Primary Live Clock & Camera Status)              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-lg shadow-slate-200/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Live Clock & Shift Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Live Presensi Hari Ini
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-slate-900">
                {currentTime.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-400 font-mono">WIB</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {activeShift?.name}: {activeShift?.start_time} - {activeShift?.end_time}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-medium border border-amber-100">
                <Coffee className="w-3.5 h-3.5" />
                <span>Istirahat: {activeShift?.break_start} - {activeShift?.break_end}</span>
              </span>
            </div>
          </div>

          {/* Center / Right: Status Preview and Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            {/* Selfie Photo Preview (if taken today) */}
            <div className="flex items-center gap-2.5 shrink-0 justify-center">
              {todayAttendance?.clock_in_selfie_url ? (
                <div className="relative group text-center">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm bg-slate-200">
                    <img
                      src={todayAttendance.clock_in_selfie_url}
                      alt="Selfie Masuk"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 block mt-0.5">
                    In: {todayAttendance.clock_in_time ? formatTime(todayAttendance.clock_in_time) : ''}
                  </span>
                </div>
              ) : null}

              {todayAttendance?.clock_out_selfie_url ? (
                <div className="relative group text-center">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-blue-500 shadow-sm bg-slate-200">
                    <img
                      src={todayAttendance.clock_out_selfie_url}
                      alt="Selfie Pulang"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[9px] font-bold text-blue-700 block mt-0.5">
                    Out: {todayAttendance.clock_out_time ? formatTime(todayAttendance.clock_out_time) : ''}
                  </span>
                </div>
              ) : null}

              {!todayAttendance?.clock_in_selfie_url && (
                <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-white">
                  <Camera className="w-5 h-5 text-slate-400" />
                  <span className="text-[8px] font-semibold mt-0.5">Foto</span>
                </div>
              )}
            </div>

            {/* Attendance Status & Primary CTA */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Status Presensi Hari Ini
                </div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {isClockedOut ? (
                    <span className="text-blue-600 flex items-center justify-center sm:justify-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Presensi Selesai ({todayAttendance?.clock_out_time} WIB)
                    </span>
                  ) : isClockedIn ? (
                    <span className="text-emerald-600 flex items-center justify-center sm:justify-start gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Sudah Clock In ({todayAttendance?.clock_in_time} WIB)
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center justify-center sm:justify-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Belum Melakukan Clock In
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button that opens Clock In terminal */}
              <button
                onClick={() => onNavigateTab('clock-in')}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  isClockedOut
                    ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-900/20'
                    : isClockedIn
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30'
                    : 'bg-gradient-to-r from-[#1D63FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-500/30'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>
                  {isClockedOut
                    ? 'Lihat Detail Absensi Hari Ini'
                    : isClockedIn
                    ? 'Clock Out Pulang (Wajib Foto)'
                    : 'Clock In Sekarang (Wajib Foto)'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FITUR CEPAT KARYAWAN (Touch-friendly 2x4 Grid for Mobile)             */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Menu Cepat Karyawan</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Layanan Mandiri</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* 1. Clock In / Out */}
          <button
            onClick={() => onNavigateTab('clock-in')}
            className="p-3.5 sm:p-4 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform mb-2">
              <Camera className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
              Presensi Kamera
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">GPS & Wajib Selfie</div>
          </button>

          {/* 2. Cuti (Leave) */}
          <button
            onClick={() => onNavigateTab('leave')}
            className="p-3.5 sm:p-4 bg-white hover:bg-emerald-50/50 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform mb-2">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 truncate">
              Ajukan Cuti
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              Sisa: {annualBalance?.remaining ?? 12} Hari
            </div>
          </button>

          {/* 3. Izin & Sakit */}
          <button
            onClick={() => onNavigateTab('permission')}
            className="p-3.5 sm:p-4 bg-white hover:bg-purple-50/50 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform mb-2">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 truncate">
              Izin / Sakit
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">Upload Bukti Surat</div>
          </button>

          {/* 4. Lembur (Overtime) */}
          <button
            onClick={() => onNavigateTab('overtime')}
            className="p-3.5 sm:p-4 bg-white hover:bg-amber-50/50 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform mb-2">
              <Timer className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 truncate">
              Form Lembur
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">Catat Jam Lembur</div>
          </button>

          {/* 5. Slip Gaji (Payslip) */}
          <button
            onClick={() => onNavigateTab('payroll')}
            className="p-3.5 sm:p-4 bg-white hover:bg-emerald-50/50 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform mb-2">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 truncate">
              Slip Gaji
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">Download PDF Resmi</div>
          </button>

          {/* 6. Reimbursement */}
          <button
            onClick={() => onNavigateTab('reimbursements')}
            className="p-3.5 sm:p-4 bg-white hover:bg-cyan-50/50 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform mb-2">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-cyan-600 truncate">
              Klaim Biaya
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">Reimbursement Nota</div>
          </button>

          {/* 7. Perjalanan Dinas (SPPD) */}
          <button
            onClick={() => onNavigateTab('business-trip')}
            className="p-3.5 sm:p-4 bg-white hover:bg-indigo-50/50 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform mb-2">
              <Plane className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
              Dinas (SPPD)
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">Tugas Luar Kota</div>
          </button>

          {/* 8. User Guideline (Buku Panduan) */}
          <button
            onClick={() => onNavigateTab('user-guide')}
            className="p-3.5 sm:p-4 bg-white hover:bg-amber-50/50 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform mb-2">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 truncate">
              Buku Panduan
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">SOP & Cara Pakai</div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. STATISTIK KARYAWAN (2x2 Grid on Mobile, 4-Cols on Desktop)             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Annual Leave Remaining */}
        <div
          onClick={() => onNavigateTab('leave')}
          className="rounded-2xl p-4 bg-gradient-to-br from-[#00A86B] to-[#00C887] text-white shadow-md cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/90">Sisa Cuti Tahunan</span>
            <CalendarDays className="w-4 h-4 text-white/80" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight font-mono">
              {annualBalance?.remaining ?? 12} Hari
            </div>
            <div className="text-[10px] text-white/80 mt-0.5">
              Dari kuota {annualBalance?.entitlement ?? 12} hari/tahun
            </div>
          </div>
        </div>

        {/* Card 2: Pending Requests */}
        <div
          onClick={() => onNavigateTab('leave')}
          className="rounded-2xl p-4 bg-gradient-to-br from-[#FF6B00] to-[#FFA200] text-white shadow-md cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/90">Pengajuan Aktif</span>
            <Timer className="w-4 h-4 text-white/80" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight font-mono">
              {totalPending} Menunggu
            </div>
            <div className="text-[10px] text-white/80 mt-0.5">
              Cuti, Izin, & Lembur
            </div>
          </div>
        </div>

        {/* Card 3: Latest Take Home Pay */}
        <div
          onClick={() => onNavigateTab('payroll')}
          className="rounded-2xl p-4 bg-gradient-to-br from-[#176BFF] to-[#0096FF] text-white shadow-md cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/90">Gaji Bersih (THP)</span>
            <DollarSign className="w-4 h-4 text-white/80" />
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold tracking-tight font-mono truncate">
              {latestPayslip
                ? new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    maximumFractionDigits: 0,
                  }).format(latestPayslip.take_home_pay)
                : 'Rp 14.850.000'}
            </div>
            <div className="text-[10px] text-white/80 mt-0.5">
              Slip Gaji Terakhir
            </div>
          </div>
        </div>

        {/* Card 4: Attendance Record count */}
        <div
          onClick={() => onNavigateTab('attendance-history')}
          className="rounded-2xl p-4 bg-gradient-to-br from-[#5B4DFB] to-[#7B61FF] text-white shadow-md cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/90">Tingkat Kehadiran</span>
            <CheckCircle2 className="w-4 h-4 text-white/80" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight font-mono">
              100%
            </div>
            <div className="text-[10px] text-white/80 mt-0.5">
              Disiplin Tepat Waktu
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RIWAYAT ABSENSI TERAKHIR (Mobile Cards + Desktop Table)                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Riwayat Absensi Terakhir
            </h3>
            <p className="text-[11px] text-slate-400">5 catatan presensi terbaru Anda</p>
          </div>
          <button
            onClick={() => onNavigateTab('attendance-history')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile View: Cards */}
        <div className="block sm:hidden space-y-2.5">
          {myRecords.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Belum ada riwayat absensi bulan ini.
            </div>
          ) : (
            myRecords.map((r) => (
              <div
                key={r.id}
                className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="font-bold text-slate-900 font-mono">
                    {formatDate(r.attendance_date)}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Masuk: <b className="font-mono text-slate-700">{r.clock_in_time ? formatTime(r.clock_in_time) : '—'}</b></span>
                    <span>•</span>
                    <span>Pulang: <b className="font-mono text-slate-700">{r.clock_out_time ? formatTime(r.clock_out_time) : '—'}</b></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Small Selfie Thumbnail */}
                  {r.clock_in_selfie_url && (
                    <img
                      src={r.clock_in_selfie_url}
                      alt="Selfie"
                      className="w-8 h-8 rounded-lg object-cover border border-slate-300"
                      title="Foto Selfie Masuk"
                    />
                  )}
                  <StatusBadge status={r.clock_in_status} type="attendance" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 font-semibold">
                <th className="pb-2.5 font-mono">Tanggal</th>
                <th className="pb-2.5">Shift</th>
                <th className="pb-2.5 font-mono">Clock In</th>
                <th className="pb-2.5 font-mono">Clock Out</th>
                <th className="pb-2.5 text-center">Foto Verifikasi</th>
                <th className="pb-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {myRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada riwayat absensi bulan ini.
                  </td>
                </tr>
              ) : (
                myRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-mono text-slate-900 font-semibold">
                      {formatDate(r.attendance_date)}
                    </td>
                    <td className="py-3 text-slate-700">{r.shift_name || 'Normal'}</td>
                    <td className="py-3 font-mono text-slate-800">
                      {r.clock_in_time ? formatTime(r.clock_in_time) : '—'}
                    </td>
                    <td className="py-3 font-mono text-slate-800">
                      {r.clock_out_time ? formatTime(r.clock_out_time) : '—'}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {r.clock_in_selfie_url && (
                          <img
                            src={r.clock_in_selfie_url}
                            alt="In"
                            className="w-7 h-7 rounded-md object-cover border border-slate-200"
                            title="Foto Masuk"
                          />
                        )}
                        {r.clock_out_selfie_url && (
                          <img
                            src={r.clock_out_selfie_url}
                            alt="Out"
                            className="w-7 h-7 rounded-md object-cover border border-slate-200"
                            title="Foto Pulang"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={r.clock_in_status} type="attendance" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
