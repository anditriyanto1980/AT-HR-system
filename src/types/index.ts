export type UserRole = 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type EmploymentType = 'Permanent' | 'Contract' | 'Probation' | 'Internship';

export type EmploymentStatus = 'Active' | 'Resigned' | 'Terminated' | 'On_Leave';

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'early_checkout'
  | 'leave'
  | 'sick'
  | 'business_trip'
  | 'holiday'
  | 'day_off'
  | 'overtime';

export type LocationPolicy = 'BLOCK_OUTSIDE_RADIUS' | 'ALLOW_WITH_APPROVAL';

export type ShiftType = 'Normal' | 'Morning' | 'Afternoon' | 'Night' | 'CrossDay';

export interface Company {
  id: string;
  code: string;
  name: string;
  app_name?: string;
  tagline?: string;
  app_short_name?: string;
  brand_icon?: 'gem' | 'building' | 'sparkles' | 'shield' | 'briefcase' | 'rocket' | 'award';
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo_url?: string;
  created_at?: string;
}

export interface Branch {
  id: string;
  company_id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  policy: LocationPolicy;
  is_active: boolean;
  created_at?: string;
}

export interface Department {
  id: string;
  company_id: string;
  name: string;
  code: string;
  description?: string;
  created_at?: string;
}

export interface Division {
  id: string;
  department_id: string;
  name: string;
  code: string;
  created_at?: string;
}

export interface Position {
  id: string;
  department_id: string;
  name: string;
  code: string;
  level: number;
  created_at?: string;
}

export interface Employee {
  id: string;
  auth_user_id?: string;
  employee_code: string;
  nik: string;
  full_name: string;
  avatar_url?: string;
  gender: 'Male' | 'Female';
  birth_place?: string;
  birth_date?: string;
  address?: string;
  phone: string;
  email: string;
  marital_status?: string;

  // Organizational links
  company_id: string;
  branch_id: string;
  department_id: string;
  division_id?: string;
  position_id: string;
  manager_id?: string;

  // Employment details
  role: UserRole;
  employment_type: EmploymentType;
  employment_status: EmploymentStatus;
  join_date: string;
  resign_date?: string;

  // Login Credentials & System Access Control
  username?: string;
  password?: string;
  login_access_enabled?: boolean;
  last_login_at?: string;
  force_password_change?: boolean;

  // Denormalized names for high-performance grid display
  branch_name?: string;
  department_name?: string;
  position_name?: string;
  manager_name?: string;
}

export interface Shift {
  id: string;
  company_id: string;
  name: string;
  shift_type: ShiftType;
  start_time: string; // "08:00"
  end_time: string; // "17:00"
  break_start?: string; // "12:00"
  break_end?: string; // "13:00"
  tolerance_minutes: number;
  is_cross_day: boolean;
  is_active: boolean;
}

export interface AttendanceLocation {
  id: string;
  branch_id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  policy: LocationPolicy;
  is_active: boolean;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  shift_id?: string;
  attendance_date: string; // "YYYY-MM-DD"

  // Clock In
  clock_in_time?: string; // ISO string
  clock_in_lat?: number;
  clock_in_lng?: number;
  clock_in_accuracy?: number;
  clock_in_distance_meters?: number;
  clock_in_location_name?: string;
  clock_in_device?: string;
  clock_in_ip?: string;
  clock_in_selfie_url?: string;
  clock_in_status: AttendanceStatus;

  // Clock Out
  clock_out_time?: string; // ISO string
  clock_out_lat?: number;
  clock_out_lng?: number;
  clock_out_accuracy?: number;
  clock_out_distance_meters?: number;
  clock_out_location_name?: string;
  clock_out_device?: string;
  clock_out_ip?: string;
  clock_out_selfie_url?: string;

  // Calculated metrics
  late_minutes: number;
  early_checkout_minutes: number;
  work_duration_minutes: number;
  overtime_minutes: number;

  notes?: string;
  is_outside_geofence: boolean;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';

  // Denormalized employee info for table
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  branch_name?: string;
  shift_name?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name: string;
  action: string;
  module: string;
  record_id?: string;
  before_data?: Record<string, any>;
  after_data?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface UserSession {
  user: Employee;
  role: UserRole;
  token?: string;
  isDemoMode: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// ==========================================
// PHASE 2: LEAVE, PERMISSION, OVERTIME & APPROVALS
// ==========================================

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  default_days: number;
  is_paid: boolean;
  description?: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  entitlement: number;
  used: number;
  pending: number;
  remaining: number;
  leave_type_name?: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  total_days: number;
  reason: string;
  attachment_url?: string;
  status: ApprovalStatus;
  current_approver_id?: string;
  approver_name?: string;
  approver_comment?: string;
  created_at: string;

  // Denormalized
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  branch_name?: string;
  leave_type_name?: string;
}

export type PermissionType = 'Personal' | 'Medical' | 'Family' | 'Emergency' | 'Other';

export interface PermissionRequest {
  id: string;
  employee_id: string;
  permission_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  permission_type: PermissionType;
  reason: string;
  notes?: string;
  attachment_url?: string;
  status: ApprovalStatus;
  current_approver_id?: string;
  approver_name?: string;
  approver_comment?: string;
  created_at: string;

  // Denormalized
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
}

export interface OvertimeRequest {
  id: string;
  employee_id: string;
  overtime_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  duration_hours: number;
  reason: string;
  project_name: string;
  attachment_url?: string;
  status: ApprovalStatus;
  current_approver_id?: string;
  approver_name?: string;
  approver_comment?: string;
  created_at: string;

  // Denormalized
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
}

export interface ApprovalLog {
  id: string;
  request_type: 'LEAVE' | 'PERMISSION' | 'OVERTIME' | 'CORRECTION';
  request_id: string;
  approver_id: string;
  approver_name: string;
  approver_role: UserRole;
  previous_status: ApprovalStatus;
  new_status: ApprovalStatus;
  comment: string;
  created_at: string;
}

// ==========================================
// PHASE 3: HOLIDAYS, CORRECTIONS & PAYROLL REPORTS
// ==========================================

export type HolidayType = 'National' | 'Company' | 'Collective_Leave';

export interface Holiday {
  id: string;
  company_id: string;
  name: string;
  date: string; // YYYY-MM-DD
  holiday_type: HolidayType;
  description?: string;
}

export type CorrectionType =
  | 'FORGOT_CLOCK_OUT'
  | 'FORGOT_CLOCK_IN'
  | 'INCORRECT_TIME'
  | 'SYSTEM_GLITCH'
  | 'OTHER';

export interface AttendanceCorrection {
  id: string;
  employee_id: string;
  attendance_date: string; // YYYY-MM-DD
  correction_type: CorrectionType;
  original_clock_in?: string;
  original_clock_out?: string;
  requested_clock_in: string; // HH:mm or ISO
  requested_clock_out: string; // HH:mm or ISO
  reason: string;
  attachment_url?: string;
  status: ApprovalStatus;
  approver_id?: string;
  approver_name?: string;
  approver_comment?: string;
  created_at: string;

  // Denormalized
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  branch_name?: string;
}

export interface PayrollAttendanceSummary {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  department_name: string;
  branch_name: string;
  working_days: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  sick: number;
  permission: number;
  overtime_hours: number;
  early_checkout: number;
  unpaid_leave: number;
}

export type TransportationMode = 'Flight' | 'Train' | 'Car_Rental' | 'Company_Vehicle' | 'Public_Transit';

export interface BusinessTripRequest {
  id: string;
  employee_id: string;
  destination_city: string;
  destination_country?: string;
  purpose: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  total_days: number;
  transportation: TransportationMode;
  estimated_cost: number;
  cash_advance_requested: number;
  notes?: string;
  attachment_url?: string;
  status: ApprovalStatus;
  current_approver_id?: string;
  approver_name?: string;
  approver_comment?: string;
  created_at: string;

  // Denormalized fields
  employee_name?: string;
  employee_code?: string;
  department_name?: string;
  branch_name?: string;
}

export interface AppNotification {
  id: string;
  user_id: string; // or 'ALL'
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED';
  target_tab?: string;
  read: boolean;
  created_at: string;
}

export type SchedulePattern = '5_DAYS' | '6_DAYS' | 'ROTATING_SHIFT' | 'CUSTOM';

export interface WorkScheduleAssignment {
  id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  shift_id: string;
  is_day_off: boolean;
  shift_name?: string;
  start_time?: string;
  end_time?: string;
  employee_name?: string;
}

// -------------------------------------------------------------
// PHASE 4: PAYROLL, CLAIMS, PERFORMANCE & ANNOUNCEMENTS
// -------------------------------------------------------------

export interface EmployeeSalaryProfile {
  employee_id: string;
  base_salary: number; // Gaji Pokok
  position_allowance: number; // Tunjangan Jabatan
  transport_allowance: number; // Tunjangan Transportasi
  meal_allowance: number; // Tunjangan Uang Makan
  communication_allowance: number; // Tunjangan Komunikasi / Pulsa
  bank_name: string; // e.g. BCA, Mandiri, BRI, BNI
  bank_account_number: string;
  bank_account_holder: string;
  npwp: string;
  bpjs_tk_number: string;
  bpjs_kes_number: string;
  ptkp_status: 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3';
}

export type PayrollStatus = 'DRAFT' | 'VERIFIED' | 'APPROVED' | 'PAID';

export interface PayrollItem {
  id: string;
  payroll_batch_id: string;
  employee_id: string;
  employee_code: string;
  employee_name: string;
  department_name: string;
  position_name: string;
  branch_name: string;
  month: number;
  year: number;
  period_label: string; // e.g. "September 2026"
  
  // Attendance inputs for calculation
  work_days: number;
  present_days: number;
  late_minutes: number;
  unpaid_days: number;
  overtime_hours: number;

  // Earnings (Penghasilan)
  base_salary: number;
  position_allowance: number;
  transport_allowance: number;
  meal_allowance: number;
  communication_allowance: number;
  overtime_pay: number;
  bonus: number;
  other_earnings: number;
  gross_income: number;

  // Deductions (Potongan)
  late_deduction: number;
  absence_deduction: number;
  bpjs_kes_employee: number; // 1%
  bpjs_tk_jht_employee: number; // 2%
  bpjs_tk_jp_employee: number; // 1%
  pph21: number; // PPh 21 TER
  loan_deduction: number;
  other_deductions: number;
  total_deductions: number;

  // Net Pay (Take Home Pay)
  take_home_pay: number;

  // Company Contribution (Tunjangan Perusahaan)
  bpjs_kes_company: number; // 4%
  bpjs_tk_jht_company: number; // 3.7%
  bpjs_tk_jkk_company: number; // 0.24%
  bpjs_tk_jkm_company: number; // 0.3%
  bpjs_tk_jp_company: number; // 2%

  // Payment Status & Tracking
  status: PayrollStatus;
  slip_number: string; // e.g. "SLIP/2026/09/001"
  payment_date?: string;
  payment_reference?: string;
  bank_name?: string;
  bank_account_number?: string;
}

export interface PayrollBatch {
  id: string;
  month: number;
  year: number;
  period_label: string;
  cut_off_start: string;
  cut_off_end: string;
  payment_date: string;
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net_payroll: number;
  status: PayrollStatus;
  notes?: string;
  created_at: string;
  approved_at?: string;
  disbursed_at?: string;
}

export type ReimbursementCategory = 
  | 'MEDICAL'
  | 'TRANSPORT'
  | 'MEALS_ENTERTAINMENT'
  | 'OFFICE_SUPPLIES'
  | 'BUSINESS_TRIP_SETTLEMENT'
  | 'TRAINING_CERTIFICATION'
  | 'OTHER';

export interface ReimbursementClaim {
  id: string;
  employee_id: string;
  employee_code: string;
  employee_name: string;
  department_name: string;
  branch_name: string;
  claim_number: string; // e.g. "CLM-202609-001"
  category: ReimbursementCategory;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  receipt_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
  approver_name?: string;
  approver_notes?: string;
  approved_at?: string;
  disbursed_at?: string;
  disbursement_reference?: string;
  created_at: string;
}

export interface KpiItem {
  id: string;
  title: string;
  description: string;
  category: 'Core Job' | 'Quality' | 'Efficiency' | 'Teamwork' | 'Attendance & Discipline';
  target: string;
  weight: number; // Percentage, sum = 100
  actual: string;
  score: number; // 0 - 100
}

export interface PerformanceAppraisal {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  position_name: string;
  period: string; // e.g. "Q3 2026" or "Semester 2 - 2026"
  year: number;
  kpis: KpiItem[];
  final_score: number; // 0 - 100
  rating_grade: 'A' | 'B' | 'C' | 'D'; // Istimewa, Sangat Baik, Baik, Kurang
  rating_label: string;
  manager_name: string;
  manager_feedback: string;
  self_assessment_notes: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'FINALIZED';
  reviewed_at?: string;
  created_at: string;
}

export interface CompanyAnnouncement {
  id: string;
  title: string;
  category: 'CIRCULAR_LETTER' | 'HR_MEMO' | 'HOLIDAY_NOTICE' | 'EVENT' | 'POLICY';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  content: string;
  published_date: string;
  effective_date?: string;
  author_name: string;
  target_audience: string; // 'ALL' or 'OPERATIONAL' or 'HEAD_OFFICE'
  attachment_name?: string;
  pinned: boolean;
  views_count: number;
}

export interface EmployeeContractTracker {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  employment_type: EmploymentType;
  contract_start: string;
  contract_end: string;
  days_remaining: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  action_needed: string;
}


