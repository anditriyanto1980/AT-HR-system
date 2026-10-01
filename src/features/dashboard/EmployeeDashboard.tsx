import React from 'react';
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
  Megaphone,
  ShoppingBag,
  TrendingUp,
  Wallet,
  Gem,
  Award,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate, formatMinutes, formatTime } from '../../utils/attendance';

interface EmployeeDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = dataService.getTodayAttendance(currentUser.id, todayStr);
  const shifts = dataService.getShifts();
  const activeShift = shifts.find((s) => s.is_active) || shifts[0];

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

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* ========================================================================= */}
      {/* ROW 1: THE VIBRANT GRADIENT METRIC CARDS (Matching Reference Image)        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Purple Gradient (Today's Attendance Status) */}
        <div
          onClick={() => onNavigateTab('clock-in')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#5B4DFB] to-[#7B61FF] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Today's Status</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono">
              {isClockedOut ? 'Clocked Out' : isClockedIn ? 'Clocked In' : 'Not Clocked In'}
            </div>
            <div className="text-[11px] font-medium text-white/90">
              {todayAttendance?.clock_in_time ? `In at ${todayAttendance.clock_in_time}` : 'Tap to clock in live'}
            </div>
          </div>
          <div className="absolute -bottom-1 left-0 right-0 h-6 pointer-events-none opacity-40">
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0.00,49.98 C149.99,150.00 349.89,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Emerald Green Gradient (Annual Leave Remaining) */}
        <div
          onClick={() => onNavigateTab('leave')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#00A86B] to-[#00C887] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Annual Leave Balance</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono">
              {annualBalance?.remaining ?? 12} Days
            </div>
            <div className="text-[11px] font-medium text-white/90">
              {annualBalance?.used ?? 0} days used this year
            </div>
          </div>
          <div className="absolute -bottom-1 left-0 right-0 h-6 pointer-events-none opacity-40">
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0.00,49.98 C149.99,150.00 271.49,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Orange Gradient (Total Overtime / Pending Requests) */}
        <div
          onClick={() => onNavigateTab('overtime')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Pending Requests</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono">
              {totalPending} Awaiting
            </div>
            <div className="text-[11px] font-medium text-white/90">
              Cuti, Izin & Lembur
            </div>
          </div>
          <div className="absolute -bottom-1 left-0 right-0 h-6 pointer-events-none opacity-40">
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0.00,49.98 C190.99,140.00 320.89,-40.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Royal Blue Gradient (Latest Net Salary) */}
        <div
          onClick={() => onNavigateTab('payroll')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#176BFF] to-[#0096FF] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Latest Net Salary</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Gem className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xl font-bold tracking-tight font-mono truncate">
              {latestPayslip
                ? new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    maximumFractionDigits: 0,
                  }).format(latestPayslip.take_home_pay)
                : 'Rp 14,850,000'}
            </div>
            <div className="text-[11px] font-medium text-white/90">
              Slip Gaji Resmi Ber-barcode
            </div>
          </div>
          <div className="absolute -bottom-1 left-0 right-0 h-6 pointer-events-none opacity-40">
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0.00,49.98 C150.99,120.00 340.89,-30.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: FAST SHORTCUTS PANEL (Styled like pastel cards in reference image)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <button
          onClick={() => onNavigateTab('clock-in')}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
              Clock In/Out
            </div>
            <div className="text-[10px] text-slate-400">Live GPS & Selfie</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('leave')}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 truncate">
              Cuti Tahunan
            </div>
            <div className="text-[10px] text-slate-400">Ajukan cuti</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('permission')}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 truncate">
              Izin / Sakit
            </div>
            <div className="text-[10px] text-slate-400">Surat dokter</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('overtime')}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
            <Timer className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600 truncate">
              Log Lembur
            </div>
            <div className="text-[10px] text-slate-400">Overtime form</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('payroll')}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 truncate">
              Slip Gaji
            </div>
            <div className="text-[10px] text-slate-400">Download PDF</div>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('reimbursements')}
          className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 group-hover:text-cyan-600 truncate">
              Klaim Biaya
            </div>
            <div className="text-[10px] text-slate-400">Reimbursement</div>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: TODAY'S SHIFT + RECENT ATTENDANCE TABLE                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Today's Shift & Live Clock Terminal */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Assigned Shift Details</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {activeShift?.shift_type}
              </span>
            </div>

            <div className="space-y-3 pt-3">
              <div>
                <div className="text-xs text-slate-400">Shift Name</div>
                <div className="text-base font-bold text-slate-900">{activeShift?.name}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Working Hours</div>
                <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                  {activeShift?.start_time} – {activeShift?.end_time}
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                <Coffee className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Break: {activeShift?.break_start} – {activeShift?.break_end} (Toleransi:{' '}
                  {activeShift?.tolerance_minutes}m)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('clock-in')}
            className="w-full py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span>{isClockedIn && !isClockedOut ? 'Clock Out Terminal' : 'Buka Terminal Clock In'}</span>
          </button>
        </div>

        {/* Recent Attendance History Table */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Recent Attendance History
              </h3>
              <button
                onClick={() => onNavigateTab('attendance-history')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                View Full Log →
              </button>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-semibold">
                    <th className="pb-2 font-mono">Date</th>
                    <th className="pb-2">Shift</th>
                    <th className="pb-2 font-mono">Clock In</th>
                    <th className="pb-2 font-mono">Clock Out</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {myRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada riwayat absensi bulan ini.
                      </td>
                    </tr>
                  ) : (
                    myRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 font-mono text-slate-900 font-semibold">
                          {formatDate(r.attendance_date)}
                        </td>
                        <td className="py-2.5 text-slate-700">{r.shift_name || 'Normal'}</td>
                        <td className="py-2.5 font-mono text-slate-800">
                          {r.clock_in_time ? formatTime(r.clock_in_time) : '—'}
                        </td>
                        <td className="py-2.5 font-mono text-slate-800">
                          {r.clock_out_time ? formatTime(r.clock_out_time) : '—'}
                        </td>
                        <td className="py-2.5 text-right">
                          <StatusBadge status={r.clock_in_status} type="attendance" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateTab('attendance-history')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
            >
              <span>Lihat Rekap Lengkap Presensi Saya</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
