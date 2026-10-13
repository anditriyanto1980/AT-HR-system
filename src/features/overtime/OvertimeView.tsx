import React, { useState } from 'react';
import { Clock, Plus, CheckCircle2, XCircle, AlertCircle, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { OvertimeRequest } from '../../types';
import { formatDate } from '../../utils/attendance';
import { OvertimeModal } from './OvertimeModal';

export const OvertimeView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isManagerOrAdmin = role === 'MANAGER' || role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<'my' | 'approvals'>('my');
  const [modalOpen, setModalOpen] = useState(false);
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>(
    dataService.getOvertimeRequests()
  );

  const [approvingReq, setApprovingReq] = useState<OvertimeRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [approvalComment, setApprovalComment] = useState('');

  const refreshData = () => {
    setOvertimeRequests(dataService.getOvertimeRequests());
  };

  if (!currentUser) return null;

  const myOvertime = overtimeRequests.filter((o) => o.employee_id === currentUser.id);

  const pendingApprovals = overtimeRequests.filter((o) => {
    if (role === 'SUPER_ADMIN' || role === 'HR_ADMIN') return true;
    return o.current_approver_id === currentUser.id;
  });

  const handleOpenApprovalModal = (req: OvertimeRequest, action: 'APPROVED' | 'REJECTED') => {
    setApprovingReq(req);
    setApprovalAction(action);
    setApprovalComment(action === 'APPROVED' ? 'Disetujui oleh atasan.' : 'Batas anggaran lembur telah tercapai.');
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingReq) return;

    dataService.processOvertimeApproval(
      approvingReq.id,
      approvalAction,
      currentUser,
      approvalComment.trim()
    );

    setApprovingReq(null);
    refreshData();
  };

  const totalMyOvertimeHours = myOvertime
    .filter((o) => o.status === 'APPROVED')
    .reduce((acc, curr) => acc + curr.duration_hours, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Pengajuan & Persetujuan Lembur (Overtime)</h2>
          <p className="text-xs text-slate-500">
            Ajukan jam kerja lembur untuk penyelesaian proyek, rilis mendesak, atau target tim
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Lembur</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-1 max-w-xs">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'my'
              ? 'bg-[#1D63FF] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Lembur Saya ({myOvertime.length})
        </button>

        {isManagerOrAdmin && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
              activeTab === 'approvals'
                ? 'bg-[#1D63FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Antrean Tim</span>
            {pendingApprovals.filter((o) => o.status === 'PENDING').length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-mono">
                {pendingApprovals.filter((o) => o.status === 'PENDING').length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Summary KPI for employee */}
      {activeTab === 'my' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Jam Lembur Disetujui</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              {totalMyOvertimeHours.toFixed(1)} jam
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Pengajuan Menunggu</span>
            <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
              {myOvertime.filter((o) => o.status === 'PENDING').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Pengajuan</span>
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {myOvertime.length}
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: My Overtime */}
      {activeTab === 'my' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Riwayat Pengajuan Lembur Saya</h3>
            <span className="text-xs text-slate-500 font-mono">{myOvertime.length} catatan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Proyek / Tugas</th>
                  <th className="py-3 px-4">Jam</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Target & Alasan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Catatan Penyetuju</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myOvertime.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Belum ada catatan lembur. Klik "Ajukan Lembur" di atas.
                    </td>
                  </tr>
                ) : (
                  myOvertime.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {formatDate(o.overtime_date)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{o.project_name}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {o.start_time} - {o.end_time}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        {o.duration_hours} jam
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[240px] truncate">{o.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            o.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : o.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {o.status === 'APPROVED' ? 'Disetujui' : o.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {o.approver_name ? (
                          <div>
                            <span className="font-semibold text-slate-900">{o.approver_name}:</span>{' '}
                            <span>{o.approver_comment || 'Disetujui'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Menunggu persetujuan atasan</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Approvals Queue */}
      {activeTab === 'approvals' && isManagerOrAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Antrean Tinjauan Lembur Tim</h3>
            <span className="text-xs text-slate-500 font-mono">{pendingApprovals.length} total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Pemohon</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Proyek</th>
                  <th className="py-3 px-4">Jam</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Alasan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tidak ada pengajuan lembur yang menunggu persetujuan.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{o.employee_name}</div>
                        <div className="text-[11px] text-slate-500">{o.department_name}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {formatDate(o.overtime_date)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{o.project_name}</td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {o.start_time} - {o.end_time}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        {o.duration_hours} jam
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">{o.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            o.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : o.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {o.status === 'APPROVED' ? 'Disetujui' : o.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {o.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenApprovalModal(o, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleOpenApprovalModal(o, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Selesai ({o.approver_name || 'Sistem'})
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
      )}

      {/* Overtime Modal */}
      <OvertimeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refreshData}
      />

      {/* Decision Modal */}
      {approvingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Konfirmasi {approvalAction === 'APPROVED' ? 'Persetujuan' : 'Penolakan'} Lembur
            </h3>
            <p className="text-xs text-slate-600">
              Pengajuan lembur oleh <strong>{approvingReq.employee_name}</strong> selama{' '}
              <strong>{approvingReq.duration_hours} jam</strong> untuk proyek <strong>{approvingReq.project_name}</strong>.
            </p>

            <form onSubmit={handleConfirmApproval} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Penyetuju *
                </label>
                <textarea
                  required
                  rows={3}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Tuliskan catatan persetujuan atau alasan penolakan..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApprovingReq(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer ${
                    approvalAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Konfirmasi {approvalAction === 'APPROVED' ? 'Setujui' : 'Tolak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
