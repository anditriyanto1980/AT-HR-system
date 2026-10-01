-- ========================================================================
-- AT-HR: Smart Attendance & Employee Management System
-- Database Schema & Security Migration (PostgreSQL / Supabase)
-- ========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE');
CREATE TYPE employment_type AS ENUM ('Permanent', 'Contract', 'Probation', 'Internship');
CREATE TYPE employment_status AS ENUM ('Active', 'Resigned', 'Terminated', 'On_Leave');
CREATE TYPE attendance_status AS ENUM (
    'present', 'late', 'absent', 'early_checkout', 
    'leave', 'sick', 'business_trip', 'holiday', 'day_off', 'overtime'
);
CREATE TYPE location_policy AS ENUM ('BLOCK_OUTSIDE_RADIUS', 'ALLOW_WITH_APPROVAL');
CREATE TYPE shift_type AS ENUM ('Normal', 'Morning', 'Afternoon', 'Night', 'CrossDay');

-- 2. ORGANIZATIONAL STRUCTURE TABLES
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER DEFAULT 100,
    policy location_policy DEFAULT 'BLOCK_OUTSIDE_RADIUS',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS divisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EMPLOYEES & USERS
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- References auth.users(id) in Supabase
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    nik VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female')),
    birth_place VARCHAR(100),
    birth_date DATE,
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(255) UNIQUE NOT NULL,
    marital_status VARCHAR(20),
    
    -- Organization Relationships
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    division_id UUID REFERENCES divisions(id) ON DELETE SET NULL,
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE RESTRICT,
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    
    -- Employment Details
    role user_role DEFAULT 'EMPLOYEE',
    employment_type employment_type DEFAULT 'Permanent',
    employment_status employment_status DEFAULT 'Active',
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    resign_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SHIFT & SCHEDULE
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    shift_type shift_type DEFAULT 'Normal',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    tolerance_minutes INTEGER DEFAULT 10,
    is_cross_day BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
    schedule_date DATE NOT NULL,
    is_day_off BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, schedule_date)
);

-- 5. ATTENDANCE LOCATIONS
CREATE TABLE IF NOT EXISTS attendance_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters INTEGER DEFAULT 100,
    policy location_policy DEFAULT 'BLOCK_OUTSIDE_RADIUS',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Clock In Data
    clock_in_time TIMESTAMPTZ,
    clock_in_lat DOUBLE PRECISION,
    clock_in_lng DOUBLE PRECISION,
    clock_in_accuracy DOUBLE PRECISION,
    clock_in_distance_meters DOUBLE PRECISION,
    clock_in_location_name VARCHAR(255),
    clock_in_device TEXT,
    clock_in_ip VARCHAR(50),
    clock_in_selfie_url TEXT,
    clock_in_status attendance_status DEFAULT 'present',
    
    -- Clock Out Data
    clock_out_time TIMESTAMPTZ,
    clock_out_lat DOUBLE PRECISION,
    clock_out_lng DOUBLE PRECISION,
    clock_out_accuracy DOUBLE PRECISION,
    clock_out_distance_meters DOUBLE PRECISION,
    clock_out_location_name VARCHAR(255),
    clock_out_device TEXT,
    clock_out_ip VARCHAR(50),
    clock_out_selfie_url TEXT,
    
    -- Calculated Metrics
    late_minutes INTEGER DEFAULT 0,
    early_checkout_minutes INTEGER DEFAULT 0,
    work_duration_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    
    -- Notes & Flags
    notes TEXT,
    is_outside_geofence BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(50) DEFAULT 'APPROVED',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

-- 7. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    record_id TEXT,
    before_data JSONB,
    after_data JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TIME OFF, REQUESTS & APPROVALS (PHASE 2 & PHASE 3)
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    default_days INTEGER DEFAULT 12,
    is_paid BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    entitlement INTEGER DEFAULT 12,
    used INTEGER DEFAULT 0,
    pending INTEGER DEFAULT 0,
    remaining INTEGER DEFAULT 12,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    current_approver_id UUID REFERENCES employees(id),
    approver_name VARCHAR(255),
    approver_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permission_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    permission_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    permission_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    current_approver_id UUID REFERENCES employees(id),
    approver_name VARCHAR(255),
    approver_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS overtime_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    overtime_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    duration_hours NUMERIC(4, 2) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    current_approver_id UUID REFERENCES employees(id),
    approver_name VARCHAR(255),
    approver_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_trip_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    destination_city VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    transportation VARCHAR(50) NOT NULL,
    estimated_cost NUMERIC(12, 2) DEFAULT 0,
    cash_advance_requested NUMERIC(12, 2) DEFAULT 0,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    current_approver_id UUID REFERENCES employees(id),
    approver_name VARCHAR(255),
    approver_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    holiday_type VARCHAR(50) DEFAULT 'National',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    correction_type VARCHAR(50) NOT NULL,
    requested_clock_in VARCHAR(10) NOT NULL,
    requested_clock_out VARCHAR(10) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    approver_id UUID REFERENCES employees(id),
    approver_name VARCHAR(255),
    approver_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type VARCHAR(50) NOT NULL,
    request_id TEXT NOT NULL,
    approver_id UUID REFERENCES employees(id),
    approver_name VARCHAR(255),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    target_tab VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(clock_in_status);
CREATE INDEX IF NOT EXISTS idx_schedules_employee_date ON employee_schedules(employee_id, schedule_date);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current user's employee record
CREATE OR REPLACE FUNCTION get_current_employee_id()
RETURNS UUID AS $$
    SELECT id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Employees RLS Policies
CREATE POLICY "Super Admins have full access to employees"
    ON employees FOR ALL
    TO authenticated
    USING (get_current_user_role() = 'SUPER_ADMIN');

CREATE POLICY "HR Admins can view and manage employees in company"
    ON employees FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'HR_ADMIN' 
        AND company_id IN (SELECT company_id FROM employees WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Managers can view their subordinates and peers"
    ON employees FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() = 'MANAGER'
        AND (manager_id = get_current_employee_id() OR id = get_current_employee_id())
    );

CREATE POLICY "Employees can view own record"
    ON employees FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());

-- Attendance Records RLS Policies
CREATE POLICY "Super Admin and HR Admin have full access to attendance"
    ON attendance_records FOR ALL
    TO authenticated
    USING (get_current_user_role() IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "Managers can view team attendance"
    ON attendance_records FOR SELECT
    TO authenticated
    USING (
        get_current_user_role() = 'MANAGER'
        AND employee_id IN (
            SELECT id FROM employees WHERE manager_id = get_current_employee_id() OR id = get_current_employee_id()
        )
    );

CREATE POLICY "Employees can view and create their own attendance"
    ON attendance_records FOR ALL
    TO authenticated
    USING (employee_id = get_current_employee_id())
    WITH CHECK (employee_id = get_current_employee_id());

-- Public / Authenticated read for shifts and locations
CREATE POLICY "Authenticated users can view active shifts"
    ON shifts FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

CREATE POLICY "Authenticated users can view active locations"
    ON attendance_locations FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- ============================================================================
-- PHASE 4: PAYROLL, CLAIMS, PERFORMANCE & ANNOUNCEMENTS
-- ============================================================================

CREATE TABLE employee_salary_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    base_salary NUMERIC(15,2) NOT NULL DEFAULT 0,
    position_allowance NUMERIC(15,2) NOT NULL DEFAULT 0,
    transport_allowance NUMERIC(15,2) NOT NULL DEFAULT 0,
    meal_allowance NUMERIC(15,2) NOT NULL DEFAULT 0,
    communication_allowance NUMERIC(15,2) NOT NULL DEFAULT 0,
    bank_name VARCHAR(100) NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    bank_account_holder VARCHAR(150) NOT NULL,
    npwp VARCHAR(50),
    bpjs_tk_number VARCHAR(50),
    bpjs_kes_number VARCHAR(50),
    ptkp_status VARCHAR(10) DEFAULT 'TK/0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payroll_batches (
    id VARCHAR(50) PRIMARY KEY,
    month INT NOT NULL,
    year INT NOT NULL,
    period_label VARCHAR(100) NOT NULL,
    cut_off_start DATE NOT NULL,
    cut_off_end DATE NOT NULL,
    payment_date DATE NOT NULL,
    total_employees INT NOT NULL DEFAULT 0,
    total_gross NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_net_payroll NUMERIC(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, VERIFIED, APPROVED, PAID
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ
);

CREATE TABLE payroll_items (
    id VARCHAR(100) PRIMARY KEY,
    payroll_batch_id VARCHAR(50) NOT NULL REFERENCES payroll_batches(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employee_code VARCHAR(50),
    employee_name VARCHAR(150),
    department_name VARCHAR(100),
    position_name VARCHAR(100),
    branch_name VARCHAR(100),
    month INT NOT NULL,
    year INT NOT NULL,
    period_label VARCHAR(100),
    work_days INT NOT NULL,
    present_days INT NOT NULL,
    late_minutes INT DEFAULT 0,
    unpaid_days INT DEFAULT 0,
    overtime_hours NUMERIC(6,2) DEFAULT 0,
    base_salary NUMERIC(15,2) NOT NULL,
    position_allowance NUMERIC(15,2) DEFAULT 0,
    transport_allowance NUMERIC(15,2) DEFAULT 0,
    meal_allowance NUMERIC(15,2) DEFAULT 0,
    communication_allowance NUMERIC(15,2) DEFAULT 0,
    overtime_pay NUMERIC(15,2) DEFAULT 0,
    bonus NUMERIC(15,2) DEFAULT 0,
    gross_income NUMERIC(18,2) NOT NULL,
    late_deduction NUMERIC(15,2) DEFAULT 0,
    absence_deduction NUMERIC(15,2) DEFAULT 0,
    bpjs_kes_employee NUMERIC(15,2) DEFAULT 0,
    bpjs_tk_jht_employee NUMERIC(15,2) DEFAULT 0,
    bpjs_tk_jp_employee NUMERIC(15,2) DEFAULT 0,
    pph21 NUMERIC(15,2) DEFAULT 0,
    total_deductions NUMERIC(15,2) NOT NULL,
    take_home_pay NUMERIC(18,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    slip_number VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    payment_date DATE,
    payment_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reimbursement_claims (
    id VARCHAR(100) PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    receipt_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approver_name VARCHAR(150),
    approver_notes TEXT,
    approved_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ,
    disbursement_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE performance_appraisals (
    id VARCHAR(100) PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    kpis JSONB NOT NULL,
    final_score NUMERIC(5,2) NOT NULL,
    rating_grade VARCHAR(5) NOT NULL,
    rating_label VARCHAR(100),
    manager_name VARCHAR(150),
    manager_feedback TEXT,
    self_assessment_notes TEXT,
    status VARCHAR(30) DEFAULT 'DRAFT',
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE company_announcements (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    content TEXT NOT NULL,
    published_date DATE NOT NULL,
    effective_date DATE,
    author_name VARCHAR(150) NOT NULL,
    target_audience VARCHAR(50) DEFAULT 'ALL',
    attachment_name VARCHAR(255),
    pinned BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
