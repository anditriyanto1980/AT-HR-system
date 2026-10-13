import React from 'react';
import { AttendanceStatus, EmploymentStatus, EmploymentType, UserRole } from '../../types';

interface StatusBadgeProps {
  status: AttendanceStatus | EmploymentStatus | EmploymentType | UserRole | string;
  type?: 'attendance' | 'employment' | 'role' | 'generic';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'attendance', className = '' }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  if (type === 'attendance') {
    switch (status) {
      case 'present':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Hadir Tepat Waktu';
        break;
      case 'late':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'Terlambat';
        break;
      case 'absent':
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        label = 'Tidak Hadir (Alpa)';
        break;
      case 'early_checkout':
        badgeStyle = 'bg-orange-50 text-orange-700 border-orange-200';
        label = 'Pulang Awal';
        break;
      case 'leave':
        badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
        label = 'Cuti';
        break;
      case 'sick':
        badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
        label = 'Sakit';
        break;
      case 'business_trip':
        badgeStyle = 'bg-cyan-50 text-cyan-700 border-cyan-200';
        label = 'Perjalanan Dinas';
        break;
      case 'holiday':
        badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        label = 'Hari Libur';
        break;
      case 'day_off':
        badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
        label = 'Libur Kerja';
        break;
      case 'overtime':
        badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
        label = 'Lembur';
        break;
    }
  } else if (type === 'role') {
    switch (status) {
      case 'SUPER_ADMIN':
        badgeStyle = 'bg-slate-900 text-white border-slate-900';
        label = 'Super Admin';
        break;
      case 'HR_ADMIN':
        badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
        label = 'Admin HR';
        break;
      case 'MANAGER':
        badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
        label = 'Manajer';
        break;
      case 'EMPLOYEE':
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
        label = 'Karyawan';
        break;
    }
  } else if (type === 'employment') {
    switch (status) {
      case 'Active':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Aktif';
        break;
      case 'Permanent':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Tetap (PKWTT)';
        break;
      case 'Contract':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'Kontrak (PKWT)';
        break;
      case 'Probation':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'Masa Percobaan';
        break;
      case 'Internship':
        badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        label = 'Magang (Intern)';
        break;
      case 'Resigned':
        badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200';
        label = 'Resign';
        break;
      case 'Terminated':
        badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200';
        label = 'Non-Aktif';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeStyle} ${className}`}
    >
      {label}
    </span>
  );
};
