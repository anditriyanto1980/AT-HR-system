import React, { useState } from 'react';
import { X, Clock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { PermissionRequest, PermissionType } from '../../types';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { currentUser } = useAuth();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('15:00');
  const [permissionType, setPermissionType] = useState<PermissionType>('Personal');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Harap berikan alasan yang jelas.');
      return;
    }

    if (startTime >= endTime) {
      setError('Jam selesai harus lebih akhir dari jam mulai.');
      return;
    }

    const newReq: PermissionRequest = {
      id: `pr-${Date.now()}`,
      employee_id: currentUser.id,
      permission_date: date,
      start_time: startTime,
      end_time: endTime,
      permission_type: permissionType,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      status: 'PENDING',
      current_approver_id: currentUser.manager_id || 'emp-03',
      created_at: new Date().toISOString(),
    };

    dataService.savePermissionRequest(newReq);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Formulir Pengajuan Izin</h2>
            <p className="text-xs text-slate-500">Ajukan izin keluar sementara atau ketidakhadiran singkat</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Izin *</label>
              <select
                value={permissionType}
                onChange={(e) => setPermissionType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium"
              >
                <option value="Personal">Keperluan Pribadi</option>
                <option value="Medical">Medis (Klinik / Rumah Sakit)</option>
                <option value="Family">Urusan Keluarga</option>
                <option value="Emergency">Keadaan Darurat</option>
                <option value="Other">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai (JJ:mm) *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Selesai (JJ:mm) *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Izin *</label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Menghadiri rapat orang tua murid di sekolah"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan / Tindak Lanjut</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pekerjaan akan diselesaikan pada malam hari"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Kirim Pengajuan Izin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
