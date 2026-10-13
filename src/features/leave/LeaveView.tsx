import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Layers,
  UserCheck,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LeaveRequest } from '../../types';
import { formatDate } from '../../utils/attendance';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LeaveModal } from './LeaveModal';
import { TeamAvailabilityCalendar } from '../../components/dashboard/TeamAvailabilityCalendar';

export const LeaveView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isManagerOrAdmin = role === 'MANAGER' || role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<'my-leave' | 'balances' | 'team-calendar' | 'approvals'>('my-leave');
  const [modalOpen, setModalOpen] = useState(false);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(dataService.getLeaveRequests());
  const [leaveBalances, setLeaveBalances] = useState(dataService.getLeaveBalances(currentUser?.id));

  // Approval modal state
  const [approvingReq, setApprovingReq] = useState<LeaveRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [approvalComment, setApprovalComment] = useState('');

  const refreshData = () => {
    setLeaveRequests(dataService.getLeaveRequests());
    if (currentUser) {
      setLeaveBalances(dataService.getLeaveBalances(currentUser.id));
    }
  };

  if (!currentUser) return null;

  // Requests submitted by current user
  const myRequests = leaveRequests.filter((r) => r.employee_id === currentUser.id);

  // Requests pending manager/admin review
  const pendingReviewRequests = leaveRequests.filter((r) => {
    if (role === 'SUPER_ADMIN' || role === 'HR_ADMIN') return true;
    return r.current_approver_id === currentUser.id;
  });

  const handleOpenApprovalModal = (req: LeaveRequest, action: 'APPROVED' | 'REJECTED') => {
    setApprovingReq(req);
    setApprovalAction(action);
    setApprovalComment(action === 'APPROVED' ? 'Disetujui oleh atasan.' : 'Mohon maaf, belum dapat disetujui karena jadwal tim yang berbenturan.');
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingReq) return;

    dataService.processLeaveApproval(
      approvingReq.id,
      approvalAction,
      currentUser,
      approvalComment.trim()
    );

    setApprovingReq(null);
    refreshData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Manajemen & Pengajuan Cuti</h2>
          <p className="text-xs text-slate-500">
            Ajukan permohonan cuti, pantau sisa kuota cuti tahunan, dan setujui permohonan tim
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Cuti</span>
        </button>
      </div>

      {/* Segmented Tab Bar */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-1 max-w-2xl">
        <button
          onClick={() => setActiveTab('my-leave')}
          className={`flex-1 min-w-[130px] py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'my-leave'
              ? 'bg-[#1D63FF] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pengajuan Saya ({myRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`flex-1 min-w-[120px] py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'balances'
              ? 'bg-[#1D63FF] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sisa Kuota Cuti
        </button>

        <button
          onClick={() => setActiveTab('team-calendar')}
          className={`flex-1 min-w-[170px] py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'team-calendar'
              ? 'bg-[#1D63FF] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Kalender Tim & Cuti</span>
        </button>

        {isManagerOrAdmin && (
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex-1 min-w-[140px] py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
              activeTab === 'approvals'
                ? 'bg-[#1D63FF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Persetujuan Tim</span>
            {pendingReviewRequests.filter((r) => r.status === 'PENDING').length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-mono">
                {pendingReviewRequests.filter((r) => r.status === 'PENDING').length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* TAB 1: My Requests */}
      {activeTab === 'my-leave' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Daftar Pengajuan Cuti Saya</h3>
            <span className="text-xs text-slate-500">{myRequests.length} total pengajuan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Jenis Cuti</th>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Alasan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Respon Penyetuju</th>
                  <th className="py-3 px-4">Diajukan Pada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Belum ada pengajuan cuti. Klik "Ajukan Cuti" di atas.
                    </td>
                  </tr>
                ) : (
                  myRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {req.leave_type_name || 'Cuti'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {formatDate(req.start_date)} - {formatDate(req.end_date)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        {req.total_days} hari
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                        {req.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {req.status === 'APPROVED' ? 'Disetujui' : req.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {req.approver_name ? (
                          <div>
                            <span className="font-semibold text-slate-900">{req.approver_name}:</span>{' '}
                            <span>{req.approver_comment || 'Disetujui'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Menunggu Persetujuan Atasan</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {formatDate(req.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Balances */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {leaveBalances.map((bal) => {
              const usedPct = Math.round((bal.used / bal.entitlement) * 100);
              return (
                <div
                  key={bal.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">{bal.leave_type_name}</h3>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      Tahun {bal.year}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                        Kuota
                      </span>
                      <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                        {bal.entitlement}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                        Terpakai
                      </span>
                      <span className="text-lg font-bold font-mono text-amber-700 tabular-nums">
                        {bal.used}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span className="text-[10px] font-semibold text-emerald-600 uppercase block">
                        Sisa
                      </span>
                      <span className="text-lg font-bold font-mono text-emerald-800 tabular-nums">
                        {bal.remaining}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>{usedPct}% terpakai</span>
                      <span>{bal.pending} menunggu</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${Math.min(100, usedPct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Kalender Tim & Cuti Bersama */}
      {activeTab === 'team-calendar' && (
        <TeamAvailabilityCalendar onNavigateTab={() => setModalOpen(true)} />
      )}

      {/* TAB 4: Team Approvals */}
      {activeTab === 'approvals' && isManagerOrAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Antrean Persetujuan Cuti Tim</h3>
              <p className="text-xs text-slate-500">
                Tinjau, setujui, atau tolak permohonan cuti dari anggota tim Anda
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono font-medium">
              {pendingReviewRequests.length} total pengajuan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Pemohon</th>
                  <th className="py-3 px-4">Jenis Cuti</th>
                  <th className="py-3 px-4">Tanggal Diajukan</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Alasan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingReviewRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada permohonan cuti anggota tim di kotak masuk persetujuan.
                    </td>
                  </tr>
                ) : (
                  pendingReviewRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{req.employee_name}</div>
                        <div className="text-[11px] text-slate-500">{req.department_name}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {req.leave_type_name}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {formatDate(req.start_date)} - {formatDate(req.end_date)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        {req.total_days} hari
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                        {req.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {req.status === 'APPROVED' ? 'Disetujui' : req.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenApprovalModal(req, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleOpenApprovalModal(req, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Selesai ({req.approver_name || 'Sistem'})
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

      {/* Leave Application Modal */}
      <LeaveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refreshData}
      />

      {/* Decision Comment Modal */}
      {approvingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Konfirmasi {approvalAction === 'APPROVED' ? 'Persetujuan' : 'Penolakan'} Cuti
            </h3>
            <p className="text-xs text-slate-600">
              Permohonan oleh <strong>{approvingReq.employee_name}</strong> selama{' '}
              <strong>{approvingReq.total_days} hari</strong> ({approvingReq.leave_type_name}).
            </p>

            <form onSubmit={handleConfirmApproval} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Alasan Penyetuju *
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
