import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  Eye,
  Building,
  User,
  CreditCard,
  Send,
  Plus,
  RefreshCw,
  Search,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { PayrollBatch, PayrollItem, PayrollStatus } from '../../types';
import { PayslipModal } from './PayslipModal';

export const PayrollView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isSuperOrHr = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedSlip, setSelectedSlip] = useState<PayrollItem | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'BATCHES' | 'SALARY_PROFILES'>('ITEMS');

  // Generation Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genMonth, setGenMonth] = useState<number>(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState<number>(new Date().getFullYear());
  const [genNotes, setGenNotes] = useState('');

  const departments = dataService.getDepartments();

  const reloadData = () => {
    const loadedBatches = dataService.getPayrollBatches();
    setBatches(loadedBatches);
    if (loadedBatches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(loadedBatches[0].id);
    }
    const loadedItems = dataService.getPayrollItems();
    setItems(loadedItems);
  };

  useEffect(() => {
    reloadData();
  }, []);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // If user is EMPLOYEE, restrict view to only their items
  const isEmployeeOnly = role === 'EMPLOYEE';
  const displayedItems = items.filter((item) => {
    if (isEmployeeOnly && currentUser) {
      return item.employee_id === currentUser.id;
    }
    if (selectedBatchId && item.payroll_batch_id !== selectedBatchId) {
      return false;
    }
    if (selectedDept !== 'all' && item.department_name !== selectedDept) {
      return false;
    }
    if (
      searchTerm &&
      !item.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const currentBatch = batches.find((b) => b.id === selectedBatchId) || batches[0];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch = dataService.generatePayrollBatch(genMonth, genYear, genNotes);
    reloadData();
    setSelectedBatchId(newBatch.id);
    setShowGenerateModal(false);
    setActiveTab('ITEMS');
  };

  const handleUpdateStatus = (batchId: string, newStatus: PayrollStatus) => {
    dataService.updatePayrollBatchStatus(batchId, newStatus);
    reloadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {isEmployeeOnly ? 'My Payroll & Payslips (Slip Gaji)' : 'Enterprise Payroll & Payslip Operations'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {isEmployeeOnly
              ? 'Akses dan unduh arsip slip gaji resmi ber-barcode Anda setiap periode.'
              : 'Perhitungan gaji otomatis, tunjangan, potongan BPJS & PPh 21 TER, serta slip gaji elektronik.'}
          </p>
        </div>

        {isSuperOrHr && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Generate Payroll Baru
            </button>
          </div>
        )}
      </div>

      {/* KPI Highlight Cards (Summary) */}
      {!isEmployeeOnly && currentBatch && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
              <span>Total Gaji Bruto (Gross)</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">
              {formatIDR(currentBatch.total_gross)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Periode {currentBatch.period_label}</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
              <span>Total Potongan & Pajak</span>
              <Receipt className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold text-rose-700 tracking-tight">
              -{formatIDR(currentBatch.total_deductions)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">BPJS Kes, TK & PPh 21 TER</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
              <span>Total Take Home Pay (Net)</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight text-emerald-600">
              {formatIDR(currentBatch.total_net_payroll)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Dana Ditransfer ke Karyawan</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
              <span>Status Payroll Batch</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  currentBatch.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentBatch.status === 'APPROVED'
                    ? 'bg-blue-100 text-blue-800'
                    : currentBatch.status === 'VERIFIED'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentBatch.status === 'PAID'
                  ? 'LUNAS / DITRANSFER'
                  : currentBatch.status === 'APPROVED'
                  ? 'DISETUJUI FINANCE'
                  : currentBatch.status === 'VERIFIED'
                  ? 'TERVERIFIKASI HR'
                  : 'DRAFT CALCULATION'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {currentBatch.total_employees} Karyawan Diproses
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ITEMS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ITEMS'
                  ? 'bg-[#1D63FF] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isEmployeeOnly ? 'Daftar Slip Gaji Saya' : 'Daftar Slip Gaji Karyawan'}
            </button>
            {isSuperOrHr && (
              <button
                onClick={() => setActiveTab('BATCHES')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'BATCHES'
                    ? 'bg-[#1D63FF] text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Batch Payroll ({batches.length})
              </button>
            )}
          </div>

          {/* Batch Selector & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isEmployeeOnly && activeTab === 'ITEMS' && (
              <>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      Periode {b.period_label} ({b.status})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="all">Semua Departemen</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari karyawan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 w-44"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tab 1: Payslip Items Table */}
        {activeTab === 'ITEMS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Karyawan</th>
                  <th className="py-3.5 px-4">Departemen & Jabatan</th>
                  <th className="py-3.5 px-4 text-center">Kehadiran</th>
                  <th className="py-3.5 px-4 text-right">Gaji Pokok</th>
                  <th className="py-3.5 px-4 text-right">Lembur</th>
                  <th className="py-3.5 px-4 text-right">Potongan</th>
                  <th className="py-3.5 px-4 text-right">Take Home Pay</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Tidak ada data slip gaji yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  displayedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.employee_name}</div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {item.employee_code}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 font-medium">{item.position_name}</div>
                        <div className="text-[11px] text-slate-400">{item.department_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-slate-800">
                          {item.present_days}/{item.work_days}
                        </span>
                        {item.late_minutes > 0 && (
                          <span className="text-[10px] text-amber-600 block">
                            {item.late_minutes}m late
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                        {formatIDR(item.base_salary)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.overtime_pay > 0 ? (
                          <span className="text-emerald-700 font-semibold">
                            +{formatIDR(item.overtime_pay)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-600 font-semibold">
                        -{formatIDR(item.total_deductions)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm text-emerald-600">
                        {formatIDR(item.take_home_pay)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : item.status === 'VERIFIED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedSlip(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Slip Gaji
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Batches Management */}
        {activeTab === 'BATCHES' && isSuperOrHr && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Periode</th>
                  <th className="py-3.5 px-4">Tanggal Cut-off & Bayar</th>
                  <th className="py-3.5 px-4 text-center">Karyawan</th>
                  <th className="py-3.5 px-4 text-right">Total Net Payroll</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{b.period_label}</div>
                      <div className="text-[11px] text-slate-400">{b.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>Cut-off: {b.cut_off_start} s/d {b.cut_off_end}</div>
                      <div className="text-[11px] text-slate-400">Bayar: {b.payment_date}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                      {b.total_employees} Orang
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 text-sm">
                      {formatIDR(b.total_net_payroll)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          b.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'VERIFIED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status === 'PAID'
                          ? 'LUNAS'
                          : b.status === 'APPROVED'
                          ? 'APPROVED FINANCE'
                          : b.status === 'VERIFIED'
                          ? 'VERIFIED HR'
                          : 'DRAFT'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {b.status === 'DRAFT' && (
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'VERIFIED')}
                            className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[11px] font-semibold hover:bg-purple-700"
                          >
                            Verifikasi HR
                          </button>
                        )}
                        {b.status === 'VERIFIED' && (
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'APPROVED')}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-700"
                          >
                            Approve Finance
                          </button>
                        )}
                        {b.status === 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'PAID')}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700"
                          >
                            Disburse / Lunas
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedBatchId(b.id);
                            setActiveTab('ITEMS');
                          }}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[11px] font-semibold"
                        >
                          Lihat Rincian
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Generate Batch Payroll Baru</h2>
            <p className="text-xs text-slate-500">
              Sistem akan menghitung otomatis presensi real-time, lembur yang disetujui, potongan keterlambatan, BPJS Ketenagakerjaan & Kesehatan, serta estimasi PPh 21 TER.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bulan</label>
                  <select
                    value={genMonth}
                    onChange={(e) => setGenMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50"
                  >
                    {[
                      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
                    ].map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun</label>
                  <input
                    type="number"
                    value={genYear}
                    onChange={(e) => setGenYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Batch</label>
                <textarea
                  rows={2}
                  value={genNotes}
                  onChange={(e) => setGenNotes(e.target.value)}
                  placeholder="e.g. Payroll rutin bulanan cabang Jakarta & operational."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  Hitung & Simpan Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Payslip View / Print Modal */}
      {selectedSlip && (
        <PayslipModal item={selectedSlip} onClose={() => setSelectedSlip(null)} />
      )}
    </div>
  );
};
