-- ========================================================================
-- AT-HR: Phase 3 - Holidays, Attendance Corrections & Reporting Views
-- ========================================================================

CREATE TYPE holiday_type AS ENUM ('National', 'Company', 'Collective_Leave');
CREATE TYPE correction_type AS ENUM (
    'FORGOT_CLOCK_OUT', 'FORGOT_CLOCK_IN', 'INCORRECT_TIME', 'SYSTEM_GLITCH', 'OTHER'
);

-- 1. HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    holiday_type holiday_type DEFAULT 'National',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, date, name)
);

-- 2. ATTENDANCE CORRECTIONS (Does not overwrite original raw record)
CREATE TABLE IF NOT EXISTS attendance_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    correction_type correction_type NOT NULL,
    original_clock_in TIMESTAMPTZ,
    original_clock_out TIMESTAMPTZ,
    requested_clock_in TIME NOT NULL,
    requested_clock_out TIME NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status approval_status DEFAULT 'PENDING',
    approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    approver_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_corrections_emp_date ON attendance_corrections(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_corrections_status ON attendance_corrections(status);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view holidays" ON holidays
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super and HR can manage holidays" ON holidays
    FOR ALL TO authenticated
    USING (get_current_user_role() IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "Attendance corrections access policy" ON attendance_corrections
    FOR ALL TO authenticated
    USING (
        employee_id = get_current_employee_id()
        OR get_current_user_role() IN ('SUPER_ADMIN', 'HR_ADMIN')
        OR (get_current_user_role() = 'MANAGER' AND employee_id IN (
            SELECT id FROM employees WHERE manager_id = get_current_employee_id()
        ))
    );
