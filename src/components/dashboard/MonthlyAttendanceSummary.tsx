import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  BarChart3,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AttendanceRecord } from '../../types';

interface MonthlyAttendanceSummaryProps {
  records: AttendanceRecord[];
  onNavigateTab?: (tab: string) => void;
}

export const MonthlyAttendanceSummary: React.FC<MonthlyAttendanceSummaryProps> = ({
  records,
  onNavigateTab,
}) => {
  // Current month state (defaults to current date)
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [chartView, setChartView] = useState<'weekly' | 'category'>('weekly');

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth(); // 0-indexed

  // Month navigation
  const handlePrevMonth = () => {
    setSelectedDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(year, month + 1, 1));
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month;
  }, [year, month]);

  const monthName = selectedDate.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate statistics for the selected month
  const stats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Filter records for this month
    const monthRecords = records.filter((r) =>
      r.attendance_date && r.attendance_date.startsWith(monthPrefix)
    );

    // Days in this month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Calculate total standard working days (Mon-Fri) in this month
    let totalWorkDaysInMonth = 0;
    let elapsedWorkDays = 0;
    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalWorkDaysInMonth++;
        if (
          d <= today ||
          (year < today.getFullYear()) ||
          (year === today.getFullYear() && month < today.getMonth())
        ) {
          elapsedWorkDays++;
        }
      }
    }

    let onTimeCount = 0;
    let lateCount = 0;
    let totalLateMinutes = 0;
    let totalWorkDurationMinutes = 0;

    monthRecords.forEach((r) => {
      // Check if present/clocked in
      if (r.clock_in_time) {
        if (r.clock_in_status === 'late' || (r.late_minutes && r.late_minutes > 0)) {
          lateCount++;
          totalLateMinutes += r.late_minutes || 0;
        } else {
          onTimeCount++;
        }
      }
      if (r.work_duration_minutes) {
        totalWorkDurationMinutes += r.work_duration_minutes;
      }
    });

    const totalRecordedDays = onTimeCount + lateCount;
    const onTimePercentage =
      totalRecordedDays > 0 ? Math.round((onTimeCount / totalRecordedDays) * 100) : 100;

    // Weekly breakdown for BarChart
    // Weeks: Week 1 (1-7), Week 2 (8-14), Week 3 (15-21), Week 4 (22-28), Week 5 (29-31)
    const weeksData = [
      { name: 'Minggu 1 (Tgl 1-7)', shortName: 'Mgg 1', tepatWaktu: 0, terlambat: 0, total: 0 },
      { name: 'Minggu 2 (Tgl 8-14)', shortName: 'Mgg 2', tepatWaktu: 0, terlambat: 0, total: 0 },
      { name: 'Minggu 3 (Tgl 15-21)', shortName: 'Mgg 3', tepatWaktu: 0, terlambat: 0, total: 0 },
      { name: 'Minggu 4 (Tgl 22-28)', shortName: 'Mgg 4', tepatWaktu: 0, terlambat: 0, total: 0 },
      { name: 'Minggu 5 (Tgl 29-31)', shortName: 'Mgg 5', tepatWaktu: 0, terlambat: 0, total: 0 },
    ];

    monthRecords.forEach((r) => {
      if (!r.attendance_date || !r.clock_in_time) return;
      const dayNum = parseInt(r.attendance_date.split('-')[2], 10);
      let weekIdx = 0;
      if (dayNum <= 7) weekIdx = 0;
      else if (dayNum <= 14) weekIdx = 1;
      else if (dayNum <= 21) weekIdx = 2;
      else if (dayNum <= 28) weekIdx = 3;
      else weekIdx = 4;

      const isLate = r.clock_in_status === 'late' || (r.late_minutes && r.late_minutes > 0);
      if (isLate) {
        weeksData[weekIdx].terlambat++;
      } else {
        weeksData[weekIdx].tepatWaktu++;
      }
      weeksData[weekIdx].total++;
    });

    // Category summary data
    const categoryData = [
      { name: 'Tepat Waktu', jumlah: onTimeCount, fill: '#10B981' },
      { name: 'Terlambat', jumlah: lateCount, fill: '#F59E0B' },
      { name: 'Total Hadir', jumlah: totalRecordedDays, fill: '#3B82F6' },
      { name: 'Target Hari Kerja', jumlah: totalWorkDaysInMonth, fill: '#6366F1' },
    ];

    return {
      totalWorkDaysInMonth,
      elapsedWorkDays,
      totalRecordedDays,
      onTimeCount,
      lateCount,
      totalLateMinutes,
      totalWorkDurationMinutes,
      onTimePercentage,
      weeksData,
      categoryData,
    };
  }, [records, year, month]);

  // Discipline rating assessment
  const disciplineScore = stats.onTimePercentage;
  const disciplineBadge = useMemo(() => {
    if (disciplineScore >= 95) {
      return { grade: 'A+', label: 'Sangat Disiplin', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    }
    if (disciplineScore >= 85) {
      return { grade: 'A', label: 'Disiplin Baik', color: 'text-blue-700 bg-blue-100 border-blue-300' };
    }
    if (disciplineScore >= 70) {
      return { grade: 'B', label: 'Cukup Baik', color: 'text-amber-700 bg-amber-100 border-amber-300' };
    }
    return { grade: 'C', label: 'Perlu Perhatian', color: 'text-rose-700 bg-rose-100 border-rose-300' };
  }, [disciplineScore]);

  // Custom recharts tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color || item.fill }} />
                <span className="text-slate-300">{item.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">{item.value} Hari</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-lg shadow-slate-200/40 space-y-5">
      {/* 1. Header with Month Navigator & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Statistik Ringkasan Kehadiran Bulanan</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${disciplineBadge.color}`}>
                  Grade {disciplineBadge.grade}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Laporan metrik disiplin kerja, ketepatan waktu, dan grafik distribusi presensi
              </p>
            </div>
          </div>
        </div>

        {/* Month selector controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-800 font-mono text-xs capitalize">
              {monthName}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isCurrentMonth && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              Bulan Berjalan
            </span>
          )}
        </div>
      </div>

      {/* 2. Three Primary Summary Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Total Hari Kerja */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-2 right-2 p-2 rounded-xl bg-blue-500/10 text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
            Total Hari Kerja
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {stats.totalRecordedDays}
            </span>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              / {stats.totalWorkDaysInMonth} Hari
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-blue-200/60 pt-2">
            <span>Target Sebulan:</span>
            <span className="font-bold text-slate-800">{stats.totalWorkDaysInMonth} hari kerja</span>
          </div>
        </div>

        {/* Card 2: Jumlah Absen Tepat Waktu */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-2 right-2 p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
            Absen Tepat Waktu
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
              {stats.onTimeCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600 font-mono">
              Hari ({stats.onTimePercentage}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-emerald-200/60 pt-2">
            <span>Tingkat Ketepatan:</span>
            <span className="font-bold text-emerald-700">{stats.onTimePercentage}% Disiplin</span>
          </div>
        </div>

        {/* Card 3: Keterlambatan */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-200/80 shadow-xs relative overflow-hidden group">
          <div className="absolute top-2 right-2 p-2 rounded-xl bg-amber-500/10 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
            Keterlambatan
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${stats.lateCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {stats.lateCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              Kali ({stats.totalLateMinutes} Menit)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-amber-200/60 pt-2">
            <span>Total Keterlambatan:</span>
            <span className={`font-bold ${stats.lateCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {stats.totalLateMinutes > 0 ? `${stats.totalLateMinutes} menit` : '0 menit (Nihil)'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Recharts BarChart Section */}
      <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              Grafik Distribusi Kehadiran ({monthName})
            </h4>
          </div>

          {/* Toggle between weekly trend and category summary */}
          <div className="inline-flex items-center bg-white p-0.5 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartView('weekly')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                chartView === 'weekly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tren Per Minggu
            </button>
            <button
              type="button"
              onClick={() => setChartView('category')}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                chartView === 'category'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Komparasi Kategori
            </button>
          </div>
        </div>

        {/* BarChart Container */}
        <div className="h-64 sm:h-72 w-full pt-2">
          {chartView === 'weekly' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.weeksData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                  formatter={(value) => <span className="font-semibold text-slate-700">{value}</span>}
                />
                <Bar
                  dataKey="tepatWaktu"
                  name="Tepat Waktu"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="terlambat"
                  name="Terlambat"
                  fill="#F59E0B"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.categoryData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="jumlah"
                  name="Jumlah Hari"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Interactive legend & insight note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]" />
              <span>Tepat Waktu: {stats.onTimeCount} hari</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" />
              <span>Terlambat: {stats.lateCount} hari</span>
            </span>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('attendance-history')}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Lihat Detail Riwayat Harian</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Discipline Recommendation & Recognition Card */}
      <div className="p-3.5 bg-gradient-to-r from-blue-50/60 via-slate-50 to-emerald-50/60 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>Evaluasi Disiplin Presensi: {disciplineBadge.label}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {stats.lateCount === 0
                ? 'Luar biasa! Tidak ada keterlambatan tercatat bulan ini. Pertahankan ketepatan waktu Anda.'
                : `${stats.lateCount} kali keterlambatan tercatat dengan total akumulasi ${stats.totalLateMinutes} menit. Pastikan selalu clock-in sebelum batas toleransi shift.`}
            </p>
          </div>
        </div>

        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('clock-in')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto transition-all cursor-pointer shadow-xs"
          >
            <span>Buka Kamera Presensi</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
