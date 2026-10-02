import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  Shield,
  Save,
  Compass,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Branch, Department, LocationPolicy, Position } from '../../types';

export const OrganizationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'branches' | 'departments' | 'company'>('branches');

  const company = dataService.getCompany();
  const [branches, setBranches] = useState<Branch[]>(dataService.getBranches());
  const [departments, setDepartments] = useState<Department[]>(dataService.getDepartments());
  const [positions, setPositions] = useState<Position[]>(dataService.getPositions());

  // Branch Modal State
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    city: '',
    address: '',
    latitude: -6.2,
    longitude: 106.8,
    radius_meters: 100,
    policy: 'BLOCK_OUTSIDE_RADIUS' as LocationPolicy,
  });

  // Department Modal State
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });

  // Position Modal State (CRUD for Admin)
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionForm, setPositionForm] = useState({
    name: '',
    code: '',
    department_id: '',
    level: 1,
  });

  // Company Edit State
  const [companyForm, setCompanyForm] = useState(company);
  const [companySaved, setCompanySaved] = useState(false);

  // Refresh
  const refreshData = () => {
    setBranches(dataService.getBranches());
    setDepartments(dataService.getDepartments());
    setPositions(dataService.getPositions());
  };

  // Branch handlers
  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({
      name: '',
      code: `BR-${branches.length + 1}`,
      city: 'Jakarta',
      address: '',
      latitude: -6.21462,
      longitude: 106.82155,
      radius_meters: 150,
      policy: 'BLOCK_OUTSIDE_RADIUS',
    });
    setBranchModalOpen(true);
  };

  const handleOpenEditBranch = (b: Branch) => {
    setEditingBranch(b);
    setBranchForm({
      name: b.name,
      code: b.code,
      city: b.city,
      address: b.address,
      latitude: b.latitude,
      longitude: b.longitude,
      radius_meters: b.radius_meters,
      policy: b.policy,
    });
    setBranchModalOpen(true);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const branchData: Branch = {
      id: editingBranch ? editingBranch.id : `branch-${Date.now()}`,
      company_id: company.id,
      code: branchForm.code,
      name: branchForm.name,
      city: branchForm.city,
      address: branchForm.address,
      latitude: Number(branchForm.latitude),
      longitude: Number(branchForm.longitude),
      radius_meters: Number(branchForm.radius_meters),
      policy: branchForm.policy,
      is_active: true,
    };
    dataService.saveBranch(branchData);
    refreshData();
    setBranchModalOpen(false);
  };

  const handleDeleteBranch = (id: string, name: string) => {
    dataService.deleteBranch(id);
    refreshData();
  };

  // Dept handlers
  const handleOpenAddDept = () => {
    setEditingDept(null);
    setDeptForm({
      name: '',
      code: `D-${departments.length + 1}`,
      description: '',
    });
    setDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
    });
    setDeptModalOpen(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;
    const deptData: Department = {
      id: editingDept ? editingDept.id : `dept-${Date.now()}`,
      company_id: company.id,
      code: deptForm.code.trim() || `D-${departments.length + 1}`,
      name: deptForm.name.trim(),
      description: deptForm.description.trim(),
    };
    dataService.saveDepartment(deptData);
    refreshData();
    setDeptModalOpen(false);
    setEditingDept(null);
    setDeptForm({ name: '', code: '', description: '' });
  };

  const handleDeleteDept = (id: string, name: string) => {
    dataService.deleteDepartment(id);
    refreshData();
  };

  // Position handlers (CRUD)
  const handleOpenAddPosition = (departmentId?: string) => {
    setEditingPosition(null);
    const targetDeptId = departmentId || (departments.length > 0 ? departments[0].id : '');
    setPositionForm({
      name: '',
      code: `POS-${positions.length + 1}`,
      department_id: targetDeptId,
      level: 1,
    });
    setPositionModalOpen(true);
  };

  const handleOpenEditPosition = (pos: Position) => {
    setEditingPosition(pos);
    setPositionForm({
      name: pos.name,
      code: pos.code || `POS-${pos.level}`,
      department_id: pos.department_id,
      level: pos.level || 1,
    });
    setPositionModalOpen(true);
  };

  const handleSavePosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionForm.name.trim()) return;
    const posData: Position = {
      id: editingPosition ? editingPosition.id : `pos-${Date.now()}`,
      department_id: positionForm.department_id,
      name: positionForm.name.trim(),
      code: positionForm.code.trim() || `POS-${positionForm.level}`,
      level: Number(positionForm.level),
      created_at: editingPosition?.created_at || new Date().toISOString(),
    };
    dataService.savePosition(posData);
    refreshData();
    setPositionModalOpen(false);
    setEditingPosition(null);
  };

  const handleDeletePosition = (id: string, name: string) => {
    dataService.deletePosition(id);
    refreshData();
  };

  // Save Company Profile
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    dataService.updateCompany(companyForm);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1">
        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'branches'
              ? 'bg-[#1D63FF] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Branches & Geofences ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-[#1D63FF] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Departments & Roles ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'company'
              ? 'bg-[#1D63FF] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Profile</span>
        </button>
      </div>

      {/* TAB 1: Branches & GPS Geofences */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Branch Office Locations & GPS Geofencing</h3>
              <p className="text-xs text-slate-500">
                Define office coordinates, radius boundary, and outside-area attendance rules
              </p>
            </div>
            <button
              onClick={handleOpenAddBranch}
              className="px-4 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Branch Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {branches.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {b.code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{b.name}</h4>
                      <span className="text-xs text-slate-500">{b.city}</span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        b.policy === 'BLOCK_OUTSIDE_RADIUS'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {b.policy === 'BLOCK_OUTSIDE_RADIUS' ? 'Strict Geofence' : 'Approval Allowed'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{b.address}</p>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Latitude / Longitude</span>
                      <span className="text-slate-900 font-semibold">
                        {b.latitude.toFixed(5)}, {b.longitude.toFixed(5)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Geofence Radius</span>
                      <span className="text-emerald-700 font-bold">{b.radius_meters} meters</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEditBranch(b)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Edit Branch"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBranch(b.id, b.name)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete Branch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Departments & Positions */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Departments & Job Positions (CRUD)</h3>
              <p className="text-xs text-slate-500">Kelola departemen, struktur organisasi, dan jabatan karier karyawan</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenAddPosition()}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-600" />
                <span>Tambah Jabatan</span>
              </button>
              <button
                onClick={handleOpenAddDept}
                className="px-4 py-2 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Departemen</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {departments.map((dept) => {
              const deptPositions = positions.filter((p) => p.department_id === dept.id);
              return (
                <div
                  key={dept.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {dept.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{dept.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{dept.description || 'Tidak ada deskripsi'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditDept(dept)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Departemen"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDept(dept.id, dept.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Departemen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Daftar Jabatan ({deptPositions.length})
                        </span>
                        <button
                          onClick={() => handleOpenAddPosition(dept.id)}
                          className="text-[11px] font-semibold text-[#1D63FF] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah ke {dept.name}</span>
                        </button>
                      </div>

                      {deptPositions.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          Belum ada jabatan di departemen ini.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {deptPositions.map((pos) => (
                            <div
                              key={pos.id}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 hover:border-slate-300 transition-colors"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {pos.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                  <span className="font-mono">{pos.code}</span>
                                  <span>&bull;</span>
                                  <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                    Lvl {pos.level}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleOpenEditPosition(pos)}
                                  className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                                  title="Edit Jabatan"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeletePosition(pos.id, pos.name)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Hapus Jabatan"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Company Profile */}
      {activeTab === 'company' && (
        <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Corporate Legal Entity Details</h3>
            <p className="text-xs text-slate-500">Master organization information for payroll and attendance</p>
          </div>

          {companySaved && (
            <div className="p-3 bg-emerald-50 text-emerald-900 text-xs font-semibold rounded-lg border border-emerald-200">
              Company details successfully updated!
            </div>
          )}

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Code</label>
                <input
                  type="text"
                  value={companyForm.code}
                  onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Name</label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Headquarters Address</label>
              <textarea
                rows={2}
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Company Information</span>
            </button>
          </form>
        </div>
      )}

      {/* Branch Modal */}
      {branchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingBranch ? 'Edit Branch Location' : 'Add New Branch Location'}
            </h3>
            <form onSubmit={handleSaveBranch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    placeholder="e.g. Jakarta Head Office"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    placeholder="JKT-HQ"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={branchForm.city}
                  onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                  placeholder="Jakarta"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Address</label>
                <input
                  type="text"
                  required
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="Jl. Sudirman Kav 86"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={branchForm.latitude}
                    onChange={(e) => setBranchForm({ ...branchForm, latitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={branchForm.longitude}
                    onChange={(e) => setBranchForm({ ...branchForm, longitude: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Geofence Radius (meters)</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    required
                    value={branchForm.radius_meters}
                    onChange={(e) => setBranchForm({ ...branchForm, radius_meters: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Outside Geofence Policy</label>
                  <select
                    value={branchForm.policy}
                    onChange={(e) => setBranchForm({ ...branchForm, policy: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="BLOCK_OUTSIDE_RADIUS">BLOCK (Reject Clock In)</option>
                    <option value="ALLOW_WITH_APPROVAL">ALLOW WITH APPROVAL</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setBranchModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dept Modal */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingDept ? 'Edit Data Departemen' : 'Tambah Departemen Baru'}
            </h3>
            <form onSubmit={handleSaveDept} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Departemen *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Legal & Compliance"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Departemen</label>
                <input
                  type="text"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  placeholder="LGL"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi & Ruang Lingkup</label>
                <textarea
                  rows={2}
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="Ruang lingkup kerja departemen"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setDeptModalOpen(false);
                    setEditingDept(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {editingDept ? 'Simpan Perubahan' : 'Buat Departemen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Position Modal (CRUD) */}
      {positionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingPosition ? 'Edit Data Jabatan' : 'Tambah Jabatan Baru'}
            </h3>
            <form onSubmit={handleSavePosition} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Jabatan *</label>
                <input
                  type="text"
                  required
                  value={positionForm.name}
                  onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Jabatan</label>
                  <input
                    type="text"
                    value={positionForm.code}
                    onChange={(e) => setPositionForm({ ...positionForm, code: e.target.value })}
                    placeholder="FE-SR"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat / Level</label>
                  <select
                    value={positionForm.level}
                    onChange={(e) => setPositionForm({ ...positionForm, level: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                  >
                    <option value={1}>Level 1 - Entry / Staff</option>
                    <option value={2}>Level 2 - Officer / Associate</option>
                    <option value={3}>Level 3 - Senior / Specialist</option>
                    <option value={4}>Level 4 - Lead / Manager</option>
                    <option value={5}>Level 5 - Head / Director</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Departemen *</label>
                <select
                  required
                  value={positionForm.department_id}
                  onChange={(e) => setPositionForm({ ...positionForm, department_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                >
                  <option value="" disabled>Pilih Departemen</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setPositionModalOpen(false);
                    setEditingPosition(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {editingPosition ? 'Simpan Perubahan' : 'Buat Jabatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
