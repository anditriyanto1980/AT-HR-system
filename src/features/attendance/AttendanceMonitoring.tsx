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
  Plus,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { AttendanceRecord, AttendanceStatus, Shift } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate, formatMinutes, formatTime } from '../../utils/attendance';
import { formatDistance } from '../../utils/geo';

export const AttendanceMonitoring: React.FC = () => {
  const { role } = useAuth();
  const isSuperOrHr = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const branches = dataService.getBranches();
  const departments = dataService.getDepartments();
  const employees = dataService.getEmployees().filter((e) => e.employment_status === 'Active');
  const shifts = dataService.getShifts().filter((s) => s.is_active);

  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>(dataService.getAttendanceRecords());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewSelfie, setPreviewSelfie] = useState<{ url: string; label: string; name?: string } | null>(null);

  // Modal State for Manual Add / Edit Attendance Record
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [form, setForm] = useState({
    employee_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    shift_id: '',
    clock_in_time: '08:00',
    clock_out_time: '17:00',
    clock_in_status: 'present' as AttendanceStatus,
    late_minutes: 0,
    branch_id: '',
    notes: '',
  });

  const reloadRecords = () => {
    setAllRecords(dataService.getAttendanceRecords());
  };

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setForm({
      employee_id: employees[0]?.id || '',
      attendance_date: selectedDate,
      shift_id: shifts[0]?.id || '',
      clock_in_time: '08:00',
      clock_out_time: '17:00',
      clock_in_status: 'present',
      late_minutes: 0,
      branch_id: branches[0]?.id || '',
      notes: 'Input manual oleh Admin',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    const inTime = rec.clock_in_time ? formatTime(rec.clock_in_time) : '08:00';
    const outTime = rec.clock_out_time ? formatTime(rec.clock_out_time) : '';
    setForm({
      employee_id: rec.employee_id,
      attendance_date: rec.attendance_date,
      shift_id: rec.shift_id || shifts[0]?.id || '',
      clock_in_time: inTime,
      clock_out_time: outTime,
      clock_in_status: rec.clock_in_status || 'present',
      late_minutes: rec.late_minutes || 0,
      branch_id: branches.find((b) => b.name === rec.branch_name)?.id || branches[0]?.id || '',
      notes: rec.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === form.employee_id);
    const shift = shifts.find((s) => s.id === form.shift_id);
    const branch = branches.find((b) => b.id === form.branch_id);

    const clockInIso = `${form.attendance_date}T${form.clock_in_time}:00`;
    const clockOutIso = form.clock_out_time
      ? `${form.attendance_date}T${form.clock_out_time}:00`
      : undefined;

    let workMinutes = 0;
    if (clockOutIso) {
      const start = new Date(clockInIso).getTime();
      const end = new Date(clockOutIso).getTime();
      if (end > start) {
        workMinutes = Math.round((end - start) / 60000);
      }
    }

    const recordData: AttendanceRecord = {
      id: editingRecord ? editingRecord.id : `att-${Date.now()}`,
      employee_id: form.employee_id,
      employee_name: emp?.full_name,
      employee_code: emp?.employee_code,
      department_name: emp?.department_name,
      branch_name: branch?.name || emp?.branch_name || 'Head Office',
      attendance_date: form.attendance_date,
      shift_id: form.shift_id,
      shift_name: shift?.name || 'Normal Shift',
      clock_in_time: clockInIso,
      clock_out_time: clockOutIso,
      clock_in_status: form.clock_in_status,
      late_minutes: Number(form.late_minutes),
      early_checkout_minutes: editingRecord?.early_checkout_minutes || 0,
      work_duration_minutes: workMinutes || (editingRecord?.work_duration_minutes || 480),
      overtime_minutes: editingRecord?.overtime_minutes || 0,
      clock_in_device: editingRecord?.clock_in_device || 'Admin Manual Entry',
      clock_in_location_name: branch?.name || 'Head Office',
      is_outside_geofence: false,
      approval_status: 'APPROVED',
      notes: form.notes.trim(),
      clock_in_selfie_url: editingRecord?.clock_in_selfie_url,
    };

    dataService.saveAttendance(recordData);
    reloadRecords();
    setModalOpen(false);
    setEditingRecord(null);
  };

  const handleDelete = (id: string, _name?: string) => {
    dataService.deleteAttendance(id);
    reloadRecords();
  };

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
          {isSuperOrHr && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Presensi Manual</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs bg-transparent focus:outline-none font-mono"
            />
          </div>
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
                {isSuperOrHr && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isSuperOrHr ? 9 : 8} className="py-12 text-center text-slate-400">
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

                    {/* Selfie Snapshot (In & Out) */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {rec.clock_in_selfie_url ? (
                          <button
                            onClick={() =>
                              setPreviewSelfie({
                                url: rec.clock_in_selfie_url!,
                                label: 'Foto Masuk (Clock In)',
                                name: rec.employee_name,
                              })
                            }
                            className="relative group cursor-pointer"
                            title="Foto Masuk (Clock In)"
                          >
                            <img
                              src={rec.clock_in_selfie_url}
                              alt="In Selfie"
                              className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 object-cover hover:ring-2 hover:ring-blue-500 transition-all shadow-2xs"
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
                            onClick={() =>
                              setPreviewSelfie({
                                url: rec.clock_out_selfie_url!,
                                label: 'Foto Pulang (Clock Out)',
                                name: rec.employee_name,
                              })
                            }
                            className="relative group cursor-pointer"
                            title="Foto Pulang (Clock Out)"
                          >
                            <img
                              src={rec.clock_out_selfie_url}
                              alt="Out Selfie"
                              className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 object-cover hover:ring-2 hover:ring-rose-500 transition-all shadow-2xs"
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

                    {/* Actions (Admin CRUD) */}
                    {isSuperOrHr && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Presensi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id, rec.employee_name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Presensi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add / Edit Attendance Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingRecord ? 'Edit Catatan Presensi' : 'Catat Presensi Manual (Admin)'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Karyawan *</label>
                <select
                  required
                  disabled={!!editingRecord}
                  value={form.employee_id}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="" disabled>Pilih Karyawan</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_code}) - {emp.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Presensi *</label>
                  <input
                    type="date"
                    required
                    value={form.attendance_date}
                    onChange={(e) => setForm({ ...form, attendance_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pola Shift *</label>
                  <select
                    required
                    value={form.shift_id}
                    onChange={(e) => setForm({ ...form, shift_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="" disabled>Pilih Shift</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.start_time} - {s.end_time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Masuk (Clock In) *</label>
                  <input
                    type="time"
                    required
                    value={form.clock_in_time}
                    onChange={(e) => setForm({ ...form, clock_in_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Pulang (Clock Out)</label>
                  <input
                    type="time"
                    value={form.clock_out_time}
                    onChange={(e) => setForm({ ...form, clock_out_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Kehadiran *</label>
                  <select
                    value={form.clock_in_status}
                    onChange={(e) => setForm({ ...form, clock_in_status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="present">Tepat Waktu (Present)</option>
                    <option value="late">Terlambat (Late)</option>
                    <option value="early_checkout">Early Checkout</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Menit Terlambat</label>
                  <input
                    type="number"
                    min="0"
                    value={form.late_minutes}
                    onChange={(e) => setForm({ ...form, late_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lokasi / Cabang *</label>
                <select
                  required
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="" disabled>Pilih Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Alasan Input Manual</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Absen offline karena HP kehabisan baterai / verifikasi izin pimpinan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs"
                >
                  {editingRecord ? 'Simpan Perubahan' : 'Catat Presensi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selfie Preview Lightbox */}
      {previewSelfie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 relative shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>{previewSelfie.label}</span>
                </span>
                {previewSelfie.name && (
                  <span className="text-[11px] text-slate-500 font-semibold block">
                    Karyawan: {previewSelfie.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => setPreviewSelfie(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewSelfie.url}
              alt={previewSelfie.label}
              className="w-full rounded-xl object-cover aspect-4/3 border border-slate-200 shadow-xs"
            />
            <p className="text-[11px] text-slate-500 text-center font-mono">
              Foto verifikasi kamera anti-fraud presensi
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
