import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
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
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

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

  const monthYearStr = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  // Summary Metrics
  const presentDays = myRecords.filter((r) => r.clock_in_status === 'present').length;
  const lateDays = myRecords.filter((r) => r.clock_in_status === 'late').length;
  const totalWorkedMinutes = myRecords.reduce((acc, curr) => acc + (curr.work_duration_minutes || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Personal Attendance Record</h2>
          <p className="text-xs text-slate-500">
            Log of all clock-in events, work durations, and monthly status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-900 min-w-[120px] text-center font-mono">
            {monthYearStr}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Days Present (On Time)</span>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {presentDays}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Times Late</span>
          <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
            {lateDays}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Hours Tracked</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatMinutes(totalWorkedMinutes)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Attendance Log History</h3>
          <span className="text-xs text-slate-500">{myRecords.length} records recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Shift</th>
                <th className="py-2.5 px-4">Clock In</th>
                <th className="py-2.5 px-4">Clock Out</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No records found for your account.
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
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {rec.work_duration_minutes ? formatMinutes(rec.work_duration_minutes) : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{rec.clock_in_location_name || rec.branch_name || 'Office'}</span>
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
    </div>
  );
};
