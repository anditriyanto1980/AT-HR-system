import React, { useState } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  FileText,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { AttendanceCorrection, CorrectionType } from '../../types';
import { formatDate, formatTime } from '../../utils/attendance';

export const AttendanceCorrectionView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isManagerOrAdmin = role === 'MANAGER' || role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<'my' | 'approvals'>('my');
  const [modalOpen, setModalOpen] = useState(false);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>(
    dataService.getAttendanceCorrections()
  );

  // Modal Form State
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [correctionType, setCorrectionType] = useState<CorrectionType>('FORGOT_CLOCK_OUT');
  const [reqIn, setReqIn] = useState('08:00');
  const [reqOut, setReqOut] = useState('17:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Decision state
  const [approvingItem, setApprovingItem] = useState<AttendanceCorrection | null>(null);
  const [decisionAction, setDecisionAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [comment, setComment] = useState('');

  const refreshData = () => {
    setCorrections(dataService.getAttendanceCorrections());
  };

  if (!currentUser) return null;

  // Auto-fill existing attendance times if date changed
  const handleDateChange = (d: string) => {
    setTargetDate(d);
    const existing = dataService.getTodayAttendance(currentUser.id, d);
    if (existing) {
      if (existing.clock_in_time) {
        setReqIn(formatTime(existing.clock_in_time));
      }
      if (existing.clock_out_time) {
        setReqOut(formatTime(existing.clock_out_time));
      }
    }
  };

  const handleOpenAdd = () => {
    handleDateChange(new Date().toISOString().split('T')[0]);
    setCorrectionType('FORGOT_CLOCK_OUT');
    setReason('');
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Please provide the reason / justification for this attendance adjustment.');
      return;
    }

    const existingAtt = dataService.getTodayAttendance(currentUser.id, targetDate);

    const newReq: AttendanceCorrection = {
      id: `cor-${Date.now()}`,
      employee_id: currentUser.id,
      attendance_date: targetDate,
      correction_type: correctionType,
      original_clock_in: existingAtt?.clock_in_time,
      original_clock_out: existingAtt?.clock_out_time,
      requested_clock_in: reqIn,
      requested_clock_out: reqOut,
      reason: reason.trim(),
      status: 'PENDING',
      approver_id: currentUser.manager_id || 'emp-03',
      created_at: new Date().toISOString(),
    };

    dataService.saveAttendanceCorrection(newReq);
    refreshData();
    setModalOpen(false);
  };

  const handleOpenDecision = (item: AttendanceCorrection, action: 'APPROVED' | 'REJECTED') => {
    setApprovingItem(item);
    setDecisionAction(action);
    setComment(action === 'APPROVED' ? 'Approved based on team calendar check.' : 'Cannot verify hours.');
  };

  const handleConfirmDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingItem) return;

    dataService.processCorrectionApproval(
      approvingItem.id,
      decisionAction,
      currentUser,
      comment.trim()
    );

    setApprovingItem(null);
    refreshData();
  };

  const myCorrections = corrections.filter((c) => c.employee_id === currentUser.id);

  const pendingApprovals = corrections.filter((c) => {
    if (role === 'SUPER_ADMIN' || role === 'HR_ADMIN') return true;
    return c.approver_id === currentUser.id;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Attendance Adjustment & Correction</h2>
          <p className="text-xs text-slate-500">
            Request retrospective adjustments for missed clock-outs without altering raw terminal records
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Request Adjustment</span>
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
          My Requests ({myCorrections.length})
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
            <span>Team Review</span>
            {pendingApprovals.filter((c) => c.status === 'PENDING').length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-mono">
                {pendingApprovals.filter((c) => c.status === 'PENDING').length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* TAB 1: My Corrections */}
      {activeTab === 'my' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Your Attendance Correction History</h3>
            <span className="text-xs text-slate-500 font-mono">{myCorrections.length} logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Work Date</th>
                  <th className="py-3 px-4">Adjustment Reason</th>
                  <th className="py-3 px-4">Original Logs</th>
                  <th className="py-3 px-4">Requested Timings</th>
                  <th className="py-3 px-4">Explanation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Approver Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myCorrections.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No attendance corrections filed.
                    </td>
                  </tr>
                ) : (
                  myCorrections.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatDate(c.attendance_date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {c.correction_type.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500 text-[11px]">
                        In: {formatTime(c.original_clock_in)} · Out: {formatTime(c.original_clock_out)}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900">
                        {c.requested_clock_in} — {c.requested_clock_out}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                        {c.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            c.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {c.approver_name ? (
                          <div>
                            <span className="font-semibold text-slate-900">{c.approver_name}:</span>{' '}
                            <span>{c.approver_comment || 'Approved'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending supervisor review</span>
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
            <h3 className="text-sm font-bold text-slate-900">Subordinate Correction Review</h3>
            <span className="text-xs text-slate-500 font-mono">{pendingApprovals.length} total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Work Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Requested Shift Window</th>
                  <th className="py-3 px-4">Justification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No correction requests pending approval.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.employee_name}</div>
                        <div className="text-[11px] text-slate-500">{c.department_name}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {formatDate(c.attendance_date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {c.correction_type.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-900">
                        {c.requested_clock_in} — {c.requested_clock_out}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[220px] truncate">{c.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            c.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {c.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDecision(c, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenDecision(c, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            Decided ({c.approver_name || 'System'})
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Request Attendance Adjustment</h3>
            <p className="text-xs text-slate-500">
              Submit your correct work hours for manager approval
            </p>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Date *</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category *</label>
                  <select
                    value={correctionType}
                    onChange={(e) => setCorrectionType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="FORGOT_CLOCK_OUT">Forgot Clock Out</option>
                    <option value="FORGOT_CLOCK_IN">Forgot Clock In</option>
                    <option value="INCORRECT_TIME">Incorrect Time Log</option>
                    <option value="SYSTEM_GLITCH">Device / Network Glitch</option>
                    <option value="OTHER">Other Reason</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requested Clock In (HH:mm) *
                  </label>
                  <input
                    type="time"
                    required
                    value={reqIn}
                    onChange={(e) => setReqIn(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requested Clock Out (HH:mm) *
                  </label>
                  <input
                    type="time"
                    required
                    value={reqOut}
                    onChange={(e) => setReqOut(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason & Context *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Left office immediately for customer meeting and forgot to clock out at the terminal."
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
                  Submit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {approvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Adjustment {decisionAction === 'APPROVED' ? 'Approval' : 'Rejection'}
            </h3>
            <p className="text-xs text-slate-600">
              Adjustment for <strong>{approvingItem.employee_name}</strong> on{' '}
              <strong>{formatDate(approvingItem.attendance_date)}</strong> ({approvingItem.requested_clock_in} - {approvingItem.requested_clock_out}).
            </p>

            <form onSubmit={handleConfirmDecision} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks *</label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApprovingItem(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-xs ${
                    decisionAction === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {decisionAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
