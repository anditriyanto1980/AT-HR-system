import React from 'react';
import {
  X,
  LayoutDashboard,
  Clock,
  Calendar,
  CalendarDays,
  FileText,
  Timer,
  Plane,
  History,
  DollarSign,
  Receipt,
  BookOpen,
  LogOut,
  MapPin,
  CheckSquare,
  Users,
  Building2,
  CalendarCheck,
  TrendingUp,
  Database,
  ShieldCheck,
  ChevronRight,
  User,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { BrandIcon } from '../common/BrandIcon';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onNavigateTab: (tab: string) => void;
  onOpenDbModal: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onNavigateTab,
  onOpenDbModal,
}) => {
  const { currentUser, role, logout, switchRole } = useAuth();
  const isSuperOrHr = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  const isManager = role === 'MANAGER';
  const company = dataService.getCompany();

  if (!isOpen) return null;

  const handleSelectTab = (tab: string) => {
    onNavigateTab(tab);
    onClose();
  };

  const menuSections = [
    {
      title: 'PRESENSI & UTAMA',
      items: [
        { id: 'dashboard', label: 'Beranda / Dashboard', icon: LayoutDashboard },
        { id: 'clock-in', label: 'Clock In / Out (Kamera & GPS)', icon: Clock, badge: 'Wajib Foto' },
        { id: 'attendance-history', label: 'Riwayat Absensi Saya', icon: Calendar },
        ...(isSuperOrHr || isManager
          ? [{ id: 'attendance-monitoring', label: 'Monitoring Realtime Tim', icon: MapPin }]
          : []),
      ],
    },
    {
      title: 'PENGAJUAN & OPERASIONAL',
      items: [
        { id: 'leave', label: 'Pengajuan Cuti (Leave)', icon: CalendarDays },
        { id: 'permission', label: 'Izin & Sakit (Permission)', icon: FileText },
        { id: 'overtime', label: 'Lembur Kerja (Overtime)', icon: Timer },
        { id: 'business-trip', label: 'Perjalanan Dinas (SPPD)', icon: Plane },
        { id: 'attendance-correction', label: 'Koreksi Absensi', icon: History },
        { id: 'holiday', label: 'Kalender Libur Nasional', icon: CalendarCheck },
        ...(isSuperOrHr || isManager
          ? [{ id: 'approvals-hub', label: 'Pusat Persetujuan (Approvals)', icon: CheckSquare }]
          : []),
      ],
    },
    {
      title: 'KEUANGAN & GAJI',
      items: [
        { id: 'payroll', label: 'Slip Gaji Saya (Payslip)', icon: DollarSign },
        { id: 'reimbursements', label: 'Klaim Biaya (Reimbursement)', icon: Receipt },
      ],
    },
    {
      title: 'PANDUAN & BANTUAN',
      items: [
        { id: 'user-guide', label: 'Buku Panduan & SOP Karyawan', icon: BookOpen, badge: 'SOP' },
        { id: 'company-hub', label: 'Company Hub & Pengumuman', icon: Building2 },
      ],
    },
    ...(isSuperOrHr
      ? [
          {
            title: 'ADMINISTRATOR HR',
            items: [
              { id: 'employees', label: 'Kelola Karyawan', icon: Users },
              { id: 'organization', label: 'Cabang & Departemen', icon: Building2 },
              { id: 'shifts', label: 'Jadwal & Shift Kerja', icon: Clock },
              { id: 'audit-logs', label: 'Audit Trail Sistem', icon: ShieldCheck },
            ],
          },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-[#0B1528] text-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#081020]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <BrandIcon name={company.brand_icon} className="w-4 h-4 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate max-w-[170px]">
                {company.app_name || company.name || 'AT-HR Portal'}
              </div>
              <div className="text-[10px] text-amber-400 font-medium truncate">
                Menu Lengkap Karyawan
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-4 bg-white/5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                currentUser?.full_name?.charAt(0) || 'U'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {currentUser?.full_name || 'Karyawan'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                NIK: {currentUser?.nik || currentUser?.employee_code || '-'}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {role === 'EMPLOYEE'
                    ? 'Karyawan'
                    : role === 'MANAGER'
                    ? 'Manager'
                    : role === 'HR_ADMIN'
                    ? 'HR Admin'
                    : 'Super Admin'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {currentUser?.position_name || currentUser?.department_name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left ${
                        isActive
                          ? 'bg-[#1D63FF] text-white font-bold shadow-md shadow-blue-500/25'
                          : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-400/20 text-amber-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Database Modal Action */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                onOpenDbModal();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Status Database Firebase</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Drawer Footer with Logout */}
        <div className="p-3 border-t border-slate-800 bg-[#081020] flex items-center gap-2">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
