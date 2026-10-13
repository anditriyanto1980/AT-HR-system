import React from 'react';
import { ShieldCheck, Search, Filter, Clock, User } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { formatDate, formatTime } from '../../utils/attendance';

export const AuditLogView: React.FC = () => {
  const logs = dataService.getAuditLogs();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900">Keamanan Sistem & Jejak Audit (Audit Trail)</h2>
        <p className="text-xs text-slate-500">
          Catatan audit permanen untuk akses pengguna, perubahan shift, data karyawan, dan aktivitas presensi.
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu / Tanggal</th>
                <th className="py-3 px-4">Pengguna / Operator</th>
                <th className="py-3 px-4">Modul</th>
                <th className="py-3 px-4">Aksi / Aktivitas</th>
                <th className="py-3 px-4">ID Rekaman</th>
                <th className="py-3 px-4">Ringkasan Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    Belum ada catatan log audit sistem.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-500 tabular-nums">
                      {formatDate(log.created_at)} {formatTime(log.created_at)}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      {log.user_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4 text-slate-500">{log.record_id || '-'}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-[280px] truncate">
                      {log.after_data ? JSON.stringify(log.after_data) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
