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
      {/* ROW 1: THE 6 VIBRANT GRADIENT METRIC CARDS (Direct from reference image) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Purple Gradient (Today's Attendance) */}
        <div
          onClick={() => onNavigateTab('attendance-monitoring')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#5B4DFB] to-[#7B61FF] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Today's Attendance</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono">
              {clockedTotal} / {totalCount}
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▲ 12.8% vs Yesterday</span>
            </div>
          </div>
          {/* Subtle SVG Wave Curve at bottom */}
          <div className="absolute -bottom-1 left-0 right-0 h-6 pointer-events-none opacity-40">
            <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0.00,49.98 C149.99,150.00 349.89,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Emerald Green Gradient (On-Time Attendance) */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#00A86B] to-[#00C887] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">This Month Hours</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono">
              2,865.4 hrs
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▲ 18.6% vs Last Month</span>
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

        {/* Card 3: Orange Gradient (Today's Overtime / Productivity) */}
        <div
          onClick={() => onNavigateTab('overtime')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#FF6B00] to-[#FFA200] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Today's Overtime</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono">
              18.5 hrs
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▲ 10.4% vs Yesterday</span>
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

        {/* Card 4: Royal Blue Gradient (Total Payroll Value) */}
        <div
          onClick={() => onNavigateTab('payroll')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#176BFF] to-[#0096FF] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Total Payroll Value</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Gem className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xl font-bold tracking-tight font-mono truncate">
              Rp 248.5M
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▲ 9.2% vs Last Month</span>
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

        {/* Card 5: Hot Pink Gradient (Total Workforce) */}
        <div
          onClick={() => onNavigateTab('employees')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#FF2E7E] to-[#FF5E98] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Total Workforce</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-2xl font-bold tracking-tight font-mono">
              {totalCount} Staff
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▲ 7.1% vs Last Month</span>
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

        {/* Card 6: Teal Gradient (Reimbursement Claims Out) */}
        <div
          onClick={() => onNavigateTab('reimbursements')}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#00B4D8] to-[#0096C7] text-white shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-white/90">Claims & Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-xl font-bold tracking-tight font-mono truncate">
              Rp 18.7M
            </div>
            <div className="text-[11px] font-medium text-white/90 flex items-center gap-1">
              <span>▼ 3.4% vs Last Month</span>
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
        {/* Card 1: Attendance Overview Line Chart (Span 6) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Attendance Overview (This Month)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Clock-Ins
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  On-Time
                </span>
              </div>
              <button className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1">
                <span>This Month</span>
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
                  20 Staff
                </text>
                <text x="15" y="85" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  15 Staff
                </text>
                <text x="15" y="125" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  10 Staff
                </text>
                <text x="15" y="165" fontSize="10" fill="#94A3B8" fontFamily="monospace">
                  5 Staff
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

        {/* Card 2: Sales / Workforce by Category Donut Chart (Span 3) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Workforce by Department</h3>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            {/* SVG Donut with Center Diamond Icon */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Segment 1: Engineering (Orange) - 45% */}
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
                {/* Segment 2: Human Resources (Blue) - 25% */}
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
                {/* Segment 3: Finance (Emerald) - 15% */}
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
                {/* Segment 4: Product (Purple) - 10% */}
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
                {/* Segment 5: Sales (Pink) - 5% */}
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

              {/* Center Diamond Icon */}
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
                  <span className="font-medium text-slate-700">Engineering</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">45% (8 staff)</div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1D63FF]" />
                  <span className="font-medium text-slate-700">Human Resources</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">25% (4 staff)</div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00C887]" />
                  <span className="font-medium text-slate-700">Finance & Acc</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">15% (3 staff)</div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7B61FF]" />
                  <span className="font-medium text-slate-700">Product & Design</span>
                </div>
                <div className="font-mono text-slate-900 font-bold">10% (2 staff)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Collection / Workforce Summary (Today) (Span 3) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Workforce Summary (Today)
            </h3>
          </div>

          <div className="space-y-3 py-2">
            {/* Item 1: On-Duty Office (Green) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  🏢
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Head Office (JKT)
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-900">8 Staff</div>
                <div className="text-[10px] text-slate-400 font-mono">47%</div>
              </div>
            </div>

            {/* Item 2: Tech Hub Surabaya (Blue) */}
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
                <div className="text-xs font-mono font-bold text-slate-900">5 Staff</div>
                <div className="text-[10px] text-slate-400 font-mono">29%</div>
              </div>
            </div>

            {/* Item 3: Bandung R&D (Orange) */}
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
                <div className="text-xs font-mono font-bold text-slate-900">2 Staff</div>
                <div className="text-[10px] text-slate-400 font-mono">12%</div>
              </div>
            </div>

            {/* Item 4: Remote / SPPD (Purple) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                  ✈️
                </div>
                <div className="text-xs font-semibold text-slate-800">
                  Remote & SPPD
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-900">2 Staff</div>
                <div className="text-[10px] text-slate-400 font-mono">12%</div>
              </div>
            </div>
          </div>

          {/* Green Bottom Summary Banner */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Total Workforce</span>
            <span className="text-emerald-600 font-mono text-sm">
              17 Staff (100%)
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: TOP PERFORMERS TABLE + STOCK SUMMARY + LOW STOCK ALERTS            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Top 5 Best Disciplined Departments (Span 4) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Top 5 Attendance Ranking
              </h3>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-semibold">
                    <th className="pb-2 font-mono">#</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2 font-mono">Staff</th>
                    <th className="pb-2 font-mono text-right">Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-2.5 font-mono text-slate-400">1</td>
                    <td className="py-2.5 font-bold text-slate-800">Engineering & Tech</td>
                    <td className="py-2.5 font-mono text-slate-500">8 staff</td>
                    <td className="py-2.5 font-mono text-emerald-600 font-bold text-right">98.5%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-mono text-slate-400">2</td>
                    <td className="py-2.5 font-bold text-slate-800">Finance & Accounting</td>
                    <td className="py-2.5 font-mono text-slate-500">3 staff</td>
                    <td className="py-2.5 font-mono text-emerald-600 font-bold text-right">96.0%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-mono text-slate-400">3</td>
                    <td className="py-2.5 font-bold text-slate-800">Human Resources</td>
                    <td className="py-2.5 font-mono text-slate-500">4 staff</td>
                    <td className="py-2.5 font-mono text-emerald-600 font-bold text-right">95.2%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-mono text-slate-400">4</td>
                    <td className="py-2.5 font-bold text-slate-800">Product & Design</td>
                    <td className="py-2.5 font-mono text-slate-500">2 staff</td>
                    <td className="py-2.5 font-mono text-emerald-600 font-bold text-right">92.0%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-mono text-slate-400">5</td>
                    <td className="py-2.5 font-bold text-slate-800">Sales & Operations</td>
                    <td className="py-2.5 font-mono text-slate-500">1 staff</td>
                    <td className="py-2.5 font-mono text-emerald-600 font-bold text-right">90.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
            >
              <span>View All Reports</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Card 2: Stock / Workforce & Shifts Summary (Span 4) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Workforce Metrics Summary
              </h3>
            </div>

            <div className="space-y-3 py-3">
              {/* Metric 1 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    👥
                  </div>
                  <span className="font-medium text-slate-700">Total Registered Items</span>
                </div>
                <span className="font-mono font-bold text-slate-900">17 Employees</span>
              </div>

              {/* Metric 2 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    ⏱️
                  </div>
                  <span className="font-medium text-slate-700">Monthly Working Hours</span>
                </div>
                <span className="font-mono font-bold text-slate-900">2,865.4 hrs</span>
              </div>

              {/* Metric 3 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    💰
                  </div>
                  <span className="font-medium text-slate-700">Total Net Payroll Payout</span>
                </div>
                <span className="font-mono font-bold text-slate-900">Rp 248,540,000</span>
              </div>

              {/* Metric 4 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    📋
                  </div>
                  <span className="font-medium text-slate-700">Active Reimbursements</span>
                </div>
                <span className="font-mono font-bold text-slate-900">Rp 18,754,000</span>
              </div>

              {/* Metric 5 */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    🎯
                  </div>
                  <span className="font-medium text-slate-700">KPI Performance Index</span>
                </div>
                <span className="font-mono font-bold text-slate-900">89.4 / 100</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigateTab('payroll')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
            >
              <span>View Financial & Payroll Report</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Card 3: Action Required Alerts (Span 4) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-4 h-4" />
                <h3 className="text-sm font-bold text-slate-800">
                  Action Required Alerts (5 Items)
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-semibold">
                    <th className="pb-2">Requester / Task</th>
                    <th className="pb-2 font-mono">Category</th>
                    <th className="pb-2 font-mono">Date</th>
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
                        Pending
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Ahmad Rizky</td>
                    <td className="py-2.5 font-mono text-slate-500">Lembur Shift</td>
                    <td className="py-2.5 font-mono text-slate-400">11 Jul</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Eko Prasetyo</td>
                    <td className="py-2.5 font-mono text-slate-500">Late Arrival</td>
                    <td className="py-2.5 font-mono text-slate-400">11 Jul</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Late
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Nadia Safira</td>
                    <td className="py-2.5 font-mono text-slate-500">Reimbursement</td>
                    <td className="py-2.5 font-mono text-slate-400">10 Jul</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Critical
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Budi Santoso</td>
                    <td className="py-2.5 font-mono text-slate-500">SPPD Sby</td>
                    <td className="py-2.5 font-mono text-slate-400">09 Jul</td>
                    <td className="py-2.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
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
              className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors"
            >
              <span>View All Approvals & Alerts</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 4: MONTHLY BAR CHART + RECENT ACTIVITIES + BRANCH WISE SALES PROGRESS  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Monthly Attendance Trend Bar Chart (Span 4) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Monthly Attendance Trend
            </h3>
            <button className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1">
              <span>This Year</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Vertical Green Bars (Exact match to reference image) */}
          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end justify-between px-2 gap-2">
              {[
                { month: 'Jan', val: 55, label: '92%' },
                { month: 'Feb', val: 70, label: '94%' },
                { month: 'Mar', val: 80, label: '96%' },
                { month: 'Apr', val: 85, label: '97%' },
                { month: 'May', val: 65, label: '93%' },
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

        {/* Card 2: Recent Transactions / Operations List (Span 4) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Recent Transactions</h3>
            <button
              onClick={() => onNavigateTab('approvals-hub')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3 py-2">
            {/* Item 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  INV
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    PAY-2026-0701 · Budi Santoso
                  </div>
                  <div className="text-[10px] text-slate-400">Salary Slip Approved</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-slate-900">
                  Rp 18,250,000
                </div>
                <div className="text-[10px] text-slate-400 font-mono">11:25 AM</div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  CLM
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    CLM-2026-0702 · Dewi Lestari
                  </div>
                  <div className="text-[10px] text-slate-400">Transport & Tol Claim</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-slate-900">
                  Rp 450,000
                </div>
                <div className="text-[10px] text-slate-400 font-mono">10:45 AM</div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  SPD
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    SPD-2026-0703 · Triyanto Andi
                  </div>
                  <div className="text-[10px] text-slate-400">Surabaya Hub Visit</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-slate-900">
                  Rp 4,500,000
                </div>
                <div className="text-[10px] text-slate-400 font-mono">09:30 AM</div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  RCP
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    RCP-2026-0704 · Nadia Safira
                  </div>
                  <div className="text-[10px] text-slate-400">Medical Claim Receipt</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-slate-900">
                  Rp 1,850,000
                </div>
                <div className="text-[10px] text-slate-400 font-mono">08:55 AM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Branch Wise Attendance (This Month) (Span 4) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Branch Wise Attendance (This Month)
            </h3>
          </div>

          <div className="space-y-3.5 py-3">
            {/* Branch 1: Main Branch (Blue) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Main Branch (Jakarta)</span>
                <span className="font-mono text-slate-900 font-bold">Rp 125,400,000 (98%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-[#1D63FF] h-full rounded-full w-[95%]" />
              </div>
            </div>

            {/* Branch 2: Surabaya (Green) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Surabaya Tech Hub</span>
                <span className="font-mono text-slate-900 font-bold">Rp 65,200,000 (94%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-[#00C887] h-full rounded-full w-[70%]" />
              </div>
            </div>

            {/* Branch 3: Bandung (Orange) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Bandung R&D Center</span>
                <span className="font-mono text-slate-900 font-bold">Rp 48,750,000 (92%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-[#FF7828] h-full rounded-full w-[52%]" />
              </div>
            </div>

            {/* Branch 4: Bali Hub (Purple) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Bali Operational Hub</span>
                <span className="font-mono text-slate-900 font-bold">Rp 28,300,000 (90%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-[#7B61FF] h-full rounded-full w-[35%]" />
              </div>
            </div>

            {/* Branch 5: Remote (Pink) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">Remote & Field Staff</span>
                <span className="font-mono text-slate-900 font-bold">Rp 18,890,000 (88%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-[#FF2E7E] h-full rounded-full w-[25%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
