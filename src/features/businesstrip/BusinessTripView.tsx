import React, { useState } from 'react';
import {
  Plane,
  Plus,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase,
  Search,
  Train,
  Car,
  Bus,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { BusinessTripRequest, TransportationMode } from '../../types';
import { formatDate } from '../../utils/attendance';

export const BusinessTripView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isManagerOrAdmin = role === 'MANAGER' || role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<'my' | 'approvals'>('my');
  const [modalOpen, setModalOpen] = useState(false);
  const [trips, setTrips] = useState<BusinessTripRequest[]>(dataService.getBusinessTrips());

  // Form State
  const [destinationCity, setDestinationCity] = useState('');
  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [transportation, setTransportation] = useState<TransportationMode>('Flight');
  const [estimatedCost, setEstimatedCost] = useState<number>(3500000);
  const [cashAdvance, setCashAdvance] = useState<number>(1500000);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Decision Modal State
  const [approvingTrip, setApprovingTrip] = useState<BusinessTripRequest | null>(null);
  const [decisionAction, setDecisionAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [decisionComment, setDecisionComment] = useState('');

  const refreshData = () => {
    setTrips(dataService.getBusinessTrips());
  };

  if (!currentUser) return null;

  // Calculate days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.max(0, end.getTime() - start.getTime());
  const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const handleOpenAdd = () => {
    setDestinationCity('');
    setPurpose('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setTransportation('Flight');
    setEstimatedCost(3500000);
    setCashAdvance(1500000);
    setNotes('');
    setError(null);
    setModalOpen(true);
  };

  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationCity.trim()) {
      setError('Please provide destination city.');
      return;
    }
    if (!purpose.trim()) {
      setError('Please provide the purpose of the official trip.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be prior to start date.');
      return;
    }

    const newTrip: BusinessTripRequest = {
      id: `trip-${Date.now()}`,
      employee_id: currentUser.id,
      destination_city: destinationCity.trim(),
      purpose: purpose.trim(),
      start_date: startDate,
      end_date: endDate,
      total_days: calculatedDays,
      transportation,
      estimated_cost: Number(estimatedCost) || 0,
      cash_advance_requested: Number(cashAdvance) || 0,
      notes: notes.trim(),
      status: 'PENDING',
      current_approver_id: currentUser.manager_id || 'emp-01',
      created_at: new Date().toISOString(),
      employee_name: currentUser.full_name,
      employee_code: currentUser.employee_code,
      department_name: currentUser.department_name,
      branch_name: currentUser.branch_name,
    };

    dataService.saveBusinessTrip(newTrip);
    refreshData();
    setModalOpen(false);
  };

  const handleProcessDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingTrip) return;

    dataService.processBusinessTripApproval(
      approvingTrip.id,
      decisionAction,
      currentUser,
      decisionComment.trim() || (decisionAction === 'APPROVED' ? 'Approved' : 'Rejected')
    );

    setApprovingTrip(null);
    refreshData();
  };

  // Filter lists
  const myTrips = trips.filter((t) => t.employee_id === currentUser.id);
  const pendingApprovals = trips.filter((t) => {
    if (t.status !== 'PENDING') return false;
    if (role === 'SUPER_ADMIN' || role === 'HR_ADMIN') return true;
    return t.current_approver_id === currentUser.id;
  });

  const getTransportIcon = (mode: TransportationMode) => {
    switch (mode) {
      case 'Flight':
        return <Plane className="w-4 h-4 text-sky-600" />;
      case 'Train':
        return <Train className="w-4 h-4 text-emerald-600" />;
      case 'Car_Rental':
      case 'Company_Vehicle':
        return <Car className="w-4 h-4 text-amber-600" />;
      default:
        return <Bus className="w-4 h-4 text-purple-600" />;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-sky-50 text-sky-700">
              <Plane className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Business Trip Management (SPPD)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Official business travel requests, cash advances, itinerary approvals & attendance alignment
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D63FF] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Business Trip (SPPD)</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase">My Total Trips</div>
          <div className="text-2xl font-bold font-mono text-slate-900">{myTrips.length}</div>
          <div className="text-[11px] text-slate-500">recorded journeys</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase">Approved Trips</div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {myTrips.filter((t) => t.status === 'APPROVED').length}
          </div>
          <div className="text-[11px] text-emerald-600">attendance marked</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase">Pending Approvals</div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {isManagerOrAdmin ? pendingApprovals.length : myTrips.filter((t) => t.status === 'PENDING').length}
          </div>
          <div className="text-[11px] text-amber-700">
            {isManagerOrAdmin ? 'awaiting your decision' : 'in review'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Advance Disbursed</div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatCurrency(
              myTrips
                .filter((t) => t.status === 'APPROVED')
                .reduce((acc, curr) => acc + curr.cash_advance_requested, 0)
            )}
          </div>
          <div className="text-[11px] text-slate-500">operational allowance</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      {isManagerOrAdmin && (
        <div className="flex border-b border-slate-200 space-x-6">
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'my'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            My Business Trips ({myTrips.length})
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Team Approvals Queue</span>
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'my' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Your Business Trips (SPPD)</h3>
            <span className="text-xs text-slate-500">Real-time sync with corporate travel policy</span>
          </div>

          {myTrips.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Plane className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm">You haven't submitted any business trips yet.</p>
              <button
                onClick={handleOpenAdd}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
              >
                Submit New SPPD
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myTrips.map((trip) => (
                <div key={trip.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                          {trip.destination_city}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                          {getTransportIcon(trip.transportation)}
                          <span>{trip.transportation.replace(/_/g, ' ')}</span>
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            trip.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : trip.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {trip.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{trip.purpose}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)} ({trip.total_days} days)
                        </span>
                        <span className="font-mono">
                          Est. Budget: <strong>{formatCurrency(trip.estimated_cost)}</strong>
                        </span>
                        <span className="font-mono text-emerald-700">
                          Cash Advance: <strong>{formatCurrency(trip.cash_advance_requested)}</strong>
                        </span>
                      </div>

                      {trip.approver_name && (
                        <div className="text-[11px] text-slate-500 pt-1 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          Decision by {trip.approver_name}: &quot;{trip.approver_comment || 'No comment'}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Team Approvals Tab */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pending Business Trip Approvals</h3>
              <p className="text-xs text-slate-500">
                Approving this request will automatically record attendance days as &quot;Business Trip&quot;
              </p>
            </div>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-xs">No pending business trip requests for your approval.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingApprovals.map((trip) => (
                <div key={trip.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{trip.employee_name}</span>
                        <span className="text-xs text-slate-500">
                          ({trip.employee_code} · {trip.department_name})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <span className="font-semibold text-xs text-slate-800">
                          {trip.destination_city}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-600 font-mono">
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)} ({trip.total_days} days)
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                        {trip.purpose}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                        <span>Transport: {trip.transportation}</span>
                        <span>Budget: {formatCurrency(trip.estimated_cost)}</span>
                        <span className="text-emerald-700 font-bold">
                          Cash Advance: {formatCurrency(trip.cash_advance_requested)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setApprovingTrip(trip);
                          setDecisionAction('APPROVED');
                          setDecisionComment('Approved for official business duty.');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve SPPD</span>
                      </button>
                      <button
                        onClick={() => {
                          setApprovingTrip(trip);
                          setDecisionAction('REJECTED');
                          setDecisionComment('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Trip Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Submit Official Business Trip (SPPD)
                </h3>
                <p className="text-xs text-slate-500">
                  Surat Perintah Perjalanan Dinas with automated attendance & allowance tracking
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTrip} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Destination City / Area *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surabaya, Jawa Timur or Singapore"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Official Purpose & Agenda *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe client meetings, technical deployment, or audit objectives..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between font-mono">
                <span className="text-slate-500">Calculated Trip Duration:</span>
                <span className="font-bold text-slate-900">{calculatedDays} Calendar Days</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Transportation</label>
                  <select
                    value={transportation}
                    onChange={(e) => setTransportation(e.target.value as TransportationMode)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
                  >
                    <option value="Flight">Commercial Flight</option>
                    <option value="Train">Kereta Api (Train)</option>
                    <option value="Car_Rental">Car Rental / Taxi</option>
                    <option value="Company_Vehicle">Company Vehicle</option>
                    <option value="Public_Transit">Public Transit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Estimated Budget (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Cash Advance (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={cashAdvance}
                    onChange={(e) => setCashAdvance(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Notes / Hotel & Flight Details</label>
                <input
                  type="text"
                  placeholder="e.g. Hotel Santika Premiere, Garuda GA-310"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Submit SPPD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {approvingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Confirm SPPD {decisionAction}
              </h3>
              <p className="text-xs text-slate-500">
                {approvingTrip.employee_name} &bull; {approvingTrip.destination_city} ({approvingTrip.total_days} days)
              </p>
            </div>

            <form onSubmit={handleProcessDecision} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Approver Notes / Instructions</label>
                <textarea
                  rows={3}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder="Enter comments or reimbursement instructions..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingTrip(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-xs ${
                    decisionAction === 'APPROVED'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
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
