import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Edit2, Info, Star, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { Holiday, HolidayType } from '../../types';
import { formatDate } from '../../utils/attendance';

export const HolidayView: React.FC = () => {
  const { role } = useAuth();
  const isSuperOrHr = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const [holidays, setHolidays] = useState<Holiday[]>(dataService.getHolidays());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  const [form, setForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    holiday_type: 'National' as HolidayType,
    description: '',
  });

  const refreshHolidays = () => {
    setHolidays(dataService.getHolidays());
  };

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setForm({
      name: '',
      date: new Date().toISOString().split('T')[0],
      holiday_type: 'National',
      description: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (h: Holiday) => {
    setEditingHoliday(h);
    setForm({
      name: h.name,
      date: h.date,
      holiday_type: h.holiday_type,
      description: h.description || '',
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const holidayData: Holiday = {
      id: editingHoliday ? editingHoliday.id : `hol-${Date.now()}`,
      company_id: 'comp-01',
      name: form.name.trim(),
      date: form.date,
      holiday_type: form.holiday_type,
      description: form.description.trim(),
    };

    dataService.saveHoliday(holidayData);
    refreshHolidays();
    setModalOpen(false);
  };

  const handleDelete = (id: string, _name?: string) => {
    dataService.deleteHoliday(id);
    refreshHolidays();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Corporate & Public Holiday Calendar</h2>
          <p className="text-xs text-slate-500">
            Official holidays, collective leaves, and company celebrations affecting attendance rosters
          </p>
        </div>

        {isSuperOrHr && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday</span>
          </button>
        )}
      </div>

      {/* Policy Callout */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold">System Rule for Holidays & Collective Leave:</span>
          <p className="text-blue-800">
            Any absence falling on a registered Public Holiday or Collective Leave date is
            automatically waived and will NOT be counted as an absent workday or deduction.
          </p>
        </div>
      </div>

      {/* Holidays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {holidays.map((h) => {
          const isNational = h.holiday_type === 'National';
          const isCollective = h.holiday_type === 'Collective_Leave';

          return (
            <div
              key={h.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      isNational
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isCollective
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {h.holiday_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {formatDate(h.date)}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{h.name}</h3>
                <p className="text-xs text-slate-500">{h.description || 'Official holiday'}</p>
              </div>

              {isSuperOrHr && (
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(h)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Edit Holiday"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(h.id, h.name)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingHoliday ? 'Edit Holiday' : 'Add Official Holiday'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Holiday Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Idul Fitri 1447 H"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.holiday_type}
                    onChange={(e) => setForm({ ...form, holiday_type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="National">National Holiday</option>
                    <option value="Collective_Leave">Collective Leave</option>
                    <option value="Company">Company Holiday</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Public government holiday"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
