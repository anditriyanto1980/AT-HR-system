import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  MapPin,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Camera,
  ExternalLink,
  X,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { AttendanceRecord } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate, formatMinutes, formatTime } from '../../utils/attendance';
import { formatDistance } from '../../utils/geo';

export const AttendanceMonitoring: React.FC = () => {
  const branches = dataService.getBranches();
  const departments = dataService.getDepartments();
  const allRecords = dataService.getAttendanceRecords();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewSelfie, setPreviewSelfie] = useState<string | null>(null);

  const filtered = allRecords.filter((rec) => {
    if (rec.attendance_date !== selectedDate) return false;
    if (selectedBranch !== 'all' && rec.branch_name !== selectedBranch) return false;
    if (selectedStatus !== 'all' && rec.clock_in_status !== selectedStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = rec.employee_name?.toLowerCase().includes(q);
      const matchCode = rec.employee_code?.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Workforce Attendance Live Monitoring</h2>
          <p className="text-xs text-slate-500">
            Real-time audit log of clock-in geolocations, selfie captures, and tolerances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee name or code..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
          >
            <option value="all">All Attendance Statuses</option>
            <option value="present">Present (On Time)</option>
            <option value="late">Late Arrival</option>
            <option value="early_checkout">Early Checkout</option>
          </select>
        </div>
      </div>

      {/* Monitoring Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Status & Late</th>
                <th className="py-3 px-4">Geofence / Location</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4 text-center">Selfie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No attendance records found for {formatDate(selectedDate)}.
                  </td>
                </tr>
              ) : (
                filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rec.employee_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{rec.employee_code} · {rec.department_name}</div>
                    </td>

                    {/* Shift */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {rec.shift_name || 'Normal Shift'}
                    </td>

                    {/* Clock In */}
                    <td className="py-3 px-4 font-mono font-semibold tabular-nums text-slate-900">
                      {formatTime(rec.clock_in_time)}
                    </td>

                    {/* Clock Out */}
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {formatTime(rec.clock_out_time)}
                      {rec.work_duration_minutes ? (
                        <span className="text-[10px] text-slate-400 block">
                          ({formatMinutes(rec.work_duration_minutes)})
                        </span>
                      ) : null}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={rec.clock_in_status} />
                      {rec.late_minutes > 0 && (
                        <span className="text-[11px] text-amber-700 font-mono font-semibold block mt-0.5">
                          +{rec.late_minutes}m late
                        </span>
                      )}
                    </td>

                    {/* Geofence */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.clock_in_location_name || rec.branch_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {rec.is_outside_geofence ? (
                          <span className="text-amber-700 font-semibold">
                            Outside ({formatDistance(rec.clock_in_distance_meters || 0)})
                          </span>
                        ) : (
                          <span className="text-emerald-700">
                            Verified ({formatDistance(rec.clock_in_distance_meters || 0)})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Device */}
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono truncate max-w-[130px]">
                      {rec.clock_in_device || 'Web Browser'}
                    </td>

                    {/* Selfie Snapshot */}
                    <td className="py-3 px-4 text-center">
                      {rec.clock_in_selfie_url ? (
                        <button
                          onClick={() => setPreviewSelfie(rec.clock_in_selfie_url!)}
                          className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 inline-block hover:ring-2 hover:ring-slate-900 transition-all shadow-2xs"
                          title="Click to view photo snapshot"
                        >
                          <img
                            src={rec.clock_in_selfie_url}
                            alt="Selfie"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No Photo</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selfie Preview Lightbox */}
      {previewSelfie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 relative shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-slate-700" />
                <span>Attendance Selfie Verification</span>
              </span>
              <button
                onClick={() => setPreviewSelfie(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewSelfie}
              alt="Clock in snapshot"
              className="w-full rounded-xl object-cover aspect-4/3 border border-slate-200"
            />
            <p className="text-[11px] text-slate-500 text-center">
              Timestamped snapshot captured at clock-in
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
