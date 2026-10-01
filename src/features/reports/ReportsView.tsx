import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Building,
  Printer,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { PayrollAttendanceSummary } from '../../types';
import { formatDate, formatMinutes, formatTime } from '../../utils/attendance';

export const ReportsView: React.FC = () => {
  const branches = dataService.getBranches();
  const departments = dataService.getDepartments();

  const [reportType, setReportType] = useState<
    'PAYROLL' | 'DAILY' | 'MONTHLY' | 'LATE' | 'EXCEPTIONS'
  >('PAYROLL');

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Payroll Data
  const payrollData: PayrollAttendanceSummary[] = dataService.generatePayrollSummary(
    selectedMonth,
    selectedYear,
    selectedBranch,
    selectedDept
  );

  // 2. Attendance Records
  const allAttendance = dataService.getAttendanceRecords();

  const dailyData = allAttendance.filter((a) => {
    if (a.attendance_date !== selectedDate) return false;
    if (selectedBranch !== 'all' && a.branch_name !== selectedBranch) return false;
    if (selectedDept !== 'all' && a.department_name !== selectedDept) return false;
    return true;
  });

  const lateData = allAttendance.filter((a) => {
    if (a.clock_in_status !== 'late') return false;
    const [y, m] = a.attendance_date.split('-').map(Number);
    if (y !== selectedYear || m !== selectedMonth) return false;
    if (selectedBranch !== 'all' && a.branch_name !== selectedBranch) return false;
    return true;
  });

  const exceptionData = allAttendance.filter((a) => {
    if (!a.is_outside_geofence && a.clock_in_status !== 'absent' && a.early_checkout_minutes <= 15) {
      return false;
    }
    const [y, m] = a.attendance_date.split('-').map(Number);
    if (y !== selectedYear || m !== selectedMonth) return false;
    return true;
  });

  // Handle Real CSV Export
  const handleExportCsv = () => {
    if (reportType === 'PAYROLL') {
      const headers = [
        'Employee ID',
        'Employee Name',
        'Department',
        'Branch',
        'Working Days',
        'Present (On-Time)',
        'Late Arrivals',
        'Absent Days',
        'Annual Leave',
        'Sick Leave',
        'Permission Count',
        'Overtime Hours',
        'Early Checkout Count',
      ];
      const rows = payrollData.map((p) => [
        p.employee_code,
        p.employee_name,
        p.department_name,
        p.branch_name,
        p.working_days,
        p.present,
        p.late,
        p.absent,
        p.leave,
        p.sick,
        p.permission,
        p.overtime_hours,
        p.early_checkout,
      ]);
      dataService.exportToCsv(`payroll_attendance_${selectedYear}_${selectedMonth}`, headers, rows);
    } else if (reportType === 'DAILY') {
      const headers = [
        'Date',
        'Employee ID',
        'Employee Name',
        'Department',
        'Branch',
        'Shift',
        'Clock In',
        'Clock Out',
        'Status',
        'Late Minutes',
        'Duration',
      ];
      const rows = dailyData.map((d) => [
        d.attendance_date,
        d.employee_code || '-',
        d.employee_name || '-',
        d.department_name || '-',
        d.branch_name || '-',
        d.shift_name || 'Normal',
        formatTime(d.clock_in_time),
        formatTime(d.clock_out_time),
        d.clock_in_status,
        d.late_minutes,
        formatMinutes(d.work_duration_minutes || 0),
      ]);
      dataService.exportToCsv(`daily_attendance_${selectedDate}`, headers, rows);
    } else if (reportType === 'LATE') {
      const headers = [
        'Date',
        'Employee ID',
        'Employee Name',
        'Department',
        'Clock In Time',
        'Minutes Late',
        'Location / Office',
        'Reason / Notes',
      ];
      const rows = lateData.map((l) => [
        l.attendance_date,
        l.employee_code || '-',
        l.employee_name || '-',
        l.department_name || '-',
        formatTime(l.clock_in_time),
        l.late_minutes,
        l.clock_in_location_name || l.branch_name || '-',
        l.notes || '-',
      ]);
      dataService.exportToCsv(`late_arrivals_${selectedYear}_${selectedMonth}`, headers, rows);
    } else {
      const headers = [
        'Date',
        'Employee',
        'Exception Type',
        'Location Status',
        'Details',
      ];
      const rows = exceptionData.map((e) => [
        e.attendance_date,
        e.employee_name || '-',
        e.is_outside_geofence ? 'Outside Geofence' : 'Early Checkout',
        e.clock_in_location_name || '-',
        e.notes || '-',
      ]);
      dataService.exportToCsv(`attendance_exceptions_${selectedYear}_${selectedMonth}`, headers, rows);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Attendance & Payroll-Ready Reports</h2>
          <p className="text-xs text-slate-500">
            Generate audit spreadsheets, daily rosters, and payroll integration metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV (Excel)</span>
          </button>
        </div>
      </div>

      {/* Filter & Report Type Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        {/* Report Type Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setReportType('PAYROLL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reportType === 'PAYROLL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payroll Summary
          </button>
          <button
            onClick={() => setReportType('DAILY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reportType === 'DAILY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Attendance
          </button>
          <button
            onClick={() => setReportType('LATE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reportType === 'LATE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Late Arrivals
          </button>
          <button
            onClick={() => setReportType('EXCEPTIONS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reportType === 'EXCEPTIONS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exceptions & Geofence
          </button>
        </div>

        {/* Dynamic Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          {reportType === 'DAILY' ? (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Roster Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium"
                >
                  {monthNames.map((m, idx) => (
                    <option key={idx} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-medium"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Branch Location</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Search Staff</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by name..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* REPORT DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* 1. PAYROLL SUMMARY TABLE */}
        {reportType === 'PAYROLL' && (
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Payroll Attendance Summary ({monthNames[selectedMonth - 1]} {selectedYear})
                </h3>
                <p className="text-xs text-slate-500">
                  Ready-to-integrate metrics: working days, present, late, leaves, and overtime hours
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 font-semibold">
                {payrollData.length} active employees
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Emp ID</th>
                    <th className="py-3 px-4 font-sans">Full Name</th>
                    <th className="py-3 px-3 font-sans">Department</th>
                    <th className="py-3 px-2 text-center">Workdays</th>
                    <th className="py-3 px-2 text-center text-emerald-700">Present</th>
                    <th className="py-3 px-2 text-center text-amber-700">Late</th>
                    <th className="py-3 px-2 text-center text-rose-700">Absent</th>
                    <th className="py-3 px-2 text-center text-blue-700">Leave</th>
                    <th className="py-3 px-2 text-center text-purple-700">Sick</th>
                    <th className="py-3 px-2 text-center">Perm.</th>
                    <th className="py-3 px-3 text-right text-teal-800">Overtime (Hrs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs tabular-nums">
                  {payrollData
                    .filter((p) => !searchTerm || p.employee_name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((p) => (
                      <tr key={p.employee_id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 text-slate-500">{p.employee_code}</td>
                        <td className="py-3 px-4 font-sans font-bold text-slate-900">{p.employee_name}</td>
                        <td className="py-3 px-3 font-sans text-slate-600 truncate max-w-[140px]">{p.department_name}</td>
                        <td className="py-3 px-2 text-center text-slate-700">{p.working_days}</td>
                        <td className="py-3 px-2 text-center font-bold text-emerald-700">{p.present}</td>
                        <td className="py-3 px-2 text-center font-bold text-amber-700">{p.late}</td>
                        <td className="py-3 px-2 text-center font-bold text-rose-700">{p.absent}</td>
                        <td className="py-3 px-2 text-center text-blue-700 font-medium">{p.leave}</td>
                        <td className="py-3 px-2 text-center text-purple-700 font-medium">{p.sick}</td>
                        <td className="py-3 px-2 text-center text-slate-600">{p.permission}</td>
                        <td className="py-3 px-3 text-right font-bold text-teal-700">{p.overtime_hours.toFixed(1)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. DAILY ATTENDANCE TABLE */}
        {reportType === 'DAILY' && (
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Daily Attendance Roster ({formatDate(selectedDate)})
              </h3>
              <span className="text-xs font-mono text-slate-500">{dailyData.length} logs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Branch & Dept</th>
                    <th className="py-3 px-4">Shift</th>
                    <th className="py-3 px-4">Clock In</th>
                    <th className="py-3 px-4">Clock Out</th>
                    <th className="py-3 px-4">Work Duration</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No records logged for this date.
                      </td>
                    </tr>
                  ) : (
                    dailyData.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{d.employee_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{d.employee_code}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {d.branch_name} · {d.department_name}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{d.shift_name}</td>
                        <td className="py-3 px-4 font-mono font-semibold tabular-nums text-slate-900">
                          {formatTime(d.clock_in_time)}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                          {formatTime(d.clock_out_time)}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                          {d.work_duration_minutes ? formatMinutes(d.work_duration_minutes) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              d.clock_in_status === 'present'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {d.clock_in_status} {d.late_minutes > 0 ? `(+${d.late_minutes}m)` : ''}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. LATE REPORT TABLE */}
        {reportType === 'LATE' && (
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Late Arrival Audit ({monthNames[selectedMonth - 1]} {selectedYear})
              </h3>
              <span className="text-xs font-mono text-slate-500">{lateData.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Clock In Time</th>
                    <th className="py-3 px-4">Minutes Late</th>
                    <th className="py-3 px-4">Branch / Location</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lateData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No late arrivals recorded for this month.
                      </td>
                    </tr>
                  ) : (
                    lateData.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {formatDate(l.attendance_date)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{l.employee_name}</div>
                          <div className="text-[11px] text-slate-500">{l.department_name}</div>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-900">
                          {formatTime(l.clock_in_time)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-700 tabular-nums">
                          +{l.late_minutes} mins
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {l.clock_in_location_name || l.branch_name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[240px] truncate">
                          {l.notes || 'Traffic / commute'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. EXCEPTIONS TABLE */}
        {reportType === 'EXCEPTIONS' && (
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Attendance Exceptions & Geofence Violations
              </h3>
              <span className="text-xs font-mono text-slate-500">{exceptionData.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Exception Category</th>
                    <th className="py-3 px-4">Location / Distance</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exceptionData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No exceptions recorded.
                      </td>
                    </tr>
                  ) : (
                    exceptionData.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {formatDate(e.attendance_date)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{e.employee_name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            {e.is_outside_geofence ? 'Outside Geofence Radius' : 'Early Checkout'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                          {e.clock_in_location_name} ({e.clock_in_distance_meters || 0}m)
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[240px] truncate">
                          {e.notes || 'Pending supervisor clearance'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
