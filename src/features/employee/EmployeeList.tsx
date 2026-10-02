import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  Building,
  UserCheck,
  CheckCircle,
  Key,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { Employee, EmploymentStatus, UserRole } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/attendance';
import { EmployeeModal } from './EmployeeModal';
import { UserAccessModal } from './UserAccessModal';

export const EmployeeList: React.FC = () => {
  const { role, currentUser } = useAuth();
  const branches = dataService.getBranches();
  const departments = dataService.getDepartments();

  const [employees, setEmployees] = useState<Employee[]>(dataService.getEmployees());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAccess, setSelectedAccess] = useState<'all' | 'ACTIVE' | 'DISABLED'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  // User Login Access & Password Credentials Modal
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [employeeForAccess, setEmployeeForAccess] = useState<Employee | null>(null);

  // In-App Delete Confirmation Modal (solves browser iframe confirm() suppression)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSuperOrHr = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const refreshList = () => {
    setEmployees(dataService.getEmployees());
  };

  const handleOpenAdd = () => {
    setEmployeeToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEmployeeToEdit(emp);
    setModalOpen(true);
  };

  const handleOpenAccess = (emp: Employee) => {
    setEmployeeForAccess(emp);
    setAccessModalOpen(true);
  };

  const handleOpenDelete = (emp: Employee) => {
    setEmployeeToDelete(emp);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!employeeToDelete) return;

    // Safety guard: prevent deleting current active session user
    if (currentUser?.id === employeeToDelete.id) {
      setToast({
        type: 'error',
        message: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.',
      });
      setDeleteModalOpen(false);
      return;
    }

    const deletedName = employeeToDelete.full_name;
    dataService.deleteEmployee(employeeToDelete.id);
    refreshList();
    setDeleteModalOpen(false);
    setEmployeeToDelete(null);

    setToast({
      type: 'success',
      message: `Data karyawan "${deletedName}" berhasil dihapus dari sistem.`,
    });
    setTimeout(() => setToast(null), 4000);
  };

  // Filter logic
  const filteredEmployees = employees.filter((emp) => {
    // If manager, can see everyone or their team
    if (role === 'MANAGER' && emp.manager_id !== currentUser?.id && emp.id !== currentUser?.id) {
      // Still show in directory but with read-only badge
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = emp.full_name.toLowerCase().includes(q);
      const matchNik = emp.nik.toLowerCase().includes(q);
      const matchCode = emp.employee_code.toLowerCase().includes(q);
      const matchEmail = emp.email.toLowerCase().includes(q);
      const matchUser = emp.username?.toLowerCase().includes(q);
      if (!matchName && !matchNik && !matchCode && !matchEmail && !matchUser) return false;
    }

    if (selectedBranch !== 'all' && emp.branch_id !== selectedBranch) return false;
    if (selectedDepartment !== 'all' && emp.department_id !== selectedDepartment) return false;
    if (selectedStatus !== 'all' && emp.employment_status !== selectedStatus) return false;

    if (selectedAccess === 'ACTIVE' && emp.login_access_enabled === false) return false;
    if (selectedAccess === 'DISABLED' && emp.login_access_enabled !== false) return false;

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Workforce & User Accounts</h2>
          <p className="text-xs text-slate-500">
            Total {employees.length} karyawan · {employees.filter((e) => e.login_access_enabled !== false).length} memiliki hak akses login aktif
          </p>
        </div>

        {isSuperOrHr && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Karyawan</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Feedback Toast / Alert Banner */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 shadow-xs border ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, NIK, username..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D63FF] focus:bg-white text-slate-800"
          />
        </div>

        {/* Branch Filter */}
        <div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
          >
            <option value="all">Semua Cabang ({branches.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
          >
            <option value="all">Semua Departemen ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
          >
            <option value="all">Semua Status Kerja</option>
            <option value="Active">Active (Aktif)</option>
            <option value="Probation">Probation (Percobaan)</option>
            <option value="Suspended">Suspended (Ditangguhkan)</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>

        {/* Login Access Status Filter */}
        <div>
          <select
            value={selectedAccess}
            onChange={(e) => setSelectedAccess(e.target.value as any)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-700"
          >
            <option value="all">Semua Akses Login</option>
            <option value="ACTIVE">Akses Login Aktif</option>
            <option value="DISABLED">Akses Dinonaktifkan</option>
          </select>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">NIK & ID</th>
                <th className="py-3 px-4">Hak Akses Login</th>
                <th className="py-3 px-4">Branch & Department</th>
                <th className="py-3 px-4">Role / Title</th>
                <th className="py-3 px-4">Direct Manager</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Join Date</th>
                {isSuperOrHr && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada data karyawan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{emp.full_name}</div>
                          <div className="text-[11px] text-slate-500 truncate">{emp.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* NIK & ID */}
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <div className="text-slate-900 font-medium">{emp.employee_code}</div>
                      <div className="text-[11px] text-slate-500">{emp.nik}</div>
                    </td>

                    {/* Login Access & Username */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <span className="text-slate-400">@</span>
                          <span className="font-semibold text-slate-800">{emp.username || emp.employee_code.toLowerCase()}</span>
                        </div>
                        {emp.login_access_enabled !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Akses Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Dinonaktifkan
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Branch & Dept */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{emp.branch_name}</div>
                      <div className="text-[11px] text-slate-500">{emp.department_name}</div>
                    </td>

                    {/* Position & Role */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{emp.position_name}</div>
                      <StatusBadge status={emp.role} type="role" className="mt-0.5" />
                    </td>

                    {/* Manager */}
                    <td className="py-3 px-4 text-slate-600">
                      {emp.manager_name ? (
                        <span>{emp.manager_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">None (Board/Lead)</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={emp.employment_status} type="employment" />
                    </td>

                    {/* Join Date */}
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {formatDate(emp.join_date)}
                    </td>

                    {/* Actions */}
                    {isSuperOrHr && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Dedicated Hak Akses Button */}
                          <button
                            onClick={() => handleOpenAccess(emp)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                            title="Atur Username, Password, dan Hak Akses Login"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-600" />
                            <span className="hidden xl:inline">Hak Akses</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Data Karyawan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenDelete(emp)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Karyawan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Edit / Create Modal */}
      <EmployeeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        employeeToEdit={employeeToEdit}
        onSaved={refreshList}
      />

      {/* User Login Access & Password Credentials Modal */}
      <UserAccessModal
        isOpen={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        employee={employeeForAccess}
        onSaved={refreshList}
      />

      {/* In-App Delete Confirmation Modal (Independent of browser dialogs) */}
      {deleteModalOpen && employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Karyawan</h3>
                <p className="text-xs text-slate-500">
                  Apakah Anda yakin ingin menghapus data karyawan berikut dari sistem?
                </p>
              </div>
            </div>

            {/* Employee Preview Summary Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {employeeToDelete.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">{employeeToDelete.full_name}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    NIK: {employeeToDelete.nik} &bull; Kode: {employeeToDelete.employee_code}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                <span>{employeeToDelete.department_name || 'Departemen'} &bull; {employeeToDelete.branch_name}</span>
                <span className="font-semibold text-slate-900 font-mono">{employeeToDelete.role}</span>
              </div>
            </div>

            {/* Self-delete warning guard */}
            {currentUser?.id === employeeToDelete.id ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Akun Sedang Digunakan</span>
                </div>
                <p className="text-amber-800">
                  Anda tidak dapat menghapus akun ini karena saat ini sedang aktif digunakan untuk sesi login Anda.
                </p>
              </div>
            ) : (
              <p className="text-xs text-rose-600 bg-rose-50/80 border border-rose-200/80 p-3 rounded-xl leading-relaxed">
                <strong>Perhatian:</strong> Tindakan ini tidak dapat dibatalkan. Seluruh riwayat presensi, hak akses username, dan profil kompensasi karyawan ini akan terhapus.
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setEmployeeToDelete(null);
                }}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              {currentUser?.id !== employeeToDelete.id && (
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Karyawan</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
