import React, { useState } from 'react';
import { Layers, Plus, Edit2, Trash2, Clock, Check, Coffee, AlertCircle, Sun, Moon } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Shift, ShiftType } from '../../types';

export const ShiftView: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>(dataService.getShifts());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [form, setForm] = useState({
    name: '',
    shift_type: 'Normal' as ShiftType,
    start_time: '08:00',
    end_time: '17:00',
    break_start: '12:00',
    break_end: '13:00',
    tolerance_minutes: 10,
    is_cross_day: false,
    is_active: true,
  });

  const refreshShifts = () => {
    setShifts(dataService.getShifts());
  };

  const handleOpenAdd = () => {
    setEditingShift(null);
    setForm({
      name: '',
      shift_type: 'Normal',
      start_time: '08:00',
      end_time: '17:00',
      break_start: '12:00',
      break_end: '13:00',
      tolerance_minutes: 10,
      is_cross_day: false,
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    setForm({
      name: shift.name,
      shift_type: shift.shift_type,
      start_time: shift.start_time,
      end_time: shift.end_time,
      break_start: shift.break_start || '12:00',
      break_end: shift.break_end || '13:00',
      tolerance_minutes: shift.tolerance_minutes,
      is_cross_day: shift.is_cross_day,
      is_active: shift.is_active,
    });
    setModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const shiftData: Shift = {
      id: editingShift ? editingShift.id : `shift-${Date.now()}`,
      company_id: 'comp-01',
      name: form.name.trim(),
      shift_type: form.shift_type,
      start_time: form.start_time,
      end_time: form.end_time,
      break_start: form.break_start,
      break_end: form.break_end,
      tolerance_minutes: Number(form.tolerance_minutes),
      is_cross_day: form.is_cross_day,
      is_active: form.is_active,
    };

    dataService.saveShift(shiftData);
    refreshShifts();
    setModalOpen(false);
  };

  const handleDeleteShift = (id: string, name: string) => {
    if (confirm(`Delete shift "${name}"?`)) {
      dataService.deleteShift(id);
      refreshShifts();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Shift Configurations & Late Tolerances</h2>
          <p className="text-xs text-slate-500">
            Configure working hours, break schedules, cross-day logic, and late grace periods
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Shift</span>
        </button>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{shift.name}</h3>
                    {shift.is_cross_day && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        Cross-Day
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Type: {shift.shift_type}</span>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    shift.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {shift.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>

              {/* Working Hours Display */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Work Hours</span>
                  <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                    {shift.start_time} — {shift.end_time}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Coffee className="w-3.5 h-3.5 text-slate-400" />
                    <span>Break Interval</span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {shift.break_start} - {shift.break_end}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Grace Tolerance</span>
                  <span className="text-amber-700 font-semibold font-mono">
                    +{shift.tolerance_minutes} minutes
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleOpenEdit(shift)}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                title="Edit Shift"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteShift(shift.id, shift.name)}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                title="Delete Shift"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Shift Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingShift ? 'Edit Shift Schedule' : 'Create New Shift'}
            </h3>

            <form onSubmit={handleSaveShift} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Normal Office Shift"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Category</label>
                  <select
                    value={form.shift_type}
                    onChange={(e) => setForm({ ...form, shift_type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                    <option value="CrossDay">CrossDay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Late Tolerance (Mins)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={form.tolerance_minutes}
                    onChange={(e) => setForm({ ...form, tolerance_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time (HH:mm)</label>
                  <input
                    type="time"
                    required
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Break Start</label>
                  <input
                    type="time"
                    value={form.break_start}
                    onChange={(e) => setForm({ ...form, break_start: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Break End</label>
                  <input
                    type="time"
                    value={form.break_end}
                    onChange={(e) => setForm({ ...form, break_end: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_cross_day}
                    onChange={(e) => setForm({ ...form, is_cross_day: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>Cross-day Shift (Overnight e.g. 22:00 - 06:00)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                >
                  Save Shift Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
