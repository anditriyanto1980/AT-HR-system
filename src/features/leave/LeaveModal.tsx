import React, { useState } from 'react';
import { X, Calendar, FileText, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { LeaveRequest, LeaveType } from '../../types';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({ isOpen, onClose, onSaved }) => {
  const { currentUser } = useAuth();
  const leaveTypes = dataService.getLeaveTypes();
  const myBalances = dataService.getLeaveBalances(currentUser?.id);

  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  // Selected balance
  const activeBalance = myBalances.find((b) => b.leave_type_id === leaveTypeId);

  // Compute business days
  const computeDays = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) return 0;
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const totalDays = computeDays();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (totalDays <= 0) {
      setError('End date must be greater than or equal to start date.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a specific reason for your leave request.');
      return;
    }

    // Check if annual leave exceeds remaining balance
    if (activeBalance && activeBalance.leave_type_name === 'Annual Leave' && totalDays > activeBalance.remaining) {
      setError(`Requested ${totalDays} days exceeds your remaining annual leave balance (${activeBalance.remaining} days available).`);
      return;
    }

    const newReq: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employee_id: currentUser.id,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      reason: reason.trim(),
      status: 'PENDING',
      current_approver_id: currentUser.manager_id || 'emp-03', // default to Engineering Manager if no manager
      created_at: new Date().toISOString(),
    };

    dataService.saveLeaveRequest(newReq);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Submit Leave Request</h2>
            <p className="text-xs text-slate-500">Apply for annual, sick, or special leave</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Category *</label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-800"
            >
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.default_days} days default)
                </option>
              ))}
            </select>
            {activeBalance && (
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                Your Balance: {activeBalance.remaining} remaining of {activeBalance.entitlement} entitlement
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Days summary pill */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 font-sans">Total Requested Duration:</span>
            <span className="font-bold text-slate-900 tabular-nums">{totalDays} Workday(s)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Taking annual leave for family travel to Bali"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
