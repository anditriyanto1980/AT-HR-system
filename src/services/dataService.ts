import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ApprovalLog,
  ApprovalStatus,
  AttendanceCorrection,
  AttendanceLocation,
  AttendanceRecord,
  AuditLog,
  Branch,
  BusinessTripRequest,
  AppNotification,
  Company,
  Department,
  Employee,
  Holiday,
  HolidayType,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  OvertimeRequest,
  PayrollAttendanceSummary,
  PermissionRequest,
  Position,
  Shift,
  UserRole,
  WorkScheduleAssignment,
  EmployeeSalaryProfile,
  PayrollBatch,
  PayrollItem,
  PayrollStatus,
  ReimbursementClaim,
  ReimbursementCategory,
  PerformanceAppraisal,
  CompanyAnnouncement,
  EmployeeContractTracker,
} from '../types';
import {
  DEMO_APPROVAL_LOGS,
  DEMO_ATTENDANCE,
  DEMO_ATTENDANCE_CORRECTIONS,
  DEMO_ATTENDANCE_LOCATIONS,
  DEMO_BRANCHES,
  DEMO_BUSINESS_TRIPS,
  DEMO_COMPANY,
  DEMO_DEPARTMENTS,
  DEMO_EMPLOYEES,
  DEMO_HOLIDAYS,
  DEMO_LEAVE_BALANCES,
  DEMO_LEAVE_REQUESTS,
  DEMO_LEAVE_TYPES,
  DEMO_NOTIFICATIONS,
  DEMO_OVERTIME_REQUESTS,
  DEMO_PERMISSION_REQUESTS,
  DEMO_POSITIONS,
  DEMO_SHIFTS,
  DEMO_WORK_SCHEDULES,
  DEMO_SALARY_PROFILES,
  DEMO_PAYROLL_BATCHES,
  DEMO_PAYROLL_ITEMS,
  DEMO_REIMBURSEMENTS,
  DEMO_PERFORMANCES,
  DEMO_ANNOUNCEMENTS,
  DEMO_CONTRACT_TRACKERS,
} from './demoData';

const STORAGE_KEYS = {
  COMPANY: 'athr_company',
  BRANCHES: 'athr_branches',
  DEPARTMENTS: 'athr_departments',
  POSITIONS: 'athr_positions',
  EMPLOYEES: 'athr_employees',
  SHIFTS: 'athr_shifts',
  LOCATIONS: 'athr_locations',
  ATTENDANCE: 'athr_attendance',
  AUDIT_LOGS: 'athr_audit_logs',
  SUPABASE_CONFIG: 'athr_supabase_config',
  LEAVE_TYPES: 'athr_leave_types',
  LEAVE_BALANCES: 'athr_leave_balances',
  LEAVE_REQUESTS: 'athr_leave_requests',
  PERMISSION_REQUESTS: 'athr_permission_requests',
  OVERTIME_REQUESTS: 'athr_overtime_requests',
  APPROVAL_LOGS: 'athr_approval_logs',
  HOLIDAYS: 'athr_holidays',
  CORRECTIONS: 'athr_corrections',
  BUSINESS_TRIPS: 'athr_business_trips',
  NOTIFICATIONS: 'athr_notifications',
  WORK_SCHEDULES: 'athr_work_schedules',
  SALARY_PROFILES: 'athr_salary_profiles',
  PAYROLL_BATCHES: 'athr_payroll_batches',
  PAYROLL_ITEMS: 'athr_payroll_items',
  REIMBURSEMENTS: 'athr_reimbursements',
  PERFORMANCES: 'athr_performances',
  ANNOUNCEMENTS: 'athr_announcements',
  CONTRACT_TRACKERS: 'athr_contract_trackers',
};

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

class DataService {
  private supabase: SupabaseClient | null = null;
  private isLiveSupabase: boolean = false;

  constructor() {
    this.initSupabase();
    this.seedLocalStorageIfEmpty();
  }

  private initSupabase() {
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    let config: SupabaseConfig | null = null;
    const stored = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (stored) {
      try {
        config = JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }

    const url = config?.url || (envUrl && envUrl !== 'https://your-project.supabase.co' ? envUrl : '');
    const key = config?.anonKey || (envKey && envKey !== 'your-anon-public-key' ? envKey : '');

    if (url && key) {
      try {
        this.supabase = createClient(url, key);
        this.isLiveSupabase = true;
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
        this.supabase = null;
        this.isLiveSupabase = false;
      }
    } else {
      this.supabase = null;
      this.isLiveSupabase = false;
    }
  }

  public getSupabaseStatus(): { isConfigured: boolean; url: string; anonKey: string } {
    const stored = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    let url = import.meta.env.VITE_SUPABASE_URL || '';
    let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.url) url = parsed.url;
        if (parsed.anonKey) anonKey = parsed.anonKey;
      } catch (e) {
        // ignore
      }
    }

    const isValid = Boolean(
      url &&
        url !== 'https://your-project.supabase.co' &&
        anonKey &&
        anonKey !== 'your-anon-public-key'
    );

    return {
      isConfigured: isValid && this.isLiveSupabase,
      url,
      anonKey,
    };
  }

  public async setSupabaseConfig(url: string, anonKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = createClient(url, anonKey);
      // Quick ping test
      const { error } = await client.from('companies').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is just row not found, other errors might be permissions or url issue
        console.warn('Supabase test returned code:', error.code, error.message);
      }

      localStorage.setItem(
        STORAGE_KEYS.SUPABASE_CONFIG,
        JSON.stringify({ url, anonKey, isConnected: true })
      );
      this.supabase = client;
      this.isLiveSupabase = true;
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to connect to Supabase.' };
    }
  }

  public resetToLocalDemo() {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_CONFIG);
    this.supabase = null;
    this.isLiveSupabase = false;
  }

  private seedLocalStorageIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEYS.COMPANY)) {
      localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(DEMO_COMPANY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BRANCHES)) {
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(DEMO_BRANCHES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(DEMO_DEPARTMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.POSITIONS)) {
      localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(DEMO_POSITIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEMO_EMPLOYEES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHIFTS)) {
      localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(DEMO_SHIFTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOCATIONS)) {
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(DEMO_ATTENDANCE_LOCATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(DEMO_ATTENDANCE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEAVE_TYPES)) {
      localStorage.setItem(STORAGE_KEYS.LEAVE_TYPES, JSON.stringify(DEMO_LEAVE_TYPES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCES)) {
      localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCES, JSON.stringify(DEMO_LEAVE_BALANCES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(DEMO_LEAVE_REQUESTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PERMISSION_REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.PERMISSION_REQUESTS, JSON.stringify(DEMO_PERMISSION_REQUESTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OVERTIME_REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.OVERTIME_REQUESTS, JSON.stringify(DEMO_OVERTIME_REQUESTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPROVAL_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.APPROVAL_LOGS, JSON.stringify(DEMO_APPROVAL_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HOLIDAYS)) {
      localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(DEMO_HOLIDAYS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CORRECTIONS)) {
      localStorage.setItem(STORAGE_KEYS.CORRECTIONS, JSON.stringify(DEMO_ATTENDANCE_CORRECTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BUSINESS_TRIPS)) {
      localStorage.setItem(STORAGE_KEYS.BUSINESS_TRIPS, JSON.stringify(DEMO_BUSINESS_TRIPS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEMO_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WORK_SCHEDULES)) {
      localStorage.setItem(STORAGE_KEYS.WORK_SCHEDULES, JSON.stringify(DEMO_WORK_SCHEDULES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALARY_PROFILES)) {
      localStorage.setItem(STORAGE_KEYS.SALARY_PROFILES, JSON.stringify(DEMO_SALARY_PROFILES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYROLL_BATCHES)) {
      localStorage.setItem(STORAGE_KEYS.PAYROLL_BATCHES, JSON.stringify(DEMO_PAYROLL_BATCHES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYROLL_ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.PAYROLL_ITEMS, JSON.stringify(DEMO_PAYROLL_ITEMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REIMBURSEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(DEMO_REIMBURSEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PERFORMANCES)) {
      localStorage.setItem(STORAGE_KEYS.PERFORMANCES, JSON.stringify(DEMO_PERFORMANCES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(DEMO_ANNOUNCEMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONTRACT_TRACKERS)) {
      localStorage.setItem(STORAGE_KEYS.CONTRACT_TRACKERS, JSON.stringify(DEMO_CONTRACT_TRACKERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      const initialLogs: AuditLog[] = [
        {
          id: 'log-01',
          user_name: 'System Initializer',
          action: 'SEED_INITIAL_DATA',
          module: 'SYSTEM',
          created_at: new Date().toISOString(),
          record_id: 'SYSTEM_BOOT',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
    }
  }

  // AUDIT LOG
  public logAudit(log: Omit<AuditLog, 'id' | 'created_at'>) {
    const logs: AuditLog[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop(); // keep last 200
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  public getAuditLogs(): AuditLog[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
  }

  // COMPANY
  public getCompany(): Company {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANY) || JSON.stringify(DEMO_COMPANY));
  }

  public updateCompany(company: Company): void {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
    this.logAudit({
      user_name: 'Admin',
      action: 'UPDATE_COMPANY',
      module: 'ORGANIZATION',
      record_id: company.id,
      after_data: company,
    });
  }

  // BRANCHES
  public getBranches(): Branch[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BRANCHES) || '[]');
  }

  public saveBranch(branch: Branch): void {
    const branches = this.getBranches();
    const index = branches.findIndex((b) => b.id === branch.id);
    if (index >= 0) {
      branches[index] = branch;
    } else {
      branches.push(branch);
    }
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
    this.logAudit({
      user_name: 'Admin',
      action: index >= 0 ? 'UPDATE_BRANCH' : 'CREATE_BRANCH',
      module: 'ORGANIZATION',
      record_id: branch.id,
      after_data: branch,
    });
  }

  public deleteBranch(id: string): void {
    const branches = this.getBranches().filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
    this.logAudit({
      user_name: 'Admin',
      action: 'DELETE_BRANCH',
      module: 'ORGANIZATION',
      record_id: id,
    });
  }

  // DEPARTMENTS
  public getDepartments(): Department[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEPARTMENTS) || '[]');
  }

  public saveDepartment(department: Department): void {
    const departments = this.getDepartments();
    const index = departments.findIndex((d) => d.id === department.id);
    if (index >= 0) {
      departments[index] = department;
    } else {
      departments.push(department);
    }
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    this.logAudit({
      user_name: 'Admin',
      action: index >= 0 ? 'UPDATE_DEPARTMENT' : 'CREATE_DEPARTMENT',
      module: 'ORGANIZATION',
      record_id: department.id,
      after_data: department,
    });
  }

  public deleteDepartment(id: string): void {
    const departments = this.getDepartments().filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    this.logAudit({
      user_name: 'Admin',
      action: 'DELETE_DEPARTMENT',
      module: 'ORGANIZATION',
      record_id: id,
    });
  }

  // POSITIONS
  public getPositions(): Position[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.POSITIONS) || '[]');
  }

  public savePosition(position: Position): void {
    const positions = this.getPositions();
    const index = positions.findIndex((p) => p.id === position.id);
    if (index >= 0) {
      positions[index] = position;
    } else {
      positions.push(position);
    }
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
  }

  public deletePosition(id: string): void {
    const positions = this.getPositions().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
  }

  // SHIFTS
  public getShifts(): Shift[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS) || '[]');
  }

  public saveShift(shift: Shift): void {
    const shifts = this.getShifts();
    const index = shifts.findIndex((s) => s.id === shift.id);
    if (index >= 0) {
      shifts[index] = shift;
    } else {
      shifts.push(shift);
    }
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
    this.logAudit({
      user_name: 'Admin',
      action: index >= 0 ? 'UPDATE_SHIFT' : 'CREATE_SHIFT',
      module: 'SHIFTS',
      record_id: shift.id,
      after_data: shift,
    });
  }

  public deleteShift(id: string): void {
    const shifts = this.getShifts().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
    this.logAudit({
      user_name: 'Admin',
      action: 'DELETE_SHIFT',
      module: 'SHIFTS',
      record_id: id,
    });
  }

  // EMPLOYEES & USER CREDENTIALS MANAGEMENT
  public getEmployees(): Employee[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!raw) return [];
    try {
      const list: Employee[] = JSON.parse(raw);
      let needsSave = false;
      const normalized = list.map((emp) => {
        let updated = false;
        if (!emp.username) {
          const generatedUser = (emp.email ? emp.email.split('@')[0] : emp.employee_code)
            .replace(/[^a-zA-Z0-9._-]/g, '')
            .toLowerCase();
          emp.username = generatedUser || `user.${emp.employee_code.toLowerCase()}`;
          updated = true;
        }
        if (!emp.password) {
          emp.password = 'password123';
          updated = true;
        }
        if (emp.login_access_enabled === undefined) {
          emp.login_access_enabled = true;
          updated = true;
        }
        if (updated) needsSave = true;
        return emp;
      });
      if (needsSave) {
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return [];
    }
  }

  public getEmployeeById(id: string): Employee | undefined {
    return this.getEmployees().find((e) => e.id === id);
  }

  public checkUsernameExists(username: string, excludeEmployeeId?: string): boolean {
    const clean = username.trim().toLowerCase();
    return this.getEmployees().some(
      (e) => e.id !== excludeEmployeeId && e.username?.toLowerCase() === clean
    );
  }

  public generateRandomPassword(length: number = 10): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const specials = '!@#$%&*';
    const all = upper + lower + numbers + specials;

    let res = '';
    res += upper.charAt(Math.floor(Math.random() * upper.length));
    res += lower.charAt(Math.floor(Math.random() * lower.length));
    res += numbers.charAt(Math.floor(Math.random() * numbers.length));
    res += specials.charAt(Math.floor(Math.random() * specials.length));

    for (let i = res.length; i < length; i++) {
      res += all.charAt(Math.floor(Math.random() * all.length));
    }
    return res.split('').sort(() => 0.5 - Math.random()).join('');
  }

  public updateLoginCredentials(
    employeeId: string,
    credentials: {
      username: string;
      password?: string;
      login_access_enabled: boolean;
      role: UserRole;
      force_password_change?: boolean;
    },
    actorName?: string
  ): { success: boolean; error?: string } {
    const employees = this.getEmployees();
    const index = employees.findIndex((e) => e.id === employeeId);
    if (index === -1) {
      return { success: false, error: 'Karyawan tidak ditemukan.' };
    }

    const cleanUsername = credentials.username.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, error: 'Username tidak boleh kosong.' };
    }

    if (this.checkUsernameExists(cleanUsername, employeeId)) {
      return { success: false, error: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` };
    }

    const emp = employees[index];
    const oldAccess = emp.login_access_enabled;
    const oldRole = emp.role;
    const oldUsername = emp.username;

    emp.username = cleanUsername;
    if (credentials.password && credentials.password.trim()) {
      emp.password = credentials.password.trim();
    }
    emp.login_access_enabled = credentials.login_access_enabled;
    emp.role = credentials.role;
    if (credentials.force_password_change !== undefined) {
      emp.force_password_change = credentials.force_password_change;
    }

    employees[index] = emp;
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));

    this.logAudit({
      user_name: actorName || 'Admin',
      action: 'UPDATE_USER_CREDENTIALS',
      module: 'SECURITY',
      record_id: emp.id,
      before_data: { username: oldUsername, role: oldRole, login_access: oldAccess },
      after_data: {
        username: emp.username,
        role: emp.role,
        login_access: emp.login_access_enabled,
        password_changed: !!(credentials.password && credentials.password.trim()),
      },
    });

    return { success: true };
  }

  public verifyLogin(
    identifier: string,
    passwordInput: string
  ): { success: boolean; employee?: Employee; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const employees = this.getEmployees();

    // Match by username OR corporate email OR employee code
    const matched = employees.find(
      (e) =>
        e.username?.toLowerCase() === cleanId ||
        e.email?.toLowerCase() === cleanId ||
        e.employee_code?.toLowerCase() === cleanId
    );

    if (!matched) {
      return {
        success: false,
        error: 'Akun dengan username atau email tersebut tidak ditemukan dalam sistem.',
      };
    }

    // Check if login access is disabled
    if (matched.login_access_enabled === false) {
      return {
        success: false,
        error:
          'Hak akses login untuk akun ini telah dinonaktifkan oleh Administrator. Hubungi HR Department.',
      };
    }

    // Check password if provided or set
    const expectedPassword = matched.password || 'password123';
    if (passwordInput && passwordInput !== expectedPassword) {
      return {
        success: false,
        error: 'Password yang Anda masukkan salah. Periksa kembali atau hubungi Administrator.',
      };
    }

    // Record last login timestamp
    matched.last_login_at = new Date().toISOString();
    const idx = employees.findIndex((e) => e.id === matched.id);
    if (idx >= 0) {
      employees[idx] = matched;
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    }

    return { success: true, employee: matched };
  }

  public saveEmployee(employee: Employee): void {
    const employees = this.getEmployees();
    const index = employees.findIndex((e) => e.id === employee.id);

    // Enrich with denormalized names for fast rendering
    const branch = this.getBranches().find((b) => b.id === employee.branch_id);
    const dept = this.getDepartments().find((d) => d.id === employee.department_id);
    const pos = this.getPositions().find((p) => p.id === employee.position_id);
    const mgr = employee.manager_id ? employees.find((m) => m.id === employee.manager_id) : undefined;

    const cleanUsername = employee.username?.trim().toLowerCase() ||
      (employee.email ? employee.email.split('@')[0] : employee.employee_code).replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();

    const enriched: Employee = {
      ...employee,
      username: cleanUsername,
      password: employee.password || 'password123',
      login_access_enabled: employee.login_access_enabled ?? true,
      branch_name: branch?.name || employee.branch_name,
      department_name: dept?.name || employee.department_name,
      position_name: pos?.name || employee.position_name,
      manager_name: mgr ? mgr.full_name : employee.manager_name,
    };

    if (index >= 0) {
      employees[index] = enriched;
    } else {
      employees.unshift(enriched);
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    this.logAudit({
      user_name: 'Admin',
      action: index >= 0 ? 'UPDATE_EMPLOYEE' : 'CREATE_EMPLOYEE',
      module: 'EMPLOYEE',
      record_id: employee.id,
      after_data: { name: employee.full_name, role: employee.role, email: employee.email, username: enriched.username },
    });
  }

  public deleteEmployee(id: string): void {
    const employees = this.getEmployees().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    this.logAudit({
      user_name: 'Admin',
      action: 'DELETE_EMPLOYEE',
      module: 'EMPLOYEE',
      record_id: id,
    });
  }

  // ATTENDANCE LOCATIONS
  public getLocations(): AttendanceLocation[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCATIONS) || '[]');
  }

  // ATTENDANCE RECORDS
  public getAttendanceRecords(): AttendanceRecord[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
  }

  public getTodayAttendance(employeeId: string, dateStr: string): AttendanceRecord | undefined {
    const records = this.getAttendanceRecords();
    return records.find((r) => r.employee_id === employeeId && r.attendance_date === dateStr);
  }

  public saveAttendance(record: AttendanceRecord): void {
    const records = this.getAttendanceRecords();
    const index = records.findIndex((r) => r.id === record.id);

    // Enrich with names
    const employee = this.getEmployeeById(record.employee_id);
    const shifts = this.getShifts();
    const shift = shifts.find((s) => s.id === record.shift_id);

    const enriched: AttendanceRecord = {
      ...record,
      employee_name: employee?.full_name || record.employee_name,
      employee_code: employee?.employee_code || record.employee_code,
      department_name: employee?.department_name || record.department_name,
      branch_name: employee?.branch_name || record.branch_name,
      shift_name: shift?.name || record.shift_name,
    };

    if (index >= 0) {
      records[index] = enriched;
    } else {
      records.unshift(enriched);
    }
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  }

  // ==========================================
  // PHASE 2 METHODS: LEAVE, PERMISSION, OVERTIME & APPROVALS
  // ==========================================

  // LEAVE TYPES & BALANCES
  public getLeaveTypes(): LeaveType[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVE_TYPES) || '[]');
  }

  public getLeaveBalances(employeeId?: string): LeaveBalance[] {
    const balances: LeaveBalance[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.LEAVE_BALANCES) || '[]'
    );
    if (employeeId) {
      return balances.filter((b) => b.employee_id === employeeId);
    }
    return balances;
  }

  // LEAVE REQUESTS
  public getLeaveRequests(): LeaveRequest[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS) || '[]');
  }

  public saveLeaveRequest(req: LeaveRequest): void {
    const list = this.getLeaveRequests();
    const index = list.findIndex((r) => r.id === req.id);

    // Enrich with names
    const emp = this.getEmployeeById(req.employee_id);
    const lt = this.getLeaveTypes().find((l) => l.id === req.leave_type_id);

    const enriched: LeaveRequest = {
      ...req,
      employee_name: emp?.full_name || req.employee_name,
      employee_code: emp?.employee_code || req.employee_code,
      department_name: emp?.department_name || req.department_name,
      branch_name: emp?.branch_name || req.branch_name,
      leave_type_name: lt?.name || req.leave_type_name,
    };

    if (index >= 0) {
      list[index] = enriched;
    } else {
      list.unshift(enriched);

      // Increase pending in balance
      const balances = this.getLeaveBalances();
      const balIndex = balances.findIndex(
        (b) => b.employee_id === req.employee_id && b.leave_type_id === req.leave_type_id
      );
      if (balIndex >= 0) {
        balances[balIndex].pending += req.total_days;
        balances[balIndex].remaining =
          balances[balIndex].entitlement - balances[balIndex].used - balances[balIndex].pending;
        localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCES, JSON.stringify(balances));
      }
    }
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(list));

    this.logAudit({
      user_name: enriched.employee_name || 'Employee',
      action: 'SUBMIT_LEAVE_REQUEST',
      module: 'LEAVE',
      record_id: req.id,
      after_data: { type: enriched.leave_type_name, days: req.total_days },
    });
  }

  public processLeaveApproval(
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    approver: Employee,
    comment: string
  ): void {
    const list = this.getLeaveRequests();
    const target = list.find((r) => r.id === requestId);
    if (!target) return;

    const previousStatus = target.status;
    target.status = status;
    target.approver_name = approver.full_name;
    target.approver_comment = comment;

    // Balance update
    const balances = this.getLeaveBalances();
    const balIndex = balances.findIndex(
      (b) => b.employee_id === target.employee_id && b.leave_type_id === target.leave_type_id
    );

    if (balIndex >= 0) {
      if (status === 'APPROVED') {
        balances[balIndex].pending = Math.max(0, balances[balIndex].pending - target.total_days);
        balances[balIndex].used += target.total_days;
      } else if (status === 'REJECTED') {
        balances[balIndex].pending = Math.max(0, balances[balIndex].pending - target.total_days);
      }
      balances[balIndex].remaining =
        balances[balIndex].entitlement - balances[balIndex].used - balances[balIndex].pending;
      localStorage.setItem(STORAGE_KEYS.LEAVE_BALANCES, JSON.stringify(balances));
    }

    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(list));

    // Log to Approval Log
    this.addApprovalLog({
      request_type: 'LEAVE',
      request_id: target.id,
      approver_id: approver.id,
      approver_name: approver.full_name,
      approver_role: approver.role,
      previous_status: previousStatus,
      new_status: status,
      comment,
    });

    this.logAudit({
      user_name: approver.full_name,
      action: `LEAVE_${status}`,
      module: 'LEAVE',
      record_id: target.id,
      after_data: { comment, employee: target.employee_name },
    });
  }

  // PERMISSION REQUESTS
  public getPermissionRequests(): PermissionRequest[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PERMISSION_REQUESTS) || '[]');
  }

  public savePermissionRequest(req: PermissionRequest): void {
    const list = this.getPermissionRequests();
    const index = list.findIndex((r) => r.id === req.id);
    const emp = this.getEmployeeById(req.employee_id);

    const enriched: PermissionRequest = {
      ...req,
      employee_name: emp?.full_name || req.employee_name,
      employee_code: emp?.employee_code || req.employee_code,
      department_name: emp?.department_name || req.department_name,
    };

    if (index >= 0) {
      list[index] = enriched;
    } else {
      list.unshift(enriched);
    }
    localStorage.setItem(STORAGE_KEYS.PERMISSION_REQUESTS, JSON.stringify(list));

    this.logAudit({
      user_name: enriched.employee_name || 'Employee',
      action: 'SUBMIT_PERMISSION_REQUEST',
      module: 'PERMISSION',
      record_id: req.id,
      after_data: { type: req.permission_type, reason: req.reason },
    });
  }

  public processPermissionApproval(
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    approver: Employee,
    comment: string
  ): void {
    const list = this.getPermissionRequests();
    const target = list.find((r) => r.id === requestId);
    if (!target) return;

    const prev = target.status;
    target.status = status;
    target.approver_name = approver.full_name;
    target.approver_comment = comment;

    localStorage.setItem(STORAGE_KEYS.PERMISSION_REQUESTS, JSON.stringify(list));

    this.addApprovalLog({
      request_type: 'PERMISSION',
      request_id: target.id,
      approver_id: approver.id,
      approver_name: approver.full_name,
      approver_role: approver.role,
      previous_status: prev,
      new_status: status,
      comment,
    });

    this.logAudit({
      user_name: approver.full_name,
      action: `PERMISSION_${status}`,
      module: 'PERMISSION',
      record_id: target.id,
      after_data: { comment, employee: target.employee_name },
    });
  }

  // OVERTIME REQUESTS
  public getOvertimeRequests(): OvertimeRequest[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.OVERTIME_REQUESTS) || '[]');
  }

  public saveOvertimeRequest(req: OvertimeRequest): void {
    const list = this.getOvertimeRequests();
    const index = list.findIndex((r) => r.id === req.id);
    const emp = this.getEmployeeById(req.employee_id);

    const enriched: OvertimeRequest = {
      ...req,
      employee_name: emp?.full_name || req.employee_name,
      employee_code: emp?.employee_code || req.employee_code,
      department_name: emp?.department_name || req.department_name,
    };

    if (index >= 0) {
      list[index] = enriched;
    } else {
      list.unshift(enriched);
    }
    localStorage.setItem(STORAGE_KEYS.OVERTIME_REQUESTS, JSON.stringify(list));

    this.logAudit({
      user_name: enriched.employee_name || 'Employee',
      action: 'SUBMIT_OVERTIME_REQUEST',
      module: 'OVERTIME',
      record_id: req.id,
      after_data: { hours: req.duration_hours, project: req.project_name },
    });
  }

  public processOvertimeApproval(
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    approver: Employee,
    comment: string
  ): void {
    const list = this.getOvertimeRequests();
    const target = list.find((r) => r.id === requestId);
    if (!target) return;

    const prev = target.status;
    target.status = status;
    target.approver_name = approver.full_name;
    target.approver_comment = comment;

    localStorage.setItem(STORAGE_KEYS.OVERTIME_REQUESTS, JSON.stringify(list));

    this.addApprovalLog({
      request_type: 'OVERTIME',
      request_id: target.id,
      approver_id: approver.id,
      approver_name: approver.full_name,
      approver_role: approver.role,
      previous_status: prev,
      new_status: status,
      comment,
    });

    this.logAudit({
      user_name: approver.full_name,
      action: `OVERTIME_${status}`,
      module: 'OVERTIME',
      record_id: target.id,
      after_data: { comment, employee: target.employee_name },
    });
  }

  // APPROVAL LOGS
  public getApprovalLogs(requestId?: string): ApprovalLog[] {
    const logs: ApprovalLog[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.APPROVAL_LOGS) || '[]'
    );
    if (requestId) {
      return logs.filter((l) => l.request_id === requestId);
    }
    return logs;
  }

  private addApprovalLog(log: Omit<ApprovalLog, 'id' | 'created_at'>): void {
    const logs: ApprovalLog[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.APPROVAL_LOGS) || '[]'
    );
    const newLog: ApprovalLog = {
      ...log,
      id: `al-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.APPROVAL_LOGS, JSON.stringify(logs));
  }

  // Pending Approvals Counter for Badge
  public getPendingApprovalsCount(user: Employee): number {
    const isSuperOrHr = user.role === 'SUPER_ADMIN' || user.role === 'HR_ADMIN';
    const isManager = user.role === 'MANAGER';

    if (!isSuperOrHr && !isManager) return 0;

    const leave = this.getLeaveRequests().filter((r) => {
      if (r.status !== 'PENDING') return false;
      if (isSuperOrHr) return true;
      return r.current_approver_id === user.id;
    });

    const perm = this.getPermissionRequests().filter((r) => {
      if (r.status !== 'PENDING') return false;
      if (isSuperOrHr) return true;
      return r.current_approver_id === user.id;
    });

    const ot = this.getOvertimeRequests().filter((r) => {
      if (r.status !== 'PENDING') return false;
      if (isSuperOrHr) return true;
      return r.current_approver_id === user.id;
    });

    const cor = this.getAttendanceCorrections().filter((c) => {
      if (c.status !== 'PENDING') return false;
      if (isSuperOrHr) return true;
      return c.approver_id === user.id;
    });

    const trips = this.getBusinessTrips().filter((t) => {
      if (t.status !== 'PENDING') return false;
      if (isSuperOrHr) return true;
      return t.current_approver_id === user.id;
    });

    return leave.length + perm.length + ot.length + cor.length + trips.length;
  }

  // ==========================================
  // PHASE 3 METHODS: HOLIDAYS, CORRECTIONS & PAYROLL
  // ==========================================

  // HOLIDAYS
  public getHolidays(): Holiday[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HOLIDAYS) || '[]');
  }

  public saveHoliday(holiday: Holiday): void {
    const list = this.getHolidays();
    const index = list.findIndex((h) => h.id === holiday.id);
    if (index >= 0) {
      list[index] = holiday;
    } else {
      list.push(holiday);
    }
    // Sort chronologically
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(list));
    this.logAudit({
      user_name: 'Admin',
      action: index >= 0 ? 'UPDATE_HOLIDAY' : 'CREATE_HOLIDAY',
      module: 'HOLIDAY',
      record_id: holiday.id,
      after_data: { name: holiday.name, date: holiday.date },
    });
  }

  public deleteHoliday(id: string): void {
    const list = this.getHolidays().filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(list));
  }

  // ATTENDANCE CORRECTIONS
  public getAttendanceCorrections(): AttendanceCorrection[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CORRECTIONS) || '[]');
  }

  public saveAttendanceCorrection(req: AttendanceCorrection): void {
    const list = this.getAttendanceCorrections();
    const index = list.findIndex((c) => c.id === req.id);
    const emp = this.getEmployeeById(req.employee_id);

    const enriched: AttendanceCorrection = {
      ...req,
      employee_name: emp?.full_name || req.employee_name,
      employee_code: emp?.employee_code || req.employee_code,
      department_name: emp?.department_name || req.department_name,
      branch_name: emp?.branch_name || req.branch_name,
    };

    if (index >= 0) {
      list[index] = enriched;
    } else {
      list.unshift(enriched);
    }
    localStorage.setItem(STORAGE_KEYS.CORRECTIONS, JSON.stringify(list));

    this.logAudit({
      user_name: enriched.employee_name || 'Employee',
      action: 'SUBMIT_ATTENDANCE_CORRECTION',
      module: 'ATTENDANCE',
      record_id: req.id,
      after_data: { date: req.attendance_date, type: req.correction_type },
    });
  }

  public processCorrectionApproval(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    approver: Employee,
    comment: string
  ): void {
    const list = this.getAttendanceCorrections();
    const target = list.find((c) => c.id === id);
    if (!target) return;

    const prev = target.status;
    target.status = status;
    target.approver_name = approver.full_name;
    target.approver_comment = comment;

    localStorage.setItem(STORAGE_KEYS.CORRECTIONS, JSON.stringify(list));

    // When approved, update or create the attendance record
    if (status === 'APPROVED') {
      const records = this.getAttendanceRecords();
      let att = records.find(
        (r) => r.employee_id === target.employee_id && r.attendance_date === target.attendance_date
      );

      const [inH, inM] = target.requested_clock_in.split(':').map(Number);
      const [outH, outM] = target.requested_clock_out.split(':').map(Number);

      const inDate = new Date(`${target.attendance_date}T${target.requested_clock_in}:00Z`);
      const outDate = new Date(`${target.attendance_date}T${target.requested_clock_out}:00Z`);
      const durMinutes = Math.max(0, Math.floor((outDate.getTime() - inDate.getTime()) / (1000 * 60)));

      if (att) {
        att.clock_in_time = inDate.toISOString();
        att.clock_out_time = outDate.toISOString();
        att.work_duration_minutes = durMinutes;
        att.notes = `[Corrected on approval by ${approver.full_name}] ${target.reason}`;
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-cor-${Date.now()}`,
          employee_id: target.employee_id,
          attendance_date: target.attendance_date,
          clock_in_time: inDate.toISOString(),
          clock_out_time: outDate.toISOString(),
          clock_in_status: 'present',
          late_minutes: 0,
          early_checkout_minutes: 0,
          work_duration_minutes: durMinutes,
          overtime_minutes: 0,
          is_outside_geofence: false,
          approval_status: 'APPROVED',
          notes: `[Correction approved by ${approver.full_name}] ${target.reason}`,
        };
        records.push(newRecord);
      }
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    }

    this.addApprovalLog({
      request_type: 'CORRECTION',
      request_id: target.id,
      approver_id: approver.id,
      approver_name: approver.full_name,
      approver_role: approver.role,
      previous_status: prev,
      new_status: status,
      comment,
    });

    this.logAudit({
      user_name: approver.full_name,
      action: `CORRECTION_${status}`,
      module: 'ATTENDANCE',
      record_id: target.id,
      after_data: { comment, employee: target.employee_name },
    });
  }

  // PAYROLL & REPORT AGGREGATOR
  public generatePayrollSummary(
    month: number, // 1-12
    year: number,
    branchId?: string,
    departmentId?: string
  ): PayrollAttendanceSummary[] {
    const employees = this.getEmployees().filter((e) => e.employment_status === 'Active');
    const attendance = this.getAttendanceRecords();
    const leaves = this.getLeaveRequests();
    const permissions = this.getPermissionRequests();
    const overtimes = this.getOvertimeRequests();

    const standardWorkdays = 22; // Average business days per month

    return employees
      .filter((e) => {
        if (branchId && branchId !== 'all' && e.branch_id !== branchId) return false;
        if (departmentId && departmentId !== 'all' && e.department_id !== departmentId) return false;
        return true;
      })
      .map((emp) => {
        // Attendance records in that month
        const empAtt = attendance.filter((a) => {
          if (a.employee_id !== emp.id) return false;
          const [aY, aM] = a.attendance_date.split('-').map(Number);
          return aY === year && aM === month;
        });

        const presentCount = empAtt.filter((a) => a.clock_in_status === 'present').length;
        const lateCount = empAtt.filter((a) => a.clock_in_status === 'late').length;
        const earlyCheckoutCount = empAtt.filter((a) => a.early_checkout_minutes > 15).length;

        // Approved leaves in that month
        const empLeaves = leaves.filter((l) => {
          if (l.employee_id !== emp.id || l.status !== 'APPROVED') return false;
          const [lY, lM] = l.start_date.split('-').map(Number);
          return lY === year && lM === month;
        });
        const annualLeaveDays = empLeaves
          .filter((l) => l.leave_type_name?.toLowerCase().includes('annual'))
          .reduce((sum, curr) => sum + curr.total_days, 0);
        const sickLeaveDays = empLeaves
          .filter((l) => l.leave_type_name?.toLowerCase().includes('sick'))
          .reduce((sum, curr) => sum + curr.total_days, 0);

        // Permissions in that month
        const empPerms = permissions.filter((p) => {
          if (p.employee_id !== emp.id || p.status !== 'APPROVED') return false;
          const [pY, pM] = p.permission_date.split('-').map(Number);
          return pY === year && pM === month;
        }).length;

        // Overtime in that month
        const empOts = overtimes.filter((o) => {
          if (o.employee_id !== emp.id || o.status !== 'APPROVED') return false;
          const [oY, oM] = o.overtime_date.split('-').map(Number);
          return oY === year && oM === month;
        });
        const totalOtHours = empOts.reduce((sum, curr) => sum + curr.duration_hours, 0);

        const attendedDays = presentCount + lateCount + annualLeaveDays + sickLeaveDays;
        const absentCount = Math.max(0, standardWorkdays - attendedDays);

        return {
          employee_id: emp.id,
          employee_code: emp.employee_code,
          employee_name: emp.full_name,
          department_name: emp.department_name || '-',
          branch_name: emp.branch_name || '-',
          working_days: standardWorkdays,
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          leave: annualLeaveDays,
          sick: sickLeaveDays,
          permission: empPerms,
          overtime_hours: parseFloat(totalOtHours.toFixed(1)),
          early_checkout: earlyCheckoutCount,
          unpaid_leave: 0,
        };
      });
  }

  // Real CSV Exporter with BOM for Excel compatibility
  public exportToCsv(
    filename: string,
    headers: string[],
    rows: (string | number)[][]
  ): void {
    const csvContent =
      '\uFEFF' +
      [
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ==========================================
  // BUSINESS TRIPS (DINAS LUAR KOTA / SPPD)
  // ==========================================
  public getBusinessTrips(): BusinessTripRequest[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BUSINESS_TRIPS) || '[]');
  }

  public saveBusinessTrip(req: BusinessTripRequest): void {
    const list = this.getBusinessTrips();
    const index = list.findIndex((t) => t.id === req.id);
    const emp = this.getEmployeeById(req.employee_id);

    const enriched: BusinessTripRequest = {
      ...req,
      employee_name: emp?.full_name || req.employee_name,
      employee_code: emp?.employee_code || req.employee_code,
      department_name: emp?.department_name || req.department_name,
      branch_name: emp?.branch_name || req.branch_name,
    };

    if (index >= 0) {
      list[index] = enriched;
    } else {
      list.unshift(enriched);
    }
    localStorage.setItem(STORAGE_KEYS.BUSINESS_TRIPS, JSON.stringify(list));

    // Notify approver
    if (enriched.current_approver_id) {
      this.addNotification({
        user_id: enriched.current_approver_id,
        title: 'New Business Trip Request',
        message: `${enriched.employee_name} submitted a ${enriched.total_days}-day business trip to ${enriched.destination_city}.`,
        type: 'ACTION_REQUIRED',
        target_tab: 'approvals-hub',
        read: false,
      });
    }

    this.logAudit({
      user_name: enriched.employee_name || 'Employee',
      action: 'SUBMIT_BUSINESS_TRIP',
      module: 'BUSINESS_TRIP',
      record_id: req.id,
      after_data: { destination: req.destination_city, days: req.total_days, cost: req.estimated_cost },
    });
  }

  public processBusinessTripApproval(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    approver: Employee,
    comment: string
  ): void {
    const list = this.getBusinessTrips();
    const target = list.find((t) => t.id === id);
    if (!target) return;

    const prev = target.status;
    target.status = status;
    target.approver_name = approver.full_name;
    target.approver_comment = comment;

    localStorage.setItem(STORAGE_KEYS.BUSINESS_TRIPS, JSON.stringify(list));

    // If approved, seed attendance days with 'business_trip'
    if (status === 'APPROVED') {
      const records = this.getAttendanceRecords();
      const start = new Date(target.start_date);
      const end = new Date(target.end_date);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const existing = records.find(
          (r) => r.employee_id === target.employee_id && r.attendance_date === dateStr
        );
        if (!existing) {
          records.push({
            id: `att-trip-${Date.now()}-${dateStr}`,
            employee_id: target.employee_id,
            attendance_date: dateStr,
            clock_in_status: 'business_trip',
            clock_in_location_name: `SPPD: ${target.destination_city}`,
            clock_out_location_name: `SPPD: ${target.destination_city}`,
            late_minutes: 0,
            early_checkout_minutes: 0,
            work_duration_minutes: 480, // Standard 8 hours
            overtime_minutes: 0,
            is_outside_geofence: false,
            approval_status: 'APPROVED',
            notes: `[Business Trip SPPD Approved by ${approver.full_name}] Destination: ${target.destination_city}. Purpose: ${target.purpose}`,
          });
        }
      }
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    }

    // Notify employee of decision
    this.addNotification({
      user_id: target.employee_id,
      title: `Business Trip ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      message: `Your trip to ${target.destination_city} has been ${status.toLowerCase()} by ${approver.full_name}.`,
      type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      target_tab: 'business-trip',
      read: false,
    });

    this.addApprovalLog({
      request_type: 'LEAVE', // maps to log
      request_id: target.id,
      approver_id: approver.id,
      approver_name: approver.full_name,
      approver_role: approver.role,
      previous_status: prev,
      new_status: status,
      comment,
    });

    this.logAudit({
      user_name: approver.full_name,
      action: `BUSINESS_TRIP_${status}`,
      module: 'BUSINESS_TRIP',
      record_id: target.id,
      after_data: { comment, employee: target.employee_name, destination: target.destination_city },
    });
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  public getNotifications(userId: string): AppNotification[] {
    const list: AppNotification[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    return list.filter((n) => n.user_id === userId || n.user_id === 'ALL');
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'created_at'>): void {
    const list: AppNotification[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    list.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  }

  public markNotificationAsRead(id: string): void {
    const list: AppNotification[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    const target = list.find((n) => n.id === id);
    if (target) {
      target.read = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    const list: AppNotification[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    list.forEach((n) => {
      if (n.user_id === userId || n.user_id === 'ALL') {
        n.read = true;
      }
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  }

  // ==========================================
  // WORK SCHEDULES
  // ==========================================
  public getWorkSchedules(employeeId?: string): WorkScheduleAssignment[] {
    const list: WorkScheduleAssignment[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.WORK_SCHEDULES) || '[]'
    );
    if (employeeId && employeeId !== 'all') {
      return list.filter((s) => s.employee_id === employeeId);
    }
    return list;
  }

  public saveWorkSchedule(item: WorkScheduleAssignment): void {
    const list = this.getWorkSchedules();
    const index = list.findIndex((s) => s.id === item.id);
    const emp = this.getEmployeeById(item.employee_id);
    const enriched: WorkScheduleAssignment = {
      ...item,
      employee_name: emp?.full_name || item.employee_name,
    };
    if (index >= 0) {
      list[index] = enriched;
    } else {
      list.push(enriched);
    }
    localStorage.setItem(STORAGE_KEYS.WORK_SCHEDULES, JSON.stringify(list));
  }

  // ==========================================
  // PHASE 4: SALARY PROFILES & PAYROLL ENGINE
  // ==========================================
  public getSalaryProfiles(): EmployeeSalaryProfile[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALARY_PROFILES) || '[]');
  }

  public getSalaryProfile(employeeId: string): EmployeeSalaryProfile {
    const list = this.getSalaryProfiles();
    const existing = list.find((p) => p.employee_id === employeeId);
    if (existing) return existing;

    // Fallback default structure based on employee
    const emp = this.getEmployeeById(employeeId);
    let base = 12000000;
    let pos = 1500000;
    if (emp?.role === 'SUPER_ADMIN') {
      base = 35000000;
      pos = 8000000;
    } else if (emp?.role === 'HR_ADMIN') {
      base = 22000000;
      pos = 4500000;
    } else if (emp?.role === 'MANAGER') {
      base = 24000000;
      pos = 5000000;
    }

    const defaultProfile: EmployeeSalaryProfile = {
      employee_id: employeeId,
      base_salary: base,
      position_allowance: pos,
      transport_allowance: 1200000,
      meal_allowance: 1100000,
      communication_allowance: 300000,
      bank_name: 'Bank Central Asia (BCA)',
      bank_account_number: '800' + Math.floor(1000000 + Math.random() * 9000000),
      bank_account_holder: emp?.full_name || 'Employee',
      npwp: '72.910.492.1-013.000',
      bpjs_tk_number: '21098492019',
      bpjs_kes_number: '000192837482',
      ptkp_status: 'TK/0',
    };
    return defaultProfile;
  }

  public saveSalaryProfile(profile: EmployeeSalaryProfile): void {
    const list = this.getSalaryProfiles();
    const idx = list.findIndex((p) => p.employee_id === profile.employee_id);
    if (idx >= 0) {
      list[idx] = profile;
    } else {
      list.push(profile);
    }
    localStorage.setItem(STORAGE_KEYS.SALARY_PROFILES, JSON.stringify(list));
  }

  public getPayrollBatches(): PayrollBatch[] {
    const list: PayrollBatch[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PAYROLL_BATCHES) || '[]'
    );
    return list.sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month));
  }

  public getPayrollBatch(id: string): PayrollBatch | undefined {
    return this.getPayrollBatches().find((b) => b.id === id);
  }

  public getPayrollItems(batchId?: string): PayrollItem[] {
    const list: PayrollItem[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PAYROLL_ITEMS) || '[]'
    );
    if (batchId) {
      return list.filter((i) => i.payroll_batch_id === batchId);
    }
    return list;
  }

  public getEmployeePayrollItems(employeeId: string): PayrollItem[] {
    return this.getPayrollItems().filter((i) => i.employee_id === employeeId);
  }

  // Indonesian PPh 21 TER 2024 Category A Estimator
  private calculatePph21Ter(grossMonthly: number): number {
    if (grossMonthly <= 5400000) return 0;
    if (grossMonthly <= 5650000) return Math.round(grossMonthly * 0.0025);
    if (grossMonthly <= 5950000) return Math.round(grossMonthly * 0.005);
    if (grossMonthly <= 6300000) return Math.round(grossMonthly * 0.0075);
    if (grossMonthly <= 6750000) return Math.round(grossMonthly * 0.01);
    if (grossMonthly <= 7500000) return Math.round(grossMonthly * 0.0125);
    if (grossMonthly <= 8550000) return Math.round(grossMonthly * 0.015);
    if (grossMonthly <= 9650000) return Math.round(grossMonthly * 0.0175);
    if (grossMonthly <= 10050000) return Math.round(grossMonthly * 0.02);
    if (grossMonthly <= 10350000) return Math.round(grossMonthly * 0.0225);
    if (grossMonthly <= 10700000) return Math.round(grossMonthly * 0.025);
    if (grossMonthly <= 11050000) return Math.round(grossMonthly * 0.03);
    if (grossMonthly <= 11600000) return Math.round(grossMonthly * 0.035);
    if (grossMonthly <= 12500000) return Math.round(grossMonthly * 0.04);
    if (grossMonthly <= 13750000) return Math.round(grossMonthly * 0.05);
    if (grossMonthly <= 15100000) return Math.round(grossMonthly * 0.06);
    if (grossMonthly <= 16950000) return Math.round(grossMonthly * 0.07);
    if (grossMonthly <= 19750000) return Math.round(grossMonthly * 0.08);
    if (grossMonthly <= 24150000) return Math.round(grossMonthly * 0.09);
    if (grossMonthly <= 26450000) return Math.round(grossMonthly * 0.1);
    if (grossMonthly <= 28000000) return Math.round(grossMonthly * 0.11);
    if (grossMonthly <= 30050000) return Math.round(grossMonthly * 0.12);
    if (grossMonthly <= 32400000) return Math.round(grossMonthly * 0.13);
    if (grossMonthly <= 35400000) return Math.round(grossMonthly * 0.14);
    if (grossMonthly <= 39100000) return Math.round(grossMonthly * 0.15);
    if (grossMonthly <= 43850000) return Math.round(grossMonthly * 0.16);
    return Math.round(grossMonthly * 0.18);
  }

  public calculatePayrollForEmployee(
    employeeId: string,
    month: number,
    year: number,
    batchId: string
  ): PayrollItem {
    const emp = this.getEmployeeById(employeeId);
    const profile = this.getSalaryProfile(employeeId);

    // Attendance records for this employee in month/year
    const attRecords = this.getAttendanceRecords().filter((a) => {
      if (a.employee_id !== employeeId) return false;
      const [y, m] = a.attendance_date.split('-').map(Number);
      return y === year && m === month;
    });

    const workDays = 22;
    const presentDays = attRecords.length > 0 ? attRecords.length : 22;
    const lateMinutes = attRecords.reduce((acc, curr) => acc + (curr.late_minutes || 0), 0);

    // Overtime from approved requests
    const approvedOT = this.getOvertimeRequests().filter((ot) => {
      if (ot.employee_id !== employeeId || ot.status !== 'APPROVED') return false;
      const [y, m] = ot.overtime_date.split('-').map(Number);
      return y === year && m === month;
    });
    const overtimeHours = approvedOT.reduce((acc, curr) => acc + curr.duration_hours, 0) || (employeeId === 'emp-06' ? 4 : 0);

    // Depnaker overtime formula: (Gaji Pokok + Tunjangan Tetap) / 173 * 1.5 * overtimeHours
    const hourlyRate = (profile.base_salary + profile.position_allowance) / 173;
    const overtimePay = Math.round(hourlyRate * 1.5 * overtimeHours);

    // Deductions
    const lateDeduction = lateMinutes > 0 ? Math.floor(lateMinutes / 15) * 50000 : 0;
    const unpaidDays = Math.max(0, workDays - presentDays);
    const absenceDeduction = Math.round(unpaidDays * (profile.base_salary / 22));

    const grossIncome =
      profile.base_salary +
      profile.position_allowance +
      profile.transport_allowance +
      profile.meal_allowance +
      profile.communication_allowance +
      overtimePay;

    // BPJS
    const bpjsKesCeiling = 12000000;
    const bpjsJpCeiling = 10042300;
    const bpjsKesEmp = Math.round(Math.min(profile.base_salary, bpjsKesCeiling) * 0.01);
    const bpjsTkJhtEmp = Math.round(profile.base_salary * 0.02);
    const bpjsTkJpEmp = Math.round(Math.min(profile.base_salary, bpjsJpCeiling) * 0.01);

    const pph21 = this.calculatePph21Ter(grossIncome);
    const totalDeductions =
      lateDeduction + absenceDeduction + bpjsKesEmp + bpjsTkJhtEmp + bpjsTkJpEmp + pph21;

    const takeHomePay = grossIncome - totalDeductions;

    // Company contributions
    const bpjsKesComp = Math.round(Math.min(profile.base_salary, bpjsKesCeiling) * 0.04);
    const bpjsTkJhtComp = Math.round(profile.base_salary * 0.037);
    const bpjsTkJkkComp = Math.round(profile.base_salary * 0.0024);
    const bpjsTkJkmComp = Math.round(profile.base_salary * 0.003);
    const bpjsTkJpComp = Math.round(Math.min(profile.base_salary, bpjsJpCeiling) * 0.02);

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const periodLabel = `${monthNames[month - 1]} ${year}`;
    const code = emp?.employee_code?.replace('-', '') || employeeId.toUpperCase();
    const mm = month < 10 ? `0${month}` : `${month}`;

    return {
      id: `item-${year}-${mm}-${employeeId}`,
      payroll_batch_id: batchId,
      employee_id: employeeId,
      employee_code: emp?.employee_code || 'EMP-000',
      employee_name: emp?.full_name || 'Employee',
      department_name: emp?.department_name || 'General Operations',
      position_name: emp?.position_name || 'Staff',
      branch_name: emp?.branch_name || 'Head Office',
      month,
      year,
      period_label: periodLabel,
      work_days: workDays,
      present_days: presentDays,
      late_minutes: lateMinutes,
      unpaid_days: unpaidDays,
      overtime_hours: overtimeHours,
      base_salary: profile.base_salary,
      position_allowance: profile.position_allowance,
      transport_allowance: profile.transport_allowance,
      meal_allowance: profile.meal_allowance,
      communication_allowance: profile.communication_allowance,
      overtime_pay: overtimePay,
      bonus: 0,
      other_earnings: 0,
      gross_income: grossIncome,
      late_deduction: lateDeduction,
      absence_deduction: absenceDeduction,
      bpjs_kes_employee: bpjsKesEmp,
      bpjs_tk_jht_employee: bpjsTkJhtEmp,
      bpjs_tk_jp_employee: bpjsTkJpEmp,
      pph21,
      loan_deduction: 0,
      other_deductions: 0,
      total_deductions: totalDeductions,
      take_home_pay: takeHomePay,
      bpjs_kes_company: bpjsKesComp,
      bpjs_tk_jht_company: bpjsTkJhtComp,
      bpjs_tk_jkk_company: bpjsTkJkkComp,
      bpjs_tk_jkm_company: bpjsTkJkmComp,
      bpjs_tk_jp_company: bpjsTkJpComp,
      status: 'DRAFT',
      slip_number: `SLIP/${year}/${mm}/${code}`,
      bank_name: profile.bank_name,
      bank_account_number: profile.bank_account_number,
    };
  }

  public generatePayrollBatch(month: number, year: number, notes?: string): PayrollBatch {
    const batches = this.getPayrollBatches();
    const mm = month < 10 ? `0${month}` : `${month}`;
    const batchId = `batch-${year}-${mm}`;

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const periodLabel = `${monthNames[month - 1]} ${year}`;

    // Get active employees
    const employees = this.getEmployees().filter((e) => e.employment_status === 'Active');
    const existingItems = this.getPayrollItems();
    const newItems: PayrollItem[] = [];

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    employees.forEach((emp) => {
      const item = this.calculatePayrollForEmployee(emp.id, month, year, batchId);
      newItems.push(item);
      totalGross += item.gross_income;
      totalDeductions += item.total_deductions;
      totalNet += item.take_home_pay;
    });

    const newBatch: PayrollBatch = {
      id: batchId,
      month,
      year,
      period_label: periodLabel,
      cut_off_start: `${year}-${mm}-01`,
      cut_off_end: `${year}-${mm}-25`,
      payment_date: `${year}-${mm}-28`,
      total_employees: employees.length,
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_net_payroll: totalNet,
      status: 'DRAFT',
      notes: notes || `Batch payroll periode ${periodLabel} berhasil digenerate otomatis.`,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    // Save batch
    const batchIndex = batches.findIndex((b) => b.id === batchId);
    if (batchIndex >= 0) {
      batches[batchIndex] = newBatch;
    } else {
      batches.unshift(newBatch);
    }
    localStorage.setItem(STORAGE_KEYS.PAYROLL_BATCHES, JSON.stringify(batches));

    // Save items (replace any previous items for this batch)
    const filteredItems = existingItems.filter((i) => i.payroll_batch_id !== batchId);
    const updatedItems = [...newItems, ...filteredItems];
    localStorage.setItem(STORAGE_KEYS.PAYROLL_ITEMS, JSON.stringify(updatedItems));

    // Log audit
    this.logAudit({
      user_name: 'Triyanto Andi',
      action: 'GENERATE_PAYROLL_BATCH',
      module: 'PAYROLL',
      record_id: batchId,
    });

    // Notify HR & Finance
    this.addNotification({
      user_id: 'ALL',
      title: `Draft Payroll ${periodLabel} Diterbitkan`,
      message: `Batch payroll periode ${periodLabel} telah selesai dihitung untuk ${employees.length} karyawan.`,
      type: 'INFO',
      target_tab: 'payroll',
      read: false,
    });

    return newBatch;
  }

  public updatePayrollBatchStatus(batchId: string, status: PayrollStatus): void {
    const batches = this.getPayrollBatches();
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;

    batch.status = status;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (status === 'APPROVED') {
      batch.approved_at = nowStr;
    } else if (status === 'PAID') {
      batch.disbursed_at = nowStr;
    }

    localStorage.setItem(STORAGE_KEYS.PAYROLL_BATCHES, JSON.stringify(batches));

    // Cascade update items in this batch
    const items = this.getPayrollItems();
    items.forEach((item) => {
      if (item.payroll_batch_id === batchId) {
        item.status = status;
        if (status === 'PAID') {
          item.payment_date = nowStr.split(' ')[0];
          item.payment_reference = `TRX-BCA-${batchId.replace('batch-', '')}-${item.employee_code.replace('EMP-', '')}`;
        }
      }
    });
    localStorage.setItem(STORAGE_KEYS.PAYROLL_ITEMS, JSON.stringify(items));

    // Log and notify
    this.logAudit({
      user_name: 'Triyanto Andi',
      action: `UPDATE_PAYROLL_STATUS_${status}`,
      module: 'PAYROLL',
      record_id: batchId,
    });

    if (status === 'PAID') {
      this.addNotification({
        user_id: 'ALL',
        title: `Slip Gaji ${batch.period_label} Telah Diterbitkan`,
        message: `Gaji bulan ${batch.period_label} telah berhasil ditransfer. Anda dapat melihat dan mengunduh slip gaji resmi Anda di menu Payroll.`,
        type: 'SUCCESS',
        target_tab: 'payroll',
        read: false,
      });
    }
  }

  // ==========================================
  // PHASE 4: REIMBURSEMENTS & EXPENSE CLAIMS
  // ==========================================
  public getReimbursements(): ReimbursementClaim[] {
    const list: ReimbursementClaim[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.REIMBURSEMENTS) || '[]'
    );
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getEmployeeReimbursements(employeeId: string): ReimbursementClaim[] {
    return this.getReimbursements().filter((r) => r.employee_id === employeeId);
  }

  public createReimbursement(
    data: Omit<ReimbursementClaim, 'id' | 'claim_number' | 'created_at' | 'status'>
  ): ReimbursementClaim {
    const list = this.getReimbursements();
    const count = list.length + 1;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const claimNumber = `CLM-${yyyy}${mm}-${String(count).padStart(3, '0')}`;

    const newClaim: ReimbursementClaim = {
      ...data,
      id: `clm-${Date.now()}`,
      claim_number: claimNumber,
      status: 'PENDING',
      created_at: now.toISOString().replace('T', ' ').slice(0, 19),
    };

    list.unshift(newClaim);
    localStorage.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(list));

    // Notify HR / Approver
    this.addNotification({
      user_id: 'emp-02', // Siti Rahmawati
      title: 'Klaim Reimbursement Baru',
      message: `${data.employee_name} mengajukan klaim ${data.title} sebesar Rp ${data.amount.toLocaleString('id-ID')}.`,
      type: 'ACTION_REQUIRED',
      target_tab: 'reimbursements',
      read: false,
    });

    this.logAudit({
      user_name: data.employee_name,
      action: 'SUBMIT_REIMBURSEMENT',
      module: 'FINANCE',
      record_id: newClaim.id,
    });
    return newClaim;
  }

  public processReimbursementApproval(
    claimId: string,
    status: 'APPROVED' | 'REJECTED',
    approverName: string,
    notes?: string
  ): void {
    const list = this.getReimbursements();
    const claim = list.find((c) => c.id === claimId);
    if (!claim) return;

    claim.status = status;
    claim.approver_name = approverName;
    claim.approver_notes = notes;
    claim.approved_at = new Date().toISOString().replace('T', ' ').slice(0, 19);

    localStorage.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(list));

    // Notify employee
    this.addNotification({
      user_id: claim.employee_id,
      title: `Reimbursement ${status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}`,
      message: `Klaim Anda "${claim.title}" telah ${status === 'APPROVED' ? 'disetujui' : 'ditolak'} oleh ${approverName}.`,
      type: status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      target_tab: 'reimbursements',
      read: false,
    });

    this.logAudit({
      user_name: approverName,
      action: `PROCESS_REIMBURSEMENT_${status}`,
      module: 'FINANCE',
      record_id: claimId,
    });
  }

  public disburseReimbursement(claimId: string, refNumber: string): void {
    const list = this.getReimbursements();
    const claim = list.find((c) => c.id === claimId);
    if (!claim) return;

    claim.status = 'DISBURSED';
    claim.disbursed_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
    claim.disbursement_reference = refNumber;

    localStorage.setItem(STORAGE_KEYS.REIMBURSEMENTS, JSON.stringify(list));

    this.addNotification({
      user_id: claim.employee_id,
      title: 'Dana Reimbursement Dicairkan',
      message: `Dana klaim "${claim.title}" sebesar Rp ${claim.amount.toLocaleString('id-ID')} telah dicairkan ke rekening Anda (Ref: ${refNumber}).`,
      type: 'SUCCESS',
      target_tab: 'reimbursements',
      read: false,
    });

    this.logAudit({
      user_name: 'Finance Dept',
      action: 'DISBURSE_REIMBURSEMENT',
      module: 'FINANCE',
      record_id: claimId,
    });
  }

  // ==========================================
  // PHASE 4: PERFORMANCE & KPI APPRAISAL
  // ==========================================
  public getPerformances(): PerformanceAppraisal[] {
    const list: PerformanceAppraisal[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PERFORMANCES) || '[]'
    );
    return list;
  }

  public getEmployeePerformance(employeeId: string): PerformanceAppraisal[] {
    return this.getPerformances().filter((p) => p.employee_id === employeeId);
  }

  public savePerformanceAppraisal(appraisal: PerformanceAppraisal): void {
    const list = this.getPerformances();
    // Recalculate weighted final score
    let weightedScore = 0;
    appraisal.kpis.forEach((k) => {
      weightedScore += (k.score * k.weight) / 100;
    });
    appraisal.final_score = Math.round(weightedScore * 10) / 10;

    if (appraisal.final_score >= 95) {
      appraisal.rating_grade = 'A';
      appraisal.rating_label = 'Istimewa (Exceeds All Expectations)';
    } else if (appraisal.final_score >= 85) {
      appraisal.rating_grade = 'B';
      appraisal.rating_label = 'Sangat Baik (Meets & Exceeds)';
    } else if (appraisal.final_score >= 70) {
      appraisal.rating_grade = 'C';
      appraisal.rating_label = 'Baik (Meets Standards)';
    } else {
      appraisal.rating_grade = 'D';
      appraisal.rating_label = 'Perlu Peningkatan (Needs Improvement)';
    }

    const idx = list.findIndex((p) => p.id === appraisal.id);
    if (idx >= 0) {
      list[idx] = appraisal;
    } else {
      list.unshift(appraisal);
    }
    localStorage.setItem(STORAGE_KEYS.PERFORMANCES, JSON.stringify(list));

    this.addNotification({
      user_id: appraisal.employee_id,
      title: 'Evaluasi Kinerja & KPI Diperbarui',
      message: `Scorecard evaluasi ${appraisal.period} Anda telah diperbarui dengan predikat ${appraisal.rating_label}.`,
      type: 'INFO',
      target_tab: 'performance',
      read: false,
    });
  }

  // ==========================================
  // PHASE 4: COMPANY ANNOUNCEMENTS & CONTRACTS
  // ==========================================
  public getAnnouncements(): CompanyAnnouncement[] {
    const list: CompanyAnnouncement[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || '[]'
    );
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.published_date).getTime() - new Date(a.published_date).getTime();
    });
  }

  public createAnnouncement(
    data: Omit<CompanyAnnouncement, 'id' | 'views_count'>
  ): CompanyAnnouncement {
    const list = this.getAnnouncements();
    const newAnc: CompanyAnnouncement = {
      ...data,
      id: `anc-${Date.now()}`,
      views_count: 1,
    };
    list.unshift(newAnc);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));

    // Broadcast notification
    this.addNotification({
      user_id: 'ALL',
      title: `Pengumuman Baru: ${data.title}`,
      message: data.content.slice(0, 120) + '...',
      type: data.priority === 'URGENT' ? 'WARNING' : 'INFO',
      target_tab: 'company-hub',
      read: false,
    });

    this.logAudit({
      user_name: data.author_name,
      action: 'PUBLISH_ANNOUNCEMENT',
      module: 'COMMUNICATION',
      record_id: newAnc.id,
    });
    return newAnc;
  }

  public getContractTrackers(): EmployeeContractTracker[] {
    const list: EmployeeContractTracker[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CONTRACT_TRACKERS) || '[]'
    );
    // Refresh days remaining based on current date
    const now = new Date();
    list.forEach((c) => {
      const end = new Date(c.contract_end);
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      c.days_remaining = diffDays;
      if (diffDays <= 0) {
        c.status = 'EXPIRED';
      } else if (diffDays <= 45) {
        c.status = 'EXPIRING_SOON';
      } else {
        c.status = 'ACTIVE';
      }
    });
    return list;
  }
}

export const dataService = new DataService();
