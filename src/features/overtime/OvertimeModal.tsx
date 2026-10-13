import React, { useState } from 'react';
import { X, Clock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { OvertimeRequest } from '../../types';

interface OvertimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const OvertimeModal: React.FC<OvertimeModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { currentUser } = useAuth();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('20:30');
  const [projectName, setProjectName] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  // Calculate duration in hours
  const calculateDuration = (): number => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const totalMinutes = endH * 60 + endM - (startH * 60 + startM);
    if (totalMinutes <= 0) return 0;
    return parseFloat((totalMinutes / 60).toFixed(2));
  };

  const durationHours = calculateDuration();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (durationHours <= 0) {
      setError('Jam selesai harus lebih akhir dari jam mulai.');
      return;
    }

    if (!projectName.trim()) {
      setError('Nama proyek atau tugas wajib diisi.');
      return;
    }

    if (!reason.trim()) {
      setError('Harap jelaskan alasan dan target capaian lembur.');
      return;
    }

    const newReq: OvertimeRequest = {
      id: `ot-${Date.now()}`,
      employee_id: currentUser.id,
      overtime_date: date,
      start_time: startTime,
      end_time: endTime,
      duration_hours: durationHours,
      project_name: projectName.trim(),
      reason: reason.trim(),
      status: 'PENDING',
      current_approver_id: currentUser.manager_id || 'emp-03',
      created_at: new Date().toISOString(),
    };

    dataService.saveOvertimeRequest(newReq);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Formulir Pengajuan Lembur</h2>
            <p className="text-xs text-slate-500">Catat pekerjaan tambahan di luar jam kerja untuk proyek</p>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lembur *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Proyek / Tugas *</label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Contoh: Rilis Sistem Inti v2.4"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
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

          {/* Computed Duration Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 font-sans">Total Durasi Lembur:</span>
            <span className="font-bold text-slate-900 tabular-nums">{durationHours} Jam</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target & Alasan Lembur *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Menyelesaikan deployment perbaikan darurat dan verifikasi keamanan sebelum rilis produksi"
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
              <span>Kirim Pengajuan Lembur</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
