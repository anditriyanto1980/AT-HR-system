import React, { useState, useEffect } from 'react';
import {
  Award,
  Star,
  Target,
  CheckCircle2,
  TrendingUp,
  User,
  Building,
  Calendar,
  Edit3,
  Search,
  MessageSquare,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { PerformanceAppraisal } from '../../types';

export const PerformanceView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const isSuperOrManager = role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'MANAGER';

  const [performances, setPerformances] = useState<PerformanceAppraisal[]>([]);
  const [selectedAppraisal, setSelectedAppraisal] = useState<PerformanceAppraisal | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit fields
  const [feedback, setFeedback] = useState('');
  const [selfNotes, setSelfNotes] = useState('');

  const reloadData = () => {
    if (currentUser) {
      if (role === 'EMPLOYEE') {
        const list = dataService.getEmployeePerformance(currentUser.id);
        setPerformances(list);
        if (list.length > 0 && !selectedAppraisal) {
          setSelectedAppraisal(list[0]);
        }
      } else {
        const list = dataService.getPerformances();
        setPerformances(list);
        if (list.length > 0 && !selectedAppraisal) {
          setSelectedAppraisal(list[0]);
        }
      }
    }
  };

  useEffect(() => {
    reloadData();
  }, [currentUser, role]);

  useEffect(() => {
    if (selectedAppraisal) {
      setFeedback(selectedAppraisal.manager_feedback);
      setSelfNotes(selectedAppraisal.self_assessment_notes);
    }
  }, [selectedAppraisal]);

  const filteredPerformances = performances.filter((p) => {
    if (
      searchTerm &&
      !p.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.department_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !p.period.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSaveFeedback = () => {
    if (!selectedAppraisal) return;
    const updated: PerformanceAppraisal = {
      ...selectedAppraisal,
      manager_feedback: feedback,
      self_assessment_notes: selfNotes,
      status: 'FINALIZED',
      reviewed_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    dataService.savePerformanceAppraisal(updated);
    setSelectedAppraisal(updated);
    setIsEditing(false);
    reloadData();
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Performance & KPI Appraisal Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Penilaian kinerja berkala, monitoring pencapaian target OKR/KPI, dan umpan balik atasan.
          </p>
        </div>
      </div>

      {/* Main Grid: List on Left, Active Scorecard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Appraisal Cards List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Evaluasi Kinerja
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari karyawan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden w-36 sm:w-44"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredPerformances.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Tidak ada data evaluasi.
              </div>
            ) : (
              filteredPerformances.map((perf) => {
                const isSelected = selectedAppraisal?.id === perf.id;
                return (
                  <div
                    key={perf.id}
                    onClick={() => {
                      setSelectedAppraisal(perf);
                      setIsEditing(false);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/5'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {perf.employee_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {perf.position_name} - {perf.department_name}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-1">
                          Periode: <span className="text-slate-700">{perf.period}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black border ${getGradeBadge(
                            perf.rating_grade
                          )}`}
                        >
                          Grade {perf.rating_grade}
                        </div>
                        <div className="text-base font-black text-slate-900 mt-1">
                          {perf.final_score}
                          <span className="text-[10px] text-slate-400 font-normal">/100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Scorecard Detail */}
        <div className="lg:col-span-7">
          {selectedAppraisal ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              {/* Scorecard Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      Scorecard Evaluasi Kinerja
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      {selectedAppraisal.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {selectedAppraisal.employee_name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedAppraisal.position_name} • {selectedAppraisal.department_name} ({selectedAppraisal.period})
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center sm:text-right shrink-0">
                  <div className="text-xs font-semibold text-slate-500">Skor Akhir & Predikat</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {selectedAppraisal.final_score}{' '}
                    <span className="text-xs font-bold text-emerald-600">
                      (Grade {selectedAppraisal.rating_grade})
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600">
                    {selectedAppraisal.rating_label}
                  </div>
                </div>
              </div>

              {/* KPI Items Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Rincian Indikator Kinerja Utama (KPI Breakdown)
                </h3>

                <div className="space-y-3">
                  {selectedAppraisal.kpis.map((kpi, idx) => (
                    <div
                      key={kpi.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 text-[10px] font-bold">
                              {kpi.category}
                            </span>
                            <h4 className="font-bold text-slate-900 text-xs">{kpi.title}</h4>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{kpi.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-slate-400 block font-medium">
                            Bobot: {kpi.weight}%
                          </span>
                          <span className="text-sm font-black text-slate-900">{kpi.score}</span>
                          <span className="text-[10px] text-slate-400">/100</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] border-t border-slate-200/60">
                        <div>
                          <span className="text-slate-400 block">Target:</span>
                          <span className="font-semibold text-slate-700">{kpi.target}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Realisasi (Actual):</span>
                          <span className="font-bold text-emerald-700">{kpi.actual}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, kpi.score)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Qualitative Review: Self Assessment & Manager Feedback */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  Evaluasi Kualitatif & Feedback Pembinaan
                </h3>

                <div className="space-y-3">
                  {/* Self assessment */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Self-Evaluation (Catatan Karyawan)
                    </span>
                    {isEditing ? (
                      <textarea
                        rows={2}
                        value={selfNotes}
                        onChange={(e) => setSelfNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
                      />
                    ) : (
                      <p className="text-xs text-slate-700 leading-relaxed italic">
                        &quot;{selectedAppraisal.self_assessment_notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Manager feedback */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-blue-50/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                        Ulasan Atasan Langsung ({selectedAppraisal.manager_name})
                      </span>
                      {selectedAppraisal.reviewed_at && (
                        <span className="text-[10px] text-slate-400">
                          {selectedAppraisal.reviewed_at}
                        </span>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      />
                    ) : (
                      <p className="text-xs text-slate-800 leading-relaxed">
                        {selectedAppraisal.manager_feedback}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit Controls for Manager */}
                {isSuperOrManager && (
                  <div className="flex justify-end gap-2 pt-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleSaveFeedback}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                        >
                          Simpan Evaluasi
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Catatan & Feedback
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              Pilih kartu evaluasi di sebelah kiri untuk melihat detail scorecard.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
