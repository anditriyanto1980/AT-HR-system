import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  X,
  Eye,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { AttendanceRecord } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate, formatMinutes, formatTime } from '../../utils/attendance';

export const AttendanceHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const allRecords = dataService.getAttendanceRecords();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [previewModalRecord, setPreviewModalRecord] = useState<AttendanceRecord | null>(null);

  if (!currentUser) return null;

  // Records for current employee
  const myRecords = allRecords.filter((r) => r.employee_id === currentUser.id);

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthYearStr = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Summary Metrics
  const presentDays = myRecords.filter((r) => r.clock_in_status === 'present').length;
  const lateDays = myRecords.filter((r) => r.clock_in_status === 'late').length;
  const totalWorkedMinutes = myRecords.reduce((acc, curr) => acc + (curr.work_duration_minutes || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Riwayat Presensi Pribadi</h2>
          <p className="text-xs text-slate-500">
            Log lengkap kehadiran, verifikasi foto kamera masuk & pulang, serta durasi jam kerja
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-900 min-w-[120px] text-center font-mono capitalize">
            {monthYearStr}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Hadir Tepat Waktu</span>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {presentDays} Hari
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Jumlah Terlambat</span>
          <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
            {lateDays} Kali
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Akumulasi Jam Kerja</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatMinutes(totalWorkedMinutes)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Tabel Rekapitulasi Presensi</h3>
          <span className="text-xs text-slate-500">{myRecords.length} rekaman tercatat</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Tanggal</th>
                <th className="py-2.5 px-4">Shift</th>
                <th className="py-2.5 px-4">Clock In (Masuk)</th>
                <th className="py-2.5 px-4">Clock Out (Pulang)</th>
                <th className="py-2.5 px-4 text-center">Foto Kamera</th>
                <th className="py-2.5 px-4">Durasi Kerja</th>
                <th className="py-2.5 px-4">Lokasi</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada data presensi pada akun Anda.
                  </td>
                </tr>
              ) : (
                myRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 font-mono">
                      {formatDate(rec.attendance_date)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rec.shift_name || 'Normal'}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                      {formatTime(rec.clock_in_time)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 tabular-nums">
                      {formatTime(rec.clock_out_time)}
                    </td>
                    {/* Selfie Thumbnails */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {rec.clock_in_selfie_url ? (
                          <button
                            onClick={() => setPreviewModalRecord(rec)}
                            className="relative group cursor-pointer"
                            title="Foto Masuk"
                          >
                            <img
                              src={rec.clock_in_selfie_url}
                              alt="In Selfie"
                              className="w-7 h-7 rounded-md object-cover border border-slate-300 hover:ring-2 hover:ring-blue-500 transition-all shadow-2xs"
                            />
                            <span className="absolute -bottom-1 -right-1 text-[7px] font-bold bg-emerald-600 text-white px-0.5 rounded leading-none">
                              IN
                            </span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300">-</span>
                        )}

                        {rec.clock_out_selfie_url ? (
                          <button
                            onClick={() => setPreviewModalRecord(rec)}
                            className="relative group cursor-pointer"
                            title="Foto Pulang"
                          >
                            <img
                              src={rec.clock_out_selfie_url}
                              alt="Out Selfie"
                              className="w-7 h-7 rounded-md object-cover border border-slate-300 hover:ring-2 hover:ring-rose-500 transition-all shadow-2xs"
                            />
                            <span className="absolute -bottom-1 -right-1 text-[7px] font-bold bg-rose-600 text-white px-0.5 rounded leading-none">
                              OUT
                            </span>
                          </button>
                        ) : rec.clock_out_time ? (
                          <span className="text-[10px] text-slate-300">-</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {rec.work_duration_minutes ? formatMinutes(rec.work_duration_minutes) : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[120px]">
                          {rec.clock_in_location_name || rec.branch_name || 'Office'}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={rec.clock_in_status} />
                      {rec.late_minutes > 0 && (
                        <span className="text-[10px] text-amber-700 font-semibold block font-mono">
                          +{rec.late_minutes}m late
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal for Selfie Photos */}
      {previewModalRecord && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Bukti Foto Kamera Presensi: {formatDate(previewModalRecord.attendance_date)}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Clock In Selfie */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 1. Clock In (Masuk)
                    </span>
                    <span className="font-mono text-slate-500 font-semibold">
                      {formatTime(previewModalRecord.clock_in_time)}
                    </span>
                  </div>
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                    {previewModalRecord.clock_in_selfie_url ? (
                      <img
                        src={previewModalRecord.clock_in_selfie_url}
                        alt="Clock In Selfie"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Tidak ada foto</span>
                    )}
                  </div>
                </div>

                {/* Clock Out Selfie */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 2. Clock Out (Pulang)
                    </span>
                    <span className="font-mono text-slate-500 font-semibold">
                      {formatTime(previewModalRecord.clock_out_time)}
                    </span>
                  </div>
                  <div className="aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                    {previewModalRecord.clock_out_selfie_url ? (
                      <img
                        src={previewModalRecord.clock_out_selfie_url}
                        alt="Clock Out Selfie"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">Belum Clock Out</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata Info */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-200">
                <div className="flex justify-between">
                  <span>Lokasi Presensi:</span>
                  <span className="font-semibold text-slate-800">
                    {previewModalRecord.clock_in_location_name || 'Kantor'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Perangkat / Browser:</span>
                  <span className="font-mono text-[11px] text-slate-700 truncate max-w-[250px]">
                    {previewModalRecord.clock_in_device || 'Web Browser'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Durasi Kerja:</span>
                  <span className="font-bold text-blue-700">
                    {previewModalRecord.work_duration_minutes
                      ? formatMinutes(previewModalRecord.work_duration_minutes)
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 text-right">
              <button
                onClick={() => setPreviewModalRecord(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
