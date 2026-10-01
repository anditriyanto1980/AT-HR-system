-- ========================================================================
-- AT-HR: Phase 2 - Leave, Permission, Overtime & Generic Approvals
-- ========================================================================

CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE permission_type AS ENUM ('Personal', 'Medical', 'Family', 'Emergency', 'Other');

-- 1. LEAVE TYPES & BALANCES
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
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
    remaining INTEGER GENERATED ALWAYS AS (entitlement - used - pending) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, leave_type_id, year)
);

-- 2. LEAVE REQUESTS
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL CHECK (total_days > 0),
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status approval_status DEFAULT 'PENDING',
    current_approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    approver_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PERMISSION REQUESTS
CREATE TABLE IF NOT EXISTS permission_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    permission_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    permission_type permission_type DEFAULT 'Personal',
    reason TEXT NOT NULL,
    notes TEXT,
    attachment_url TEXT,
    status approval_status DEFAULT 'PENDING',
    current_approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    approver_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OVERTIME REQUESTS
CREATE TABLE IF NOT EXISTS overtime_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    overtime_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours NUMERIC(4, 2) NOT NULL,
    reason TEXT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    attachment_url TEXT,
    status approval_status DEFAULT 'PENDING',
    current_approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    approver_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. APPROVAL AUDIT LOGS
CREATE TABLE IF NOT EXISTS approval_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type VARCHAR(50) NOT NULL, -- 'LEAVE', 'PERMISSION', 'OVERTIME'
    request_id UUID NOT NULL,
    approver_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    approver_name VARCHAR(255) NOT NULL,
    approver_role user_role NOT NULL,
    previous_status approval_status NOT NULL,
    new_status approval_status NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_leave_requests_emp ON leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_perm_requests_emp ON permission_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_ot_requests_emp ON overtime_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_approval_logs_req ON approval_logs(request_id);

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read leave types" ON leave_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Employees can view own balances" ON leave_balances
    FOR SELECT TO authenticated
    USING (employee_id = get_current_employee_id() OR get_current_user_role() IN ('SUPER_ADMIN', 'HR_ADMIN'));

CREATE POLICY "Leave requests access policy" ON leave_requests
    FOR ALL TO authenticated
    USING (
        employee_id = get_current_employee_id()
        OR get_current_user_role() IN ('SUPER_ADMIN', 'HR_ADMIN')
        OR (get_current_user_role() = 'MANAGER' AND employee_id IN (
            SELECT id FROM employees WHERE manager_id = get_current_employee_id()
        ))
    );

CREATE POLICY "Permission requests access policy" ON permission_requests
    FOR ALL TO authenticated
    USING (
        employee_id = get_current_employee_id()
        OR get_current_user_role() IN ('SUPER_ADMIN', 'HR_ADMIN')
        OR (get_current_user_role() = 'MANAGER' AND employee_id IN (
            SELECT id FROM employees WHERE manager_id = get_current_employee_id()
        ))
    );

CREATE POLICY "Overtime requests access policy" ON overtime_requests
    FOR ALL TO authenticated
    USING (
        employee_id = get_current_employee_id()
        OR get_current_user_role() IN ('SUPER_ADMIN', 'HR_ADMIN')
        OR (get_current_user_role() = 'MANAGER' AND employee_id IN (
            SELECT id FROM employees WHERE manager_id = get_current_employee_id()
        ))
    );
