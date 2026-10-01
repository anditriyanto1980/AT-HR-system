import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  DollarSign,
  CreditCard,
  Building,
  User,
  AlertCircle,
  FileText,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { ReimbursementCategory, ReimbursementClaim } from '../../types';

export const ReimbursementView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isApprover = role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'MANAGER';

  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReimbursementCategory>('TRANSPORT');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80'
  );

  // Approval / Disbursement Action Modal
  const [selectedClaim, setSelectedClaim] = useState<ReimbursementClaim | null>(null);
  const [approvalAction, setApprovalAction] = useState<'APPROVE' | 'REJECT' | 'DISBURSE' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [disburseRef, setDisburseRef] = useState('');

  const reloadClaims = () => {
    if (currentUser) {
      if (role === 'EMPLOYEE') {
        setClaims(dataService.getEmployeeReimbursements(currentUser.id));
      } else {
        setClaims(dataService.getReimbursements());
      }
    }
  };

  useEffect(() => {
    reloadClaims();
  }, [currentUser, role]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const filteredClaims = claims.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
    if (
      searchTerm &&
      !c.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !c.claim_number.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalAmount = claims.reduce((acc, curr) => acc + curr.amount, 0);
  const disbursedAmount = claims
    .filter((c) => c.status === 'DISBURSED')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const pendingCount = claims.filter((c) => c.status === 'PENDING').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || amount <= 0) return;

    dataService.createReimbursement({
      employee_id: currentUser.id,
      employee_code: currentUser.employee_code,
      employee_name: currentUser.full_name,
      department_name: currentUser.department_name || 'General Operations',
      branch_name: currentUser.branch_name || 'Jakarta Head Office',
      category,
      title,
      amount,
      date,
      description,
      receipt_url: receiptUrl,
    });

    setTitle('');
    setAmount(0);
    setDescription('');
    setShowSubmitModal(false);
    reloadClaims();
  };

  const handleExecuteAction = () => {
    if (!selectedClaim || !currentUser) return;

    if (approvalAction === 'APPROVE') {
      dataService.processReimbursementApproval(
        selectedClaim.id,
        'APPROVED',
        currentUser.full_name,
        actionNotes || 'Disetujui sesuai plafon biaya operasional.'
      );
    } else if (approvalAction === 'REJECT') {
      dataService.processReimbursementApproval(
        selectedClaim.id,
        'REJECTED',
        currentUser.full_name,
        actionNotes || 'Klaim tidak memenuhi syarat / nota tidak valid.'
      );
    } else if (approvalAction === 'DISBURSE') {
      const ref = disburseRef || `TRX-BCA-${Date.now().toString().slice(-6)}`;
      dataService.disburseReimbursement(selectedClaim.id, ref);
    }

    setSelectedClaim(null);
    setApprovalAction(null);
    setActionNotes('');
    setDisburseRef('');
    reloadClaims();
  };

  const getCategoryLabel = (cat: ReimbursementCategory) => {
    switch (cat) {
      case 'MEDICAL':
        return 'Rawat Jalan / Medis';
      case 'TRANSPORT':
        return 'Transport / BBM / Tol';
      case 'MEALS_ENTERTAINMENT':
        return 'Jamuan Klien / Meals';
      case 'OFFICE_SUPPLIES':
        return 'Perlengkapan Kantor';
      case 'BUSINESS_TRIP_SETTLEMENT':
        return 'Settlement SPPD';
      case 'TRAINING_CERTIFICATION':
        return 'Pelatihan & Sertifikasi';
      default:
        return 'Lainnya';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Reimbursement & Claim Expenses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Pengajuan klaim pengeluaran bisnis, verifikasi nota/kuitansi, dan pencairan dana reimbursement.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Ajukan Klaim Baru
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Pengajuan Klaim</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{formatIDR(totalAmount)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{claims.length} Klaim tercatat</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Dana Dicairkan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600">{formatIDR(disbursedAmount)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Telah ditransfer ke rekening</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Menunggu Verifikasi & Approval</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600">{pendingCount} Pengajuan</div>
          <div className="text-[11px] text-slate-400 mt-1">Perlu tindakan persetujuan</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(['ALL', 'PENDING', 'APPROVED', 'DISBURSED', 'REJECTED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#1D63FF] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL'
                  ? 'Semua'
                  : st === 'PENDING'
                  ? 'Menunggu'
                  : st === 'APPROVED'
                  ? 'Disetujui'
                  : st === 'DISBURSED'
                  ? 'Dicairkan'
                  : 'Ditolak'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="TRANSPORT">Transport & BBM</option>
              <option value="MEDICAL">Medis / Rawat Jalan</option>
              <option value="MEALS_ENTERTAINMENT">Jamuan Klien</option>
              <option value="BUSINESS_TRIP_SETTLEMENT">Settlement SPPD</option>
              <option value="OFFICE_SUPPLIES">Perlengkapan Kantor</option>
              <option value="TRAINING_CERTIFICATION">Pelatihan / Sertifikasi</option>
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari klaim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden w-40 sm:w-52"
              />
            </div>
          </div>
        </div>

        {/* Claims Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">No. Klaim & Tanggal</th>
                <th className="py-3.5 px-4">Karyawan</th>
                <th className="py-3.5 px-4">Kategori & Judul</th>
                <th className="py-3.5 px-4 text-right">Nominal (IDR)</th>
                <th className="py-3.5 px-4 text-center">Bukti Nota</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada data klaim reimbursement yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{claim.claim_number}</div>
                      <div className="text-[11px] text-slate-400">{claim.date}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{claim.employee_name}</div>
                      <div className="text-[11px] text-slate-400">{claim.department_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold mb-0.5">
                        {getCategoryLabel(claim.category)}
                      </span>
                      <div className="font-semibold text-slate-800 line-clamp-1">{claim.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{claim.description}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-sm">
                      {formatIDR(claim.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {claim.receipt_url ? (
                        <a
                          href={claim.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Lihat
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          claim.status === 'DISBURSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : claim.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : claim.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {claim.status === 'DISBURSED'
                          ? 'DICAIRKAN'
                          : claim.status === 'APPROVED'
                          ? 'DISETUJUI'
                          : claim.status === 'PENDING'
                          ? 'MENUNGGU'
                          : 'DITOLAK'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isApprover && claim.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedClaim(claim);
                              setApprovalAction('APPROVE');
                            }}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Setujui Klaim"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClaim(claim);
                              setApprovalAction('REJECT');
                            }}
                            className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                            title="Tolak Klaim"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : isApprover && claim.status === 'APPROVED' ? (
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setApprovalAction('DISBURSE');
                          }}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          Cairkan Dana
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setApprovalAction(null);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium"
                        >
                          Rincian
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

      {/* Submit Claim Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Form Pengajuan Reimbursement</h2>
            <p className="text-xs text-slate-500">
              Isi data pengeluaran dan lampirkan kuitansi atau nota resmi untuk diproses oleh Finance & Atasan.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul / Keperluan Klaim</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pembelian tiket kereta dinas Surabaya & taksi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Biaya</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ReimbursementCategory)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-medium"
                  >
                    <option value="TRANSPORT">Transport / BBM / Tol</option>
                    <option value="MEDICAL">Medis / Rawat Jalan</option>
                    <option value="MEALS_ENTERTAINMENT">Jamuan Klien / Meals</option>
                    <option value="BUSINESS_TRIP_SETTLEMENT">Settlement Perjalanan Dinas</option>
                    <option value="OFFICE_SUPPLIES">Perlengkapan Kantor</option>
                    <option value="TRAINING_CERTIFICATION">Pelatihan / Sertifikasi</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Biaya (IDR)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  placeholder="Nominal Rupiah"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {amount > 0 ? formatIDR(amount) : 'Masukkan nominal'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi & Keterangan Tambahan</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jelaskan tujuan pengeluaran bisnis secara ringkas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto Bukti Kuitansi / Struk</label>
                <input
                  type="url"
                  required
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval / Details Action Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {approvalAction === 'APPROVE'
                  ? 'Setujui Reimbursement'
                  : approvalAction === 'REJECT'
                  ? 'Tolak Reimbursement'
                  : approvalAction === 'DISBURSE'
                  ? 'Konfirmasi Pencairan Dana'
                  : 'Rincian Reimbursement'}
              </h2>
              <span className="font-mono text-xs font-semibold text-slate-500">
                {selectedClaim.claim_number}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Nama Pemohon:</span>
                <span className="font-semibold text-slate-900">{selectedClaim.employee_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Judul Pengeluaran:</span>
                <span className="font-semibold text-slate-900">{selectedClaim.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Kategori:</span>
                <span className="font-medium text-slate-800">{getCategoryLabel(selectedClaim.category)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Nominal:</span>
                <span className="font-bold text-slate-900 text-sm">{formatIDR(selectedClaim.amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Keterangan:</span>
                <span className="font-medium text-slate-700 text-right max-w-xs">{selectedClaim.description}</span>
              </div>

              {selectedClaim.receipt_url && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Bukti Kuitansi:</span>
                  <img
                    src={selectedClaim.receipt_url}
                    alt="Receipt"
                    className="w-full h-36 object-cover rounded-xl border border-slate-200"
                  />
                </div>
              )}

              {approvalAction && (
                <div className="pt-2 space-y-3">
                  {approvalAction === 'DISBURSE' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor Referensi Bank Transfer
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TRX-BCA-98129"
                        value={disburseRef}
                        onChange={(e) => setDisburseRef(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Catatan Persetujuan / Alasan Penolakan
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Tulis catatan persetujuan atau alasan..."
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
              {approvalAction && (
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs ${
                    approvalAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : approvalAction === 'REJECT'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {approvalAction === 'APPROVE'
                    ? 'Konfirmasi Setuju'
                    : approvalAction === 'REJECT'
                    ? 'Konfirmasi Tolak'
                    : 'Konfirmasi Pencairan'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
