import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  MapPin,
  Calendar,
  Building,
  ArrowRight,
  Filter,
  DollarSign,
  Receipt,
  Award,
  Megaphone,
  Gem,
  ShoppingBag,
  CreditCard,
  Wallet,
  Check,
  ChevronDown,
  ExternalLink,
  Laptop,
  Briefcase,
  AlertTriangle,
  Plane,
  FileText,
  Timer,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/attendance';

interface HRDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({ onNavigateTab }) => {
  const employees = dataService.getEmployees();
  const branches = dataService.getBranches();
  const departments = dataService.getDepartments();
  const attendance = dataService.getAttendanceRecords();
  const payrollBatches = dataService.getPayrollBatches();
  const reimbursements = dataService.getReimbursements();

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'THIS_MONTH' | 'LAST_MONTH'>('THIS_MONTH');

  // Filter attendance for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter((a) => {
    if (a.attendance_date !== todayStr) return false;
    if (selectedBranch === 'all') return true;
    const emp = employees.find((e) => e.id === a.employee_id);
    return emp?.branch_id === selectedBranch;
  });

  const activeEmployees = employees.filter((e) => {
    if (e.employment_status !== 'Active') return false;
    if (selectedBranch === 'all') return true;
    return e.branch_id === selectedBranch;
  });

  const totalCount = activeEmployees.length || 17;
  const presentCount = todayRecords.filter((a) => a.clock_in_status === 'present').length || 12;
  const lateCount = todayRecords.filter((a) => a.clock_in_status === 'late').length || 2;
  const clockedTotal = presentCount + lateCount;
  const attendanceRate = totalCount > 0 ? ((clockedTotal / totalCount) * 100).toFixed(1) : '94.2';

  // Latest payroll stats
  const latestBatch = payrollBatches[0];
  const totalPayrollDist = latestBatch?.total_net_payroll || 248540000;

  // Reimbursements stats
  const totalReimbAmount = reimbursements.reduce((acc, c) => acc + (c.amount || 0), 0);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* ROW 1: THE 6 VIBRANT GRADIENT METRIC CARDS                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Purple Gradient (Kehadiran Hari Ini) */}
        <div
          onClick={() => onNavigateTab('attendance-monitoring')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#5B4DFB] to-[#7B61FF] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Kehadiran Hari Ini</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono">
              {clockedTotal} / {totalCount}
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▲ 12.8% dibanding Kemarin</span>
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

        {/* Card 2: Emerald Green Gradient (Jam Kerja Bulan Ini) */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#00A86B] to-[#00C887] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Total Jam Kerja Bulan Ini</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono">
              2.865,4 jam
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▲ 18.6% dibanding Bulan Lalu</span>
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

        {/* Card 3: Orange Gradient (Lembur Hari Ini) */}
        <div
          onClick={() => onNavigateTab('overtime')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Lembur Hari Ini</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono">
              18,5 jam
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▲ 10.4% dibanding Kemarin</span>
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

        {/* Card 4: Royal Blue Gradient (Total Anggaran Gaji) */}
        <div
          onClick={() => onNavigateTab('payroll')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#176BFF] to-[#0096FF] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Total Anggaran Gaji</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Gem className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xl font-bold tracking-tight font-mono truncate">
              Rp 248,5 Jt
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▲ 9.2% dibanding Bulan Lalu</span>
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

        {/* Card 5: Hot Pink Gradient (Total Karyawan Aktif) */}
        <div
          onClick={() => onNavigateTab('employees')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#FF2E7E] to-[#FF5E98] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Total Karyawan Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono">
              {totalCount} Staf
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▲ 7.1% dibanding Bulan Lalu</span>
            </div>
          </div>
          <div className="absolute -bottom-1 left-0 right-0 h-6 pointer-events-none opacity-40">
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0.00,49.98 C120.99,140.00 380.89,-40.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>

        {/* Card 6: Teal Gradient (Klaim & Pengeluaran) */}
        <div
          onClick={() => onNavigateTab('reimbursements')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#00B4D8] to-[#0096C7] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Klaim & Pengeluaran</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xl font-bold tracking-tight font-mono truncate">
              Rp 18,7 Jt
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▼ 3.4% dibanding Bulan Lalu</span>
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
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: LINE CHART + DONUT CHART + COLLECTION SUMMARY                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Attendance Overview Line Chart */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Tren Kehadiran Karyawan (Bulan Ini)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Masuk Kerja
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Tepat Waktu
                </span>
              </div>
              <button className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1">
                <span>Bulan Ini</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Smooth Dual Line Chart Area */}
          <div className="pt-4 pb-2">
            <div className="relative h-56 w-full">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200">
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#176BFF" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#176BFF" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00C887" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#00C887" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[40, 80, 120, 160].map((y) => (
                  <line
                    key={y}
                    x1="40"
                    y1={y}
                    x2="490"
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                {/* Y-Axis Labels */}
                <text x="15" y="45" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  20 Staf
                </text>
                <text x="15" y="85" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  15 Staf
                </text>
                <text x="15" y="125" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  10 Staf
                </text>
                <text x="15" y="165" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  5 Staf
                </text>

                {/* Blue Area Fill & Path */}
                <path
                  d="M 50 140 Q 100 80 150 95 T 250 60 T 350 75 T 450 50 L 450 180 L 50 180 Z"
                  fill="url(#blueGradient)"
                />
                <path
                  d="M 50 140 Q 100 80 150 95 T 250 60 T 350 75 T 450 50"
                  fill="none"
                  stroke="#176BFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Green Area Fill & Path */}
                <path
                  d="M 50 160 Q 100 130 150 140 T 250 110 T 350 120 T 450 100 L 450 180 L 50 180 Z"
                  fill="url(#greenGradient)"
                />
                <path
                  d="M 50 160 Q 100 130 150 140 T 250 110 T 350 120 T 450 100"
                  fill="none"
                  stroke="#00C887"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Nodes on blue line */}
                {[
                  { cx: 50, cy: 140 },
                  { cx: 150, cy: 95 },
                  { cx: 250, cy: 60 },
                  { cx: 350, cy: 75 },
                  { cx: 450, cy: 50 },
                ].map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.cx}
                    cy={pt.cy}
                    r="4"
                    fill="#ffffff"
                    stroke="#176BFF"
                    strokeWidth="2.5"
                  />
                ))}

                {/* Nodes on green line */}
                {[
                  { cx: 50, cy: 160 },
                  { cx: 150, cy: 140 },
                  { cx: 250, cy: 110 },
                  { cx: 350, cy: 120 },
                  { cx: 450, cy: 100 },
                ].map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.cx}
                    cy={pt.cy}
                    r="4"
                    fill="#ffffff"
                    stroke="#00C887"
                    strokeWidth="2.5"
                  />
                ))}

                {/* X-Axis dates */}
                <text x="45" y="195" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  01 Jul
                </text>
                <text x="145" y="195" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  03 Jul
                </text>
                <text x="245" y="195" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  05 Jul
                </text>
                <text x="345" y="195" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  07 Jul
                </text>
                <text x="440" y="195" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  11 Jul
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Komposisi Departemen */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Komposisi per Departemen</h3>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#FF7828"
                  strokeWidth="14"
                  strokeDasharray="107.4 238.7"
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#1D63FF"
                  strokeWidth="14"
                  strokeDasharray="59.7 238.7"
                  strokeDashoffset="-107.4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#00C887"
                  strokeWidth="14"
                  strokeDasharray="35.8 238.7"
                  strokeDashoffset="-167.1"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#7B61FF"
                  strokeWidth="14"
                  strokeDasharray="23.9 238.7"
                  strokeDashoffset="-202.9"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#FF2E7E"
                  strokeWidth="14"
                  strokeDasharray="11.9 238.7"
                  strokeDashoffset="-226.8"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-700 shadow-inner">
                  <Gem className="w-5 h-5 text-slate-800" />
                </div>
              </div>
            </div>

            {/* Legend List */}
            <div className="w-full space-y-1.5 pt-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF7828]" />
                  <span className="font-medium text-slate-700">Teknologi & IT</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">45% (8 staf)</div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1D63FF]" />
                  <span className="font-medium text-slate-700">SDM (HR & GA)</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">25% (4 staf)</div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C887]" />
                  <span className="font-medium text-slate-700">Keuangan & Akun</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">15% (3 staf)</div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7B61FF]" />
                  <span className="font-medium text-slate-700">Produk & Desain</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">10% (2 staf)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Sebaran Kantor Cabang Hari Ini */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Sebaran Lokasi Karyawan (Hari Ini)
            </h3>
          </div>

          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  🏢
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Kantor Pusat (JKT)
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-900">8 Staf</div>
                <div className="text-[10px] text-slate-400 font-mono">47%</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Tech Hub (SBY)
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-900">5 Staf</div>
                <div className="text-[10px] text-slate-400 font-mono">29%</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                  🔬
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  R&D Center (BDG)
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-900">2 Staf</div>
                <div className="text-[10px] text-slate-400 font-mono">12%</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                  ✈️
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Remote & Dinas Luar
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-900">2 Staf</div>
                <div className="text-[10px] text-slate-400 font-mono">12%</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Total Karyawan</span>
            <span className="text-emerald-600 font-mono text-sm">
              17 Staf (100%)
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: TOP PERFORMERS TABLE + STOCK SUMMARY + LOW STOCK ALERTS            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Peringkat Kehadiran Departemen */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Peringkat Kedisiplinan Departemen
              </h3>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-semibold">
                    <th className="pb-2 font-mono">#</th>
                    <th className="pb-2">Departemen</th>
                    <th className="pb-2 font-mono">Staf</th>
                    <th className="pb-2 font-mono text-right">Rasio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-2.5 font-mono text-slate-400">1</td>
                    <td className="py-2.5 font-bold text-slate-800">Teknologi & IT</td>
                    <td className="py-2.5 font-mono text-slate-500">8 staf</td>
                    <td className="py-2.5 font-mono text-emerald-600 font-bold text-right">98,5%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-mono text-slate-400">2</td>
                    <td className="py-2.5 font-bold text-slate-800">Keuangan & Akun</td>
                    <td className="py-2.5 font-mono text-slate-500">3 staf</td>
                    <td className="py-2.5 font-mono text-emerald-600 font-bold text-right">96,0%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-mono text-slate-400">3</td>
                    <td className="py-2.5 font-bold text-slate-800">SDM & HR</td>
                    <td className="py-2.5 font-mono text-slate-500">4 staf</td>
                    <td className="py-2.5 font-mono text-emerald-600 font-bold text-right">95,2%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-mono text-slate-400">4</td>
                    <td className="py-2.5 font-bold text-slate-800">Produk & Desain</td>
                    <td className="py-2.5 font-mono text-slate-500">2 staf</td>
                    <td className="py-2.5 font-mono text-emerald-600 font-bold text-right">92,0%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-mono text-slate-400">5</td>
                    <td className="py-2.5 font-bold text-slate-800">Penjualan & Bisnis</td>
                    <td className="py-2.5 font-mono text-slate-500">1 staf</td>
                    <td className="py-2.5 font-mono text-emerald-600 font-bold text-right">90,0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Lihat Semua Laporan</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Card 2: Ringkasan Metrik Karyawan */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Ringkasan Operasional SDM
              </h3>
            </div>

            <div className="space-y-3 py-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    👥
                  </div>
                  <span className="font-medium text-slate-700">Total Karyawan Terdaftar</span>
                </div>
                <span className="font-mono font-bold text-slate-900">17 Karyawan</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    ⏱️
                  </div>
                  <span className="font-medium text-slate-700">Total Jam Kerja Bulan Ini</span>
                </div>
                <span className="font-mono font-bold text-slate-900">2.865,4 jam</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    💰
                  </div>
                  <span className="font-medium text-slate-700">Total Pengeluaran Gaji Bersih</span>
                </div>
                <span className="font-mono font-bold text-slate-900">Rp 248.540.000</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    📋
                  </div>
                  <span className="font-medium text-slate-700">Total Klaim Biaya Cair</span>
                </div>
                <span className="font-mono font-bold text-slate-900">Rp 18.754.000</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    🎯
                  </div>
                  <span className="font-medium text-slate-700">Indeks Kinerja (KPI Rata-rata)</span>
                </div>
                <span className="font-mono font-bold text-slate-900">89,4 / 100</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateTab('payroll')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Lihat Laporan Keuangan & Gaji</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Card 3: Tindakan Menunggu Persetujuan */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-4 h-4" />
                <h3 className="text-sm font-bold text-slate-800">
                  Antrean Butuh Persetujuan (5 Data)
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-semibold">
                    <th className="pb-2">Pemohon / Tugas</th>
                    <th className="pb-2 font-mono">Kategori</th>
                    <th className="pb-2 font-mono">Tanggal</th>
                    <th className="pb-2 font-mono text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Dewi Lestari</td>
                    <td className="py-2.5 font-mono text-slate-500">Cuti Tahunan</td>
                    <td className="py-2.5 font-mono text-slate-400">12 Jul</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Menunggu
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Ahmad Rizky</td>
                    <td className="py-2.5 font-mono text-slate-500">Lembur Shift</td>
                    <td className="py-2.5 font-mono text-slate-400">11 Jul</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Menunggu
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Eko Prasetyo</td>
                    <td className="py-2.5 font-mono text-slate-500">Koreksi Absen</td>
                    <td className="py-2.5 font-mono text-slate-400">11 Jul</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Terlambat
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Nadia Safira</td>
                    <td className="py-2.5 font-mono text-slate-500">Reimbursement</td>
                    <td className="py-2.5 font-mono text-slate-400">10 Jul</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Penting
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Budi Santoso</td>
                    <td className="py-2.5 font-mono text-slate-500">SPPD Surabaya</td>
                    <td className="py-2.5 font-mono text-slate-400">09 Jul</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Aktif
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateTab('approvals-hub')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Buka Pusat Persetujuan</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 4: MONTHLY BAR CHART + RECENT TRANSACTIONS + BRANCH PROGRESS           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Tren Kehadiran Bulanan */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Tren Kehadiran Bulanan
            </h3>
            <button className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1">
              <span>Tahun Ini</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end justify-between px-2 gap-2">
              {[
                { month: 'Jan', val: 55, label: '92%' },
                { month: 'Feb', val: 70, label: '94%' },
                { month: 'Mar', val: 80, label: '96%' },
                { month: 'Apr', val: 85, label: '97%' },
                { month: 'Mei', val: 65, label: '93%' },
                { month: 'Jun', val: 78, label: '95%' },
                { month: 'Jul', val: 95, label: '99%' },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full max-w-[28px] bg-slate-100 rounded-t-lg h-36 flex items-end">
                    <div
                      style={{ height: `${item.val}%` }}
                      className="w-full bg-[#00C887] hover:bg-emerald-600 rounded-t-lg transition-all relative group-hover:scale-y-105 origin-bottom"
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[9px] font-bold pointer-events-none whitespace-nowrap">
                        {item.label}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-slate-400">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Aktivitas Transaksi Terbaru */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Aktivitas Terkini</h3>
            <button
              onClick={() => onNavigateTab('approvals-hub')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  GAJI
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    PAY-2026-0701 · Budi Santoso
                  </div>
                  <div className="text-[10px] text-slate-400">Slip Gaji Disetujui</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-slate-900">
                  Rp 18.250.000
                </div>
                <div className="text-[10px] text-slate-400 font-mono">11:25 WIB</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  KLAIM
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    CLM-2026-0702 · Dewi Lestari
                  </div>
                  <div className="text-[10px] text-slate-400">Klaim Transport & Tol</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-slate-900">
                  Rp 450.000
                </div>
                <div className="text-[10px] text-slate-400 font-mono">10:45 WIB</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  SPPD
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    SPD-2026-0703 · Triyanto Andi
                  </div>
                  <div className="text-[10px] text-slate-400">Kunjungan Hub Surabaya</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-slate-900">
                  Rp 4.500.000
                </div>
                <div className="text-[10px] text-slate-400 font-mono">09:30 WIB</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  MED
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    RCP-2026-0704 · Nadia Safira
                  </div>
                  <div className="text-[10px] text-slate-400">Kuitansi Pengobatan</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-slate-900">
                  Rp 1.850.000
                </div>
                <div className="text-[10px] text-slate-400 font-mono">08:55 WIB</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Realisasi Kehadiran per Cabang */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Realisasi Kehadiran per Cabang (Bulan Ini)
            </h3>
          </div>

          <div className="space-y-3.5 py-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Kantor Pusat (Jakarta)</span>
                <span className="font-mono text-slate-900 font-bold">98% Kehadiran</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-[#1D63FF] h-full rounded-full w-[98%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Surabaya Tech Hub</span>
                <span className="font-mono text-slate-900 font-bold">94% Kehadiran</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-[#00C887] h-full rounded-full w-[94%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Bandung R&D Center</span>
                <span className="font-mono text-slate-900 font-bold">92% Kehadiran</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-[#FF7828] h-full rounded-full w-[92%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Kantor Operasional Bali</span>
                <span className="font-mono text-slate-900 font-bold">90% Kehadiran</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-[#7B61FF] h-full rounded-full w-[90%]" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Staf Lapangan & Remote</span>
                <span className="font-mono text-slate-900 font-bold">88% Kehadiran</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-[#FF2E7E] h-full rounded-full w-[88%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
