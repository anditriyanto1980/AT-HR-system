import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Calendar,
  Layers,
  Briefcase,
  UserCheck,
  Search,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import {
  ApprovalLog,
  ApprovalStatus,
  AttendanceCorrection,
  BusinessTripRequest,
  LeaveRequest,
  OvertimeRequest,
  PermissionRequest,
  ReimbursementClaim,
} from '../../types';
import { formatDate } from '../../utils/attendance';

export const ApprovalsHubView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isSuperOrHr = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LEAVE' | 'PERMISSION' | 'OVERTIME' | 'CORRECTION' | 'BUSINESS_TRIP' | 'REIMBURSEMENT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'RESOLVED' | 'ALL'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected for decision
  const [decisionModal, setDecisionModal] = useState<{
    type: 'LEAVE' | 'PERMISSION' | 'OVERTIME' | 'CORRECTION' | 'BUSINESS_TRIP' | 'REIMBURSEMENT';
    item: any;
    action: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [comment, setComment] = useState('');

  // Selected for viewing history logs
  const [selectedLogs, setSelectedLogs] = useState<{ id: string; logs: ApprovalLog[]; title: string } | null>(null);

  const [leaveList, setLeaveList] = useState<LeaveRequest[]>(dataService.getLeaveRequests());
  const [permList, setPermList] = useState<PermissionRequest[]>(dataService.getPermissionRequests());
  const [otList, setOtList] = useState<OvertimeRequest[]>(dataService.getOvertimeRequests());
  const [corList, setCorList] = useState<AttendanceCorrection[]>(dataService.getAttendanceCorrections());
  const [tripList, setTripList] = useState<BusinessTripRequest[]>(dataService.getBusinessTrips());
  const [reimbList, setReimbList] = useState<ReimbursementClaim[]>(dataService.getReimbursements());

  const refreshData = () => {
    setLeaveList(dataService.getLeaveRequests());
    setPermList(dataService.getPermissionRequests());
    setOtList(dataService.getOvertimeRequests());
    setCorList(dataService.getAttendanceCorrections());
    setTripList(dataService.getBusinessTrips());
    setReimbList(dataService.getReimbursements());
  };

  if (!currentUser) return null;

  // Combine requests into a normalized queue item list
  interface UnifiedRequest {
    id: string;
    requestType: 'LEAVE' | 'PERMISSION' | 'OVERTIME' | 'CORRECTION' | 'BUSINESS_TRIP' | 'REIMBURSEMENT';
    employeeName: string;
    employeeCode?: string;
    departmentName?: string;
    summary: string;
    subDetails: string;
    reason: string;
    status: ApprovalStatus;
    createdAt: string;
    approverName?: string;
    approverComment?: string;
    rawItem: any;
  }

  const unifiedList: UnifiedRequest[] = [
    ...leaveList.map((l) => ({
      id: l.id,
      requestType: 'LEAVE' as const,
      employeeName: l.employee_name || 'Staff',
      employeeCode: l.employee_code,
      departmentName: l.department_name,
      summary: `${l.leave_type_name} (${l.total_days} days)`,
      subDetails: `${formatDate(l.start_date)} - ${formatDate(l.end_date)}`,
      reason: l.reason,
      status: l.status,
      createdAt: l.created_at,
      approverName: l.approver_name,
      approverComment: l.approver_comment,
      rawItem: l,
    })),
    ...permList.map((p) => ({
      id: p.id,
      requestType: 'PERMISSION' as const,
      employeeName: p.employee_name || 'Staff',
      employeeCode: p.employee_code,
      departmentName: p.department_name,
      summary: `Permission (${p.permission_type})`,
      subDetails: `${formatDate(p.permission_date)} (${p.start_time} - ${p.end_time})`,
      reason: p.reason,
      status: p.status,
      createdAt: p.created_at,
      approverName: p.approver_name,
      approverComment: p.approver_comment,
      rawItem: p,
    })),
    ...otList.map((o) => ({
      id: o.id,
      requestType: 'OVERTIME' as const,
      employeeName: o.employee_name || 'Staff',
      employeeCode: o.employee_code,
      departmentName: o.department_name,
      summary: `Overtime: ${o.duration_hours} hrs`,
      subDetails: `${formatDate(o.overtime_date)} · ${o.project_name}`,
      reason: o.reason,
      status: o.status,
      createdAt: o.created_at,
      approverName: o.approver_name,
      approverComment: o.approver_comment,
      rawItem: o,
    })),
    ...corList.map((c) => ({
      id: c.id,
      requestType: 'CORRECTION' as const,
      employeeName: c.employee_name || 'Staff',
      employeeCode: c.employee_code,
      departmentName: c.department_name,
      summary: `Correction: ${c.correction_type.replace(/_/g, ' ')}`,
      subDetails: `${formatDate(c.attendance_date)} (${c.requested_clock_in} - ${c.requested_clock_out})`,
      reason: c.reason,
      status: c.status,
      createdAt: c.created_at,
      approverName: c.approver_name,
      approverComment: c.approver_comment,
      rawItem: c,
    })),
    ...tripList.map((t) => ({
      id: t.id,
      requestType: 'BUSINESS_TRIP' as const,
      employeeName: t.employee_name || 'Staff',
      employeeCode: t.employee_code,
      departmentName: t.department_name,
      summary: `SPPD: ${t.destination_city} (${t.total_days} days)`,
      subDetails: `${formatDate(t.start_date)} - ${formatDate(t.end_date)} · ${t.transportation}`,
      reason: t.purpose,
      status: t.status,
      createdAt: t.created_at,
      approverName: t.approver_name,
      approverComment: t.approver_comment,
      rawItem: t,
    })),
    ...reimbList.map((r) => ({
      id: r.id,
      requestType: 'REIMBURSEMENT' as const,
      employeeName: r.employee_name || 'Staff',
      employeeCode: r.employee_code,
      departmentName: r.department_name,
      summary: `Klaim: Rp ${r.amount.toLocaleString('id-ID')}`,
      subDetails: `${r.claim_number} · ${r.category.replace(/_/g, ' ')}`,
      reason: r.title + ' - ' + r.description,
      status: r.status === 'DISBURSED' ? ('APPROVED' as ApprovalStatus) : (r.status as ApprovalStatus),
      createdAt: r.created_at,
      approverName: r.approver_name,
      approverComment: r.approver_notes,
      rawItem: r,
    })),
  ];

  // Filtering
  const filteredList = unifiedList.filter((item) => {
    // If not super/hr, only show subordinates
    if (!isSuperOrHr) {
      const approverId = item.rawItem.current_approver_id || item.rawItem.approver_id;
      if (approverId !== currentUser.id) return false;
    }

    if (typeFilter !== 'ALL' && item.requestType !== typeFilter) return false;

    if (statusFilter === 'PENDING' && item.status !== 'PENDING') return false;
    if (statusFilter === 'RESOLVED' && item.status === 'PENDING') return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = item.employeeName.toLowerCase().includes(q);
      const matchReason = item.reason.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      if (!matchName && !matchReason && !matchSummary) return false;
    }

    return true;
  });

  const handleOpenDecision = (item: UnifiedRequest, action: 'APPROVED' | 'REJECTED') => {
    setDecisionModal({
      type: item.requestType,
      item: item.rawItem,
      action,
    });
    setComment(action === 'APPROVED' ? 'Approved.' : 'Rejected.');
  };

  const handleConfirmDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModal) return;

    const { type, item, action } = decisionModal;

    if (type === 'LEAVE') {
      dataService.processLeaveApproval(item.id, action, currentUser, comment.trim());
    } else if (type === 'PERMISSION') {
      dataService.processPermissionApproval(item.id, action, currentUser, comment.trim());
    } else if (type === 'OVERTIME') {
      dataService.processOvertimeApproval(item.id, action, currentUser, comment.trim());
    } else if (type === 'CORRECTION') {
      dataService.processCorrectionApproval(item.id, action, currentUser, comment.trim());
    } else if (type === 'BUSINESS_TRIP') {
      dataService.processBusinessTripApproval(item.id, action, currentUser, comment.trim());
    } else if (type === 'REIMBURSEMENT') {
      dataService.processReimbursementApproval(item.id, action, currentUser.full_name, comment.trim());
    }

    setDecisionModal(null);
    refreshData();
  };

  const handleViewLogs = (item: UnifiedRequest) => {
    const logs = dataService.getApprovalLogs(item.id);
    setSelectedLogs({
      id: item.id,
      logs,
      title: `${item.requestType} · ${item.employeeName} (${item.summary})`,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Unified Approvals Hub</h2>
          <p className="text-xs text-slate-500">
            Manager & HR central inbox for leave, partial-day permission, and overtime workflows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-mono">
            {unifiedList.filter((i) => i.status === 'PENDING').length} Pending Review
          </span>
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
            placeholder="Search by staff name, reason..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
          >
            <option value="ALL">All Request Categories</option>
            <option value="LEAVE">Leave Requests Only</option>
            <option value="PERMISSION">Permission Requests Only</option>
            <option value="OVERTIME">Overtime Requests Only</option>
            <option value="CORRECTION">Attendance Corrections Only</option>
            <option value="BUSINESS_TRIP">Business Trips (SPPD) Only</option>
            <option value="REIMBURSEMENT">Reimbursement Claims Only</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
          >
            <option value="PENDING">Pending Action Only</option>
            <option value="RESOLVED">Resolved History (Approved / Rejected)</option>
            <option value="ALL">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Unified Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Request Scope</th>
                <th className="py-3 px-4">Timing Details</th>
                <th className="py-3 px-4">Reason & Justification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action / Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No requests pending review matching current filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={`${item.requestType}-${item.id}`} className="hover:bg-slate-50/70">
                    {/* Category */}
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.requestType === 'LEAVE'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : item.requestType === 'PERMISSION'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : item.requestType === 'OVERTIME'
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : item.requestType === 'BUSINESS_TRIP'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.requestType.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Applicant */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.employeeName}</div>
                      <div className="text-[11px] text-slate-500">{item.departmentName}</div>
                    </td>

                    {/* Scope */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.summary}
                    </td>

                    {/* Timing */}
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {item.subDetails}
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 text-slate-600 max-w-[220px] truncate">
                      {item.reason}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      {item.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDecision(item, 'APPROVED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenDecision(item, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleViewLogs(item)}
                          className="text-xs text-slate-600 hover:text-slate-900 font-semibold underline"
                        >
                          Audit Logs
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Confirm {decisionModal.action === 'APPROVED' ? 'Approval' : 'Rejection'}
            </h3>
            <p className="text-xs text-slate-600">
              Processing <strong>{decisionModal.type}</strong> request for{' '}
              <strong>{decisionModal.item.employee_name}</strong>.
            </p>

            <form onSubmit={handleConfirmDecision} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approver Remarks *
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter remarks..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDecisionModal(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-xs ${
                    decisionModal.action === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {decisionModal.action}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {selectedLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Approval Audit Trail</span>
              </h3>
              <button
                onClick={() => setSelectedLogs(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">{selectedLogs.title}</p>

            <div className="space-y-3 max-h-60 overflow-y-auto pt-1">
              {selectedLogs.logs.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No previous log entries found.</div>
              ) : (
                selectedLogs.logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{log.approver_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Transitioned from <span className="font-mono">{log.previous_status}</span> to{' '}
                      <span className="font-mono font-bold text-slate-900">{log.new_status}</span>
                    </div>
                    {log.comment && (
                      <div className="text-xs text-slate-700 italic bg-white p-2 rounded border border-slate-100 mt-1">
                        "{log.comment}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
