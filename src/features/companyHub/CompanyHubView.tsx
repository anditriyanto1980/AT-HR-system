import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Pin,
  FileText,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Plus,
  Send,
  Eye,
  ShieldAlert,
  CheckCircle2,
  FileCheck,
  Building,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { CompanyAnnouncement, EmployeeContractTracker } from '../../types';

export const CompanyHubView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isSuperOrHr = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<'ANNOUNCEMENTS' | 'CONTRACTS'>('ANNOUNCEMENTS');
  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>([]);
  const [contracts, setContracts] = useState<EmployeeContractTracker[]>([]);

  // Post modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<
    'CIRCULAR_LETTER' | 'HR_MEMO' | 'HOLIDAY_NOTICE' | 'EVENT' | 'POLICY'
  >('HR_MEMO');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [content, setContent] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const reloadData = () => {
    setAnnouncements(dataService.getAnnouncements());
    setContracts(dataService.getContractTrackers());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title || !content) return;

    dataService.createAnnouncement({
      title,
      category,
      priority,
      content,
      published_date: new Date().toISOString().split('T')[0],
      author_name: currentUser.full_name,
      target_audience: 'ALL',
      attachment_name: attachmentName || undefined,
      pinned: isPinned,
    });

    setTitle('');
    setContent('');
    setAttachmentName('');
    setIsPinned(false);
    setShowPostModal(false);
    reloadData();
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const expiringContractsCount = contracts.filter((c) => c.status === 'EXPIRING_SOON').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Company Hub & Corporate Announcements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Papan pengumuman resmi perusahaan, surat edaran, serta monitoring masa berlaku kontrak kerja PKWT.
          </p>
        </div>

        {isSuperOrHr && activeTab === 'ANNOUNCEMENTS' && (
          <button
            onClick={() => setShowPostModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Siarkan Pengumuman Baru
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab('ANNOUNCEMENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ANNOUNCEMENTS'
              ? 'bg-[#1D63FF] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Papan Pengumuman ({announcements.length})
        </button>
        {isSuperOrHr && (
          <button
            onClick={() => setActiveTab('CONTRACTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'CONTRACTS'
                ? 'bg-[#1D63FF] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Monitor Kontrak PKWT & Magang</span>
            {expiringContractsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                {expiringContractsCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* TAB 1: ANNOUNCEMENTS BOARD */}
      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`p-6 rounded-2xl border transition-all ${
                item.pinned
                  ? 'bg-white border-blue-200 shadow-md ring-2 ring-blue-500/10'
                  : 'bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.pinned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                        <Pin className="w-3 h-3 text-blue-600" />
                        PINNED NOTICE
                      </span>
                    )}
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getPriorityBadge(
                        item.priority
                      )}`}
                    >
                      {item.priority} PRIORITY
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {item.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight pt-1">
                    {item.title}
                  </h3>
                </div>

                <div className="text-left sm:text-right shrink-0 text-xs text-slate-400">
                  <div className="flex items-center gap-1 sm:justify-end">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.published_date}</span>
                  </div>
                  <div className="text-[11px] mt-0.5">Oleh: {item.author_name}</div>
                </div>
              </div>

              {/* Content Body */}
              <div className="py-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {item.content}
              </div>

              {/* Attachment Preview (if any) */}
              {item.attachment_name && (
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
                    <FileText className="w-4 h-4 text-red-500" />
                    <span>{item.attachment_name}</span>
                    <Download className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CONTRACT & PKWT EXPIRY TRACKER */}
      {activeTab === 'CONTRACTS' && (
        <div className="space-y-4">
          {/* Warning Banner */}
          {expiringContractsCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">Peringatan Jatuh Tempo:</span> Ada{' '}
                <span className="font-bold underline">{expiringContractsCount} karyawan</span> yang kontrak PKWT atau magangnya akan berakhir dalam 45 hari ke depan. Harap segera lakukan evaluasi perpanjangan atau konversi status.
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Kontrak Kerja & Masa Berlaku
              </span>
              <span className="text-xs text-slate-400">Total {contracts.length} Kontrak Termonitor</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Karyawan</th>
                    <th className="py-3.5 px-4">Departemen</th>
                    <th className="py-3.5 px-4">Tipe Kontrak</th>
                    <th className="py-3.5 px-4">Periode Kontrak</th>
                    <th className="py-3.5 px-4 text-center">Sisa Hari</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Rekomendasi Tindakan HR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contracts.map((c) => (
                    <tr key={c.employee_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{c.employee_name}</div>
                        <div className="font-mono text-[11px] text-slate-400">{c.employee_code}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {c.department_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {c.employment_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>Mulai: {c.contract_start}</div>
                        <div className="font-medium text-slate-900">Selesai: {c.contract_end}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-black text-sm ${
                            c.days_remaining <= 45 ? 'text-amber-600' : 'text-emerald-700'
                          }`}
                        >
                          {c.days_remaining} Hari
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'EXPIRING_SOON'
                              ? 'bg-amber-100 text-amber-800'
                              : c.status === 'EXPIRED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {c.status === 'EXPIRING_SOON' ? 'SEGERA BERAKHIR' : c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {c.action_needed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Siarkan Pengumuman Perusahaan</h2>
            <p className="text-xs text-slate-500">
              Pengumuman akan langsung disiarkan ke seluruh portal karyawan dan mengirim notifikasi broadcast.
            </p>

            <form onSubmit={handlePostAnnouncement} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surat Edaran Penyesuaian Jam Kerja Bulan Ramadhan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-medium"
                  >
                    <option value="HR_MEMO">HR Memo / Edaran</option>
                    <option value="CIRCULAR_LETTER">Surat Edaran Direksi</option>
                    <option value="HOLIDAY_NOTICE">Pemberitahuan Libur</option>
                    <option value="EVENT">Event & Townhall</option>
                    <option value="POLICY">Kebijakan Perusahaan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-medium"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">Tinggi (High)</option>
                    <option value="URGENT">Mendesak (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Pengumuman</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan isi pengumuman lengkap..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama File Dokumen Terlampir (Opsional)</label>
                <input
                  type="text"
                  placeholder="e.g. Surat_Edaran_Direksi_No_042.pdf"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono bg-slate-50"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="pinCheck" className="text-xs font-medium text-slate-700 select-none">
                  Sematkan di posisi teratas (Pin to top)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  Publikasikan Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
