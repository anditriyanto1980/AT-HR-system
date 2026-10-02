import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Gem,
  ShieldCheck,
  Briefcase,
  Rocket,
  Award,
  Globe,
  Phone,
  Mail,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Branch, Department, LocationPolicy, Position, Company } from '../../types';
import { BrandIcon } from '../../components/common/BrandIcon';

export const OrganizationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'branches' | 'departments' | 'company'>('branches');

  const [company, setCompany] = useState<Company>(() => dataService.getCompany());
  const [branches, setBranches] = useState<Branch[]>(dataService.getBranches());
  const [departments, setDepartments] = useState<Department[]>(dataService.getDepartments());
  const [positions, setPositions] = useState<Position[]>(dataService.getPositions());

  // Company Edit State
  const [companyForm, setCompanyForm] = useState<Company>(() => dataService.getCompany());
  const [companySaved, setCompanySaved] = useState(false);

  useEffect(() => {
    const handleCompanyUpdate = (e: any) => {
      const updated = e.detail || dataService.getCompany();
      setCompany(updated);
      setCompanyForm(updated);
    };
    window.addEventListener('company_updated', handleCompanyUpdate);
    return () => {
      window.removeEventListener('company_updated', handleCompanyUpdate);
    };
  }, []);

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

  // Save Company Profile & Branding
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = dataService.updateCompany(companyForm);
    setCompany(updated);
    setCompanyForm(updated);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 3500);
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
          <span>Identitas & Nama Aplikasi</span>
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

      {/* TAB 3: Company Profile & Application Branding */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                  Whitelabel & Branding
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Realtime Sync to Firestore
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Kustomisasi Nama Aplikasi & Identitas Perusahaan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sesuaikan nama sistem aplikasi, slogan, ikon brand, dan data legal perusahaan agar sesuai dengan profil bisnis Anda. Perubahan langsung aktif di seluruh antarmuka.
              </p>
            </div>

            <button
              onClick={handleSaveCompany}
              className="px-5 py-2.5 bg-[#1D63FF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Terapkan Perubahan</span>
            </button>
          </div>

          {companySaved && (
            <div className="p-4 bg-emerald-50 text-emerald-900 text-xs font-semibold rounded-2xl border border-emerald-200 flex items-center gap-3 animate-in fade-in duration-200 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block text-emerald-950">Nama Aplikasi & Identitas Berhasil Diperbarui!</span>
                <span className="text-emerald-800 text-[11px]">
                  Perubahan telah diterapkan secara instan ke Header, Layar Login, Judul Tab Browser, Slip Gaji, dan disinkronkan ke Firebase Cloud Firestore.
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Settings (7 cols) */}
            <form onSubmit={handleSaveCompany} className="lg:col-span-7 space-y-6">
              {/* Card 1: Branding & Nama Aplikasi */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      1. Pengaturan Nama Aplikasi (Branding)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Nama dan slogan yang tampil kepada karyawan dan admin
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Nama Aplikasi / Sistem HR <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={companyForm.app_name || ''}
                      onChange={(e) => setCompanyForm({ ...companyForm, app_name: e.target.value })}
                      placeholder="Contoh: AT-HR Enterprise, PT Maju Bersama HRIS, Presensi Pintar"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 transition-all"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Nama ini akan ditampilkan pada <strong>Header Utama</strong>, <strong>Halaman Login</strong>, <strong>Judul Tab Browser</strong>, dan <strong>Laporan Resmi</strong>.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Tagline / Slogan Aplikasi
                      </label>
                      <input
                        type="text"
                        value={companyForm.tagline || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })}
                        placeholder="Contoh: Smart Solutions for Smart Business"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Tampil di bawah nama aplikasi pada bar atas dan login.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Singkatan / Kode Brand (Short Name)
                      </label>
                      <input
                        type="text"
                        value={companyForm.app_short_name || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, app_short_name: e.target.value.toUpperCase() })}
                        placeholder="Contoh: AT-HR, HRIS, NPD"
                        maxLength={8}
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800 uppercase"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Digunakan pada watermark dan badge slip gaji (maks. 8 huruf).
                      </span>
                    </div>
                  </div>

                  {/* Brand Icon Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-2">
                      Pilih Ikon Brand / Logo Aplikasi
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {[
                        { id: 'gem', label: 'Gem', icon: Gem },
                        { id: 'building', label: 'Office', icon: Building2 },
                        { id: 'sparkles', label: 'Magic', icon: Sparkles },
                        { id: 'shield', label: 'Secure', icon: ShieldCheck },
                        { id: 'briefcase', label: 'Corporate', icon: Briefcase },
                        { id: 'rocket', label: 'Fast', icon: Rocket },
                        { id: 'award', label: 'Award', icon: Award },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = (companyForm.brand_icon || 'gem') === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setCompanyForm({ ...companyForm, brand_icon: item.id as any })}
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 text-blue-700 shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-[10px] font-semibold">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Data Legal Perusahaan */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      2. Data Legal & Entitas Perusahaan
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Informasi resmi badan usaha untuk slip gaji, kontrak, dan surat tugas
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Resmi Perusahaan (PT/CV) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={companyForm.name}
                        onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                        placeholder="Contoh: PT Nusantara Prima Digital"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kode Perusahaan
                      </label>
                      <input
                        type="text"
                        value={companyForm.code}
                        onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value.toUpperCase() })}
                        placeholder="Contoh: NPD"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Kantor Pusat
                    </label>
                    <textarea
                      rows={2}
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      placeholder="Alamat lengkap gedung, jalan, dan kota kantor pusat..."
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Telepon Kantor</span>
                      </label>
                      <input
                        type="text"
                        value={companyForm.phone}
                        onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                        placeholder="+62 21 5790 8820"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>Email Resmi HR</span>
                      </label>
                      <input
                        type="email"
                        value={companyForm.email}
                        onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                        placeholder="corporate@perusahaan.co.id"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>Website Perusahaan</span>
                      </label>
                      <input
                        type="text"
                        value={companyForm.website || ''}
                        onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                        placeholder="https://perusahaan.co.id"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan & Perbarui Nama Aplikasi</span>
                </button>
              </div>
            </form>

            {/* Right Column: Live Visual Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Pratinjau Langsung (Live Preview)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Rendering
                  </span>
                </div>

                {/* Preview 1: Header Simulator */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    1. Tampilan Header Atas (Dashboard Bar):
                  </span>
                  <div className="p-3 rounded-xl bg-[#0B132B] border border-slate-800 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
                        <BrandIcon name={companyForm.brand_icon} className="w-4 h-4 text-slate-950" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white tracking-tight truncate">
                          {companyForm.app_name || 'AT-HR Enterprise'}
                        </span>
                        <span className="text-[9px] text-amber-400 truncate">
                          {companyForm.tagline || 'Smart Solutions for Smart Business'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">Header UI</span>
                  </div>
                </div>

                {/* Preview 2: Login Page Simulator */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    2. Tampilan Layar Login Karyawan:
                  </span>
                  <div className="p-4 rounded-xl bg-[#F0F4F8] text-slate-800 border border-slate-300 text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black shadow-sm">
                      <BrandIcon name={companyForm.brand_icon} className="w-5 h-5 text-slate-950" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 tracking-tight">
                        {companyForm.app_name || 'AT-HR Enterprise'}
                      </div>
                      <div className="text-[10px] font-semibold text-amber-600">
                        {companyForm.tagline || 'Smart Solutions for Smart Business'}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1">
                        {companyForm.name || 'PT Nusantara Prima Digital'} — Portal Absensi
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview 3: Payslip Header Simulator */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    3. Header Dokumen Slip Gaji Elektronik:
                  </span>
                  <div className="p-3 rounded-xl bg-white text-slate-900 border border-slate-200 space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-black text-[9px]">
                        {companyForm.app_short_name || (companyForm.app_name ? companyForm.app_name.substring(0, 2).toUpperCase() : 'AT')}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 uppercase">
                          {companyForm.name || 'PT Nusantara Prima Digital'}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          Sistem {companyForm.app_name || 'AT-HR'} Automated Payroll
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800 text-[11px] text-blue-200 leading-relaxed">
                  💡 <strong>Catatan:</strong> Pengaturan ini memungkinkan aplikasi digunakan secara fleksibel oleh perusahaan mana saja dengan nama, logo brand, dan identitas perusahaan mereka sendiri.
                </div>
              </div>
            </div>
          </div>
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
