import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Key,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import {
  Branch,
  Company,
  Department,
  Employee,
  EmploymentStatus,
  EmploymentType,
  Position,
  UserRole,
} from '../../types';
import { dataService } from '../../services/dataService';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
  onSaved: () => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
  onSaved,
}) => {
  const company = dataService.getCompany();
  const branches = dataService.getBranches();
  const departments = dataService.getDepartments();
  const positions = dataService.getPositions();
  const allEmployees = dataService.getEmployees();

  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [nik, setNik] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [branchId, setBranchId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Permanent');
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>('Active');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);

  // Login credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAccessEnabled, setLoginAccessEnabled] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employeeToEdit) {
      setFullName(employeeToEdit.full_name);
      setEmployeeCode(employeeToEdit.employee_code);
      setNik(employeeToEdit.nik);
      setEmail(employeeToEdit.email);
      setPhone(employeeToEdit.phone);
      setGender(employeeToEdit.gender);
      setBranchId(employeeToEdit.branch_id);
      setDepartmentId(employeeToEdit.department_id);
      setPositionId(employeeToEdit.position_id);
      setManagerId(employeeToEdit.manager_id || '');
      setRole(employeeToEdit.role);
      setEmploymentType(employeeToEdit.employment_type);
      setEmploymentStatus(employeeToEdit.employment_status);
      setJoinDate(employeeToEdit.join_date);
      setUsername(employeeToEdit.username || employeeToEdit.email.split('@')[0]);
      setPassword(employeeToEdit.password || 'password123');
      setLoginAccessEnabled(employeeToEdit.login_access_enabled !== false);
    } else {
      // Auto-generate employee code
      const nextNum = allEmployees.length + 1;
      setFullName('');
      setEmployeeCode(`EMP-${String(nextNum).padStart(3, '0')}`);
      setNik(`3171${Date.now().toString().slice(-12)}`);
      setEmail('');
      setPhone('+62 812 ');
      setGender('Male');
      setBranchId(branches[0]?.id || '');
      setDepartmentId(departments[0]?.id || '');
      setPositionId(positions[0]?.id || '');
      setManagerId('');
      setRole('EMPLOYEE');
      setEmploymentType('Permanent');
      setEmploymentStatus('Active');
      setJoinDate(new Date().toISOString().split('T')[0]);
      setUsername(`user.emp${nextNum}`);
      setPassword('password123');
      setLoginAccessEnabled(true);
    }
    setErrors({});
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const randomPass = dataService.generateRandomPassword(10);
    setPassword(randomPass);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Nama lengkap wajib diisi';
    if (!employeeCode.trim()) newErrors.employeeCode = 'Kode karyawan wajib diisi';
    if (!nik.trim() || nik.length < 8) newErrors.nik = 'NIK valid minimal 8 digit';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Email perusahaan valid wajib diisi';
    if (!phone.trim()) newErrors.phone = 'Nomor telepon wajib diisi';
    if (!branchId) newErrors.branchId = 'Cabang penempatan wajib dipilih';
    if (!departmentId) newErrors.departmentId = 'Departemen wajib dipilih';
    if (!positionId) newErrors.positionId = 'Jabatan / Posisi wajib dipilih';

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      newErrors.username = 'Username login wajib diisi';
    } else if (dataService.checkUsernameExists(cleanUser, employeeToEdit?.id)) {
      newErrors.username = `Username "${cleanUser}" sudah digunakan karyawan lain`;
    }

    if (password && password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const employeeData: Employee = {
      id: employeeToEdit ? employeeToEdit.id : `emp-${Date.now()}`,
      employee_code: employeeCode.trim(),
      nik: nik.trim(),
      full_name: fullName.trim(),
      gender,
      email: email.trim(),
      phone: phone.trim(),
      company_id: company.id,
      branch_id: branchId,
      department_id: departmentId,
      position_id: positionId,
      manager_id: managerId || undefined,
      role,
      employment_type: employmentType,
      employment_status: employmentStatus,
      join_date: joinDate,
      username: cleanUser,
      password: password.trim() || 'password123',
      login_access_enabled: loginAccessEnabled,
    };

    dataService.saveEmployee(employeeData);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between bg-[#0B132B] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <User className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {employeeToEdit ? 'Edit Employee Record' : 'Register New Employee'}
              </h2>
              <p className="text-xs text-amber-400/90 font-medium">
                Ensure national identity, corporate email, and organizational unit are accurate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Budi Wicaksono"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {errors.fullName && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee ID Code *
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="EMP-021"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
              />
              {errors.employeeCode && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.employeeCode}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIK (KTP) *
              </label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="3171018809910001"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
              />
              {errors.nik && <p className="text-[11px] text-rose-600 mt-1">{errors.nik}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="budi.w@nusantaraprima.co.id"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812 3456 7890"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Org & Role Details */}
          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">
              Employment & Hierarchy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Branch *
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Position / Title *
                </label>
                <select
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direct Manager
                </label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">No Direct Manager (Executive)</option>
                  {allEmployees
                    .filter((e) => e.role === 'MANAGER' || e.role === 'SUPER_ADMIN' || e.role === 'HR_ADMIN')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.position_name || m.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Role (RBAC)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
                >
                  <option value="EMPLOYEE">EMPLOYEE (Standard Self-Service)</option>
                  <option value="MANAGER">MANAGER (Team Approval & Monitoring)</option>
                  <option value="HR_ADMIN">HR_ADMIN (Workforce & Shifts)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employment Status
                </label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Active">Active</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                  <option value="On_Leave">On Leave</option>
                </select>
              </div>
            </div>

            {/* Login Credentials & User Access */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Hak Akses & Kredensial Login Portal</span>
              </h3>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Izinkan Login ke Aplikasi (PWA / Web)</div>
                  <div className="text-[11px] text-slate-500">Karyawan dapat masuk menggunakan username dan password di bawah</div>
                </div>
                <button
                  type="button"
                  onClick={() => setLoginAccessEnabled(!loginAccessEnabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    loginAccessEnabled ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      loginAccessEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username Login *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-mono text-sm">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="cth: dewi.lestari"
                      className={`w-full pl-7 pr-3 py-2 text-sm bg-slate-50 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                        errors.username ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.username && (
                    <span className="text-[11px] text-rose-600 mt-0.5 block">{errors.username}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Password Akun</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password..."
                      className={`w-full pl-8 pr-9 py-2 text-sm bg-slate-50 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                        errors.password ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-[11px] text-rose-600 mt-0.5 block">{errors.password}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{employeeToEdit ? 'Save Changes' : 'Register Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
