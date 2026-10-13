import React from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Info,
  ChevronRight,
  Plane,
} from 'lucide-react';
import { LeaveBalance } from '../../types';

interface AnnualLeaveProgressBarProps {
  balance?: LeaveBalance | null;
  onNavigateTab: (tab: string) => void;
}

export const AnnualLeaveProgressBar: React.FC<AnnualLeaveProgressBarProps> = ({
  balance,
  onNavigateTab,
}) => {
  const currentYear = new Date().getFullYear();

  // Safely extract leave balance numbers with reliable defaults
  const entitlement = balance?.entitlement ?? 12;
  const used = balance?.used ?? 4;
  const pending = balance?.pending ?? 1;
  const calculatedRemaining = Math.max(0, entitlement - used - pending);
  const remaining = balance?.remaining ?? calculatedRemaining;

  // Percentages relative to total entitlement
  const usedPercentage = Math.min(100, Math.round((used / entitlement) * 100));
  const pendingPercentage = Math.min(
    100 - usedPercentage,
    Math.round((pending / entitlement) * 100)
  );
  const remainingPercentage = Math.max(0, 100 - usedPercentage - pendingPercentage);

  // Status badge evaluation
  const isHealthy = remaining >= 6;
  const isLow = remaining > 0 && remaining < 4;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-lg shadow-slate-200/40 space-y-4">
      {/* 1. Header with Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Sisa Jatah Cuti Tahunan ({balance?.year ?? currentYear})
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isHealthy
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isLow
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {remainingPercentage}% Tersedia
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Pantau pemakaian kuota dan sisa hak cuti resmi tahun berjalan
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('leave')}
          className="self-start sm:self-auto px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <span>+ Ajukan Cuti</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Key Numbers Showcase */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Sisa Hari Cuti Tersedia
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
              {remaining}
            </span>
            <span className="text-sm font-semibold text-slate-500 font-mono">
              / {entitlement} Hari Kerja
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Kadaluarsa: 31 Des {currentYear}</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kuota Siap Pakai</span>
          </div>
        </div>
      </div>

      {/* 3. Sleek Multi-Segment Progress Bar */}
      <div className="space-y-2 pt-1">
        {/* The main progress bar track */}
        <div
          className="relative w-full h-4 sm:h-5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 flex shadow-inner"
          title={`Sisa: ${remaining} hari (${remainingPercentage}%), Menunggu: ${pending} hari (${pendingPercentage}%), Terpakai: ${used} hari (${usedPercentage}%)`}
        >
          {/* Segment 1: Sisa Kuota (Remaining - Emerald Gradient) */}
          {remainingPercentage > 0 && (
            <div
              style={{ width: `${remainingPercentage}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 rounded-l-full relative transition-all duration-500 group flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {remainingPercentage >= 15 && (
                <span className="text-[9px] font-black text-white drop-shadow-xs px-1 select-none">
                  {remaining} Hari
                </span>
              )}
            </div>
          )}

          {/* Segment 2: Menunggu Approval (Pending - Amber with Striped Texture) */}
          {pendingPercentage > 0 && (
            <div
              style={{ width: `${pendingPercentage}%` }}
              className="h-full bg-amber-400 relative transition-all duration-500 group flex items-center justify-center overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #000, #000 4px, transparent 4px, transparent 8px)',
                }}
              />
              {pendingPercentage >= 12 && (
                <span className="text-[9px] font-black text-amber-950 relative z-10 drop-shadow-xs px-1 select-none">
                  {pending}
                </span>
              )}
            </div>
          )}

          {/* Segment 3: Terpakai (Used - Blue/Slate) */}
          {usedPercentage > 0 && (
            <div
              style={{ width: `${usedPercentage}%` }}
              className={`h-full bg-gradient-to-r from-blue-500 to-indigo-500 relative transition-all duration-500 group flex items-center justify-center ${
                remainingPercentage === 0 && pendingPercentage === 0 ? 'rounded-l-full' : ''
              } rounded-r-full`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {usedPercentage >= 15 && (
                <span className="text-[9px] font-black text-white drop-shadow-xs px-1 select-none">
                  {used} Hari
                </span>
              )}
            </div>
          )}
        </div>

        {/* Day Tick Markers (Visual scale for each day) */}
        <div className="hidden sm:flex justify-between px-1 text-[9px] text-slate-400 font-mono select-none">
          <span>0 Hari</span>
          <span>3 Hari</span>
          <span>6 Hari (50%)</span>
          <span>9 Hari</span>
          <span>{entitlement} Hari (Total Kuota)</span>
        </div>
      </div>

      {/* 4. Interactive Breakdown Metric Chips (4 Columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Chip 1: Sisa Cuti */}
        <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              <span>Sisa Tersedia</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 font-mono">
              {remainingPercentage}%
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-800 font-mono">
            {remaining} <span className="text-xs font-semibold text-emerald-600">Hari</span>
          </div>
          <p className="text-[10px] text-emerald-700/90 leading-tight">
            Siap digunakan kapan saja
          </p>
        </div>

        {/* Chip 2: Menunggu Persetujuan */}
        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200 animate-pulse" />
              <span>Menunggu</span>
            </span>
            <span className="text-[10px] font-bold text-amber-700 font-mono">
              {pendingPercentage}%
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-800 font-mono">
            {pending} <span className="text-xs font-semibold text-amber-600">Hari</span>
          </div>
          <p className="text-[10px] text-amber-700/90 leading-tight">
            Dalam review atasan
          </p>
        </div>

        {/* Chip 3: Terpakai */}
        <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200" />
              <span>Sudah Terpakai</span>
            </span>
            <span className="text-[10px] font-bold text-blue-700 font-mono">
              {usedPercentage}%
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-blue-800 font-mono">
            {used} <span className="text-xs font-semibold text-blue-600">Hari</span>
          </div>
          <p className="text-[10px] text-blue-700/90 leading-tight">
            Disetujui tahun ini
          </p>
        </div>

        {/* Chip 4: Total Hak Cuti */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 ring-2 ring-slate-200" />
              <span>Total Hak Cuti</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 font-mono">
              100%
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-800 font-mono">
            {entitlement} <span className="text-xs font-semibold text-slate-500">Hari</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Alokasi setahun penuh
          </p>
        </div>
      </div>

      {/* 5. Policy Notice & Leave Portal Link */}
      <div className="p-3 bg-gradient-to-r from-slate-50 via-emerald-50/40 to-teal-50/40 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-[11px] leading-relaxed">
            <strong>Catatan Hak Cuti:</strong> Sisa cuti tahun {balance?.year ?? currentYear} dapat digunakan hingga akhir tahun kerja. Pengajuan cuti dianjurkan minimal H-3 sebelum pelaksanaan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('leave')}
          className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer text-[11px]"
        >
          <span>Kelola Cuti Lengkap</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
