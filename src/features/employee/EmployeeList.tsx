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

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data karyawan ${name}?`)) {
      dataService.deleteEmployee(id);
      refreshList();
    }
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
                            onClick={() => handleDelete(emp.id, emp.full_name)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
    </div>
  );
};
