import React, { useState } from 'react';
import { Clock, Plus, Filter, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { PermissionRequest } from '../../types';
import { formatDate } from '../../utils/attendance';
import { PermissionModal } from './PermissionModal';

export const PermissionView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isManagerOrAdmin = role === 'MANAGER' || role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<'my' | 'approvals'>('my');
  const [modalOpen, setModalOpen] = useState(false);
  const [permissions, setPermissions] = useState<PermissionRequest[]>(
    dataService.getPermissionRequests()
  );

  // Approval modal state
  const [approvingReq, setApprovingReq] = useState<PermissionRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [approvalComment, setApprovalComment] = useState('');

  const refreshData = () => {
    setPermissions(dataService.getPermissionRequests());
  };

  if (!currentUser) return null;

  const myPermissions = permissions.filter((p) => p.employee_id === currentUser.id);

  const pendingApprovals = permissions.filter((p) => {
    if (role === 'SUPER_ADMIN' || role === 'HR_ADMIN') return true;
    return p.current_approver_id === currentUser.id;
  });

  const handleOpenApprovalModal = (req: PermissionRequest, action: 'APPROVED' | 'REJECTED') => {
    setApprovingReq(req);
    setApprovalAction(action);
    setApprovalComment(action === 'APPROVED' ? 'Disetujui oleh atasan.' : 'Belum dapat disetujui.');
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingReq) return;

    dataService.processPermissionApproval(
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
          <h2 className="text-base font-bold text-slate-900">Pengajuan Izin & Ketidakhadiran Singkat</h2>
          <p className="text-xs text-slate-500">
            Ajukan dan kelola izin sementara / keluar kantor untuk urusan medis, keluarga, atau keperluan mendesak
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Izin</span>
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
          Pengajuan Saya ({myPermissions.length})
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
            {pendingApprovals.filter((p) => p.status === 'PENDING').length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-mono">
                {pendingApprovals.filter((p) => p.status === 'PENDING').length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* TAB 1: My Submissions */}
      {activeTab === 'my' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Riwayat Pengajuan Izin Saya</h3>
            <span className="text-xs text-slate-500 font-mono">{myPermissions.length} total pengajuan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kategori Izin</th>
                  <th className="py-3 px-4">Rentang Waktu</th>
                  <th className="py-3 px-4">Alasan & Catatan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Catatan Penyetuju</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Belum ada pengajuan izin.
                    </td>
                  </tr>
                ) : (
                  myPermissions.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {formatDate(p.permission_date)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {p.permission_type === 'Personal'
                          ? 'Keperluan Pribadi'
                          : p.permission_type === 'Medical'
                          ? 'Medis / Rumah Sakit'
                          : p.permission_type === 'Family'
                          ? 'Urusan Keluarga'
                          : p.permission_type === 'Emergency'
                          ? 'Darurat'
                          : 'Lainnya'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {p.start_time} - {p.end_time}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[240px]">
                        <div>{p.reason}</div>
                        {p.notes && <div className="text-[10px] text-slate-400 italic mt-0.5">{p.notes}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            p.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {p.status === 'APPROVED' ? 'Disetujui' : p.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {p.approver_name ? (
                          <div>
                            <span className="font-semibold text-slate-900">{p.approver_name}:</span>{' '}
                            <span>{p.approver_comment || 'Disetujui'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Menunggu verifikasi atasan</span>
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
            <h3 className="text-sm font-bold text-slate-900">Kotak Masuk Persetujuan Izin Tim</h3>
            <span className="text-xs text-slate-500 font-mono">{pendingApprovals.length} total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Pemohon</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Jam</th>
                  <th className="py-3 px-4">Alasan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Tidak ada permohonan izin yang menunggu persetujuan.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.employee_name}</div>
                        <div className="text-[11px] text-slate-500">{p.department_name}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {formatDate(p.permission_date)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {p.permission_type === 'Personal'
                          ? 'Keperluan Pribadi'
                          : p.permission_type === 'Medical'
                          ? 'Medis / Rumah Sakit'
                          : p.permission_type === 'Family'
                          ? 'Urusan Keluarga'
                          : p.permission_type === 'Emergency'
                          ? 'Darurat'
                          : 'Lainnya'}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {p.start_time} - {p.end_time}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">{p.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            p.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {p.status === 'APPROVED' ? 'Disetujui' : p.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenApprovalModal(p, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleOpenApprovalModal(p, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Selesai ({p.approver_name || 'Sistem'})
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

      {/* Permission Modal */}
      <PermissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refreshData}
      />

      {/* Decision Modal */}
      {approvingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Konfirmasi {approvalAction === 'APPROVED' ? 'Persetujuan' : 'Penolakan'} Izin
            </h3>
            <p className="text-xs text-slate-600">
              Permohonan izin oleh <strong>{approvingReq.employee_name}</strong> untuk{' '}
              <strong>{formatDate(approvingReq.permission_date)}</strong> ({approvingReq.start_time} - {approvingReq.end_time}).
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
