import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  Plus,
  Users,
  Building,
  Check,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { Employee, Shift, WorkScheduleAssignment } from '../../types';
import { formatDate } from '../../utils/attendance';

export const ScheduleView: React.FC = () => {
  const { role } = useAuth();
  const isSuperOrHr = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';

  const employees = dataService.getEmployees().filter((e) => e.employment_status === 'Active');
  const branches = dataService.getBranches();
  const departments = dataService.getDepartments();
  const shifts = dataService.getShifts().filter((s) => s.is_active);

  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [schedules, setSchedules] = useState<WorkScheduleAssignment[]>(
    dataService.getWorkSchedules()
  );

  // Assignment Modal Form
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>(employees[0]?.id || '');
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [targetShiftId, setTargetShiftId] = useState<string>(shifts[0]?.id || '');
  const [isDayOff, setIsDayOff] = useState<boolean>(false);

  // Generate 7 days of current viewed week
  const getWeekDates = (offsetWeeks: number) => {
    const curr = new Date();
    // Monday of current week
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1) + offsetWeeks * 7;
    const monday = new Date(curr.setDate(diff));

    const week: { dateStr: string; dayName: string; dayNumber: number }[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: dayNames[i],
        dayNumber: d.getDate(),
      });
    }
    return week;
  };

  const weekDays = getWeekDates(weekOffset);

  // Filtered employees
  const filteredEmployees = employees.filter((e) => {
    if (selectedBranch !== 'all' && e.branch_id !== selectedBranch) return false;
    if (selectedDept !== 'all' && e.department_id !== selectedDept) return false;
    return true;
  });

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === targetEmployeeId);
    const shift = shifts.find((s) => s.id === targetShiftId);

    const assignment: WorkScheduleAssignment = {
      id: `sched-${targetEmployeeId}-${targetDate}`,
      employee_id: targetEmployeeId,
      date: targetDate,
      shift_id: targetShiftId,
      is_day_off: isDayOff,
      shift_name: isDayOff ? 'Day Off' : shift?.name || 'Regular Shift',
      start_time: isDayOff ? '-' : shift?.start_time || '08:00',
      end_time: isDayOff ? '-' : shift?.end_time || '17:00',
      employee_name: emp?.full_name,
    };

    dataService.saveWorkSchedule(assignment);
    setSchedules(dataService.getWorkSchedules());
    setModalOpen(false);
  };

  // Bulk Apply Preset (5-Day vs 6-Day Work Week)
  const handleApplyPreset = (pattern: '5_DAY' | '6_DAY') => {
    filteredEmployees.forEach((emp) => {
      weekDays.forEach((w, index) => {
        // Mon-Fri is 0-4. Sat is 5, Sun is 6
        const isOff = pattern === '5_DAY' ? index >= 5 : index === 6;
        const defaultShift = shifts[0];
        const assignment: WorkScheduleAssignment = {
          id: `sched-${emp.id}-${w.dateStr}`,
          employee_id: emp.id,
          date: w.dateStr,
          shift_id: defaultShift?.id || 'shift-01',
          is_day_off: isOff,
          shift_name: isOff ? 'Day Off' : defaultShift?.name || 'Office Hours',
          start_time: isOff ? '-' : defaultShift?.start_time || '08:00',
          end_time: isOff ? '-' : defaultShift?.end_time || '17:00',
          employee_name: emp.full_name,
        };
        dataService.saveWorkSchedule(assignment);
      });
    });
    setSchedules(dataService.getWorkSchedules());
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Work Schedule & Roster Calendar</h2>
          <p className="text-xs text-slate-500">
            5-day / 6-day work weeks, rotating shift rosters, and employee day off assignments
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isSuperOrHr && (
            <>
              <button
                onClick={() => handleApplyPreset('5_DAY')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Apply standard 5-day work week (Sat & Sun off)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Auto 5-Day Week</span>
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#1D63FF] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Shift</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Week Navigation & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-800 px-2">
            {formatDate(weekDays[0].dateStr)} - {formatDate(weekDays[6].dateStr)}
          </span>
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-slate-600 hover:text-slate-900 underline ml-2 font-medium"
            >
              Current Week
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">Branch:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Roster Calendar Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200">
                <th className="py-3 px-4 font-bold text-slate-900 w-64 shrink-0">Employee</th>
                {weekDays.map((d) => (
                  <th key={d.dateStr} className="py-3 px-3 font-bold text-center border-l border-slate-200/80 min-w-[110px]">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500">{d.dayName}</div>
                    <div className="text-sm font-mono text-slate-900 font-bold">{d.dayNumber}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{emp.full_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {emp.employee_code} &bull; {emp.department_name}
                    </div>
                  </td>

                  {weekDays.map((d, dayIdx) => {
                    const assign = schedules.find(
                      (s) => s.employee_id === emp.id && s.date === d.dateStr
                    );

                    // Default fallback logic: weekends off, weekdays normal 08:00 - 17:00
                    const isWeekend = dayIdx === 5 || dayIdx === 6;
                    const isOff = assign ? assign.is_day_off : isWeekend;
                    const shiftName = assign ? assign.shift_name : isWeekend ? 'Day Off' : 'Normal (08-17)';
                    const timeRange = assign
                      ? assign.start_time !== '-'
                        ? `${assign.start_time} - ${assign.end_time}`
                        : '-'
                      : isWeekend
                      ? '-'
                      : '08:00 - 17:00';

                    return (
                      <td
                        key={d.dateStr}
                        onClick={() => {
                          if (isSuperOrHr) {
                            setTargetEmployeeId(emp.id);
                            setTargetDate(d.dateStr);
                            setIsDayOff(isOff);
                            setModalOpen(true);
                          }
                        }}
                        className={`py-2 px-2 text-center border-l border-slate-100 font-mono transition-colors ${
                          isSuperOrHr ? 'cursor-pointer hover:bg-slate-100/60' : ''
                        }`}
                      >
                        {isOff ? (
                          <div className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-semibold border border-slate-200">
                            OFF
                          </div>
                        ) : (
                          <div className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium leading-tight">
                            <div className="font-bold text-slate-900 truncate">{shiftName}</div>
                            <div className="text-emerald-700">{timeRange}</div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Assign Work Shift / Day Off</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Employee</label>
                <select
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name} ({e.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Schedule Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="isDayOffCheck"
                  checked={isDayOff}
                  onChange={(e) => setIsDayOff(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                />
                <label htmlFor="isDayOffCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Mark as Scheduled Day Off (Libur)
                </label>
              </div>

              {!isDayOff && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Select Shift Template</label>
                  <select
                    value={targetShiftId}
                    onChange={(e) => setTargetShiftId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.start_time} - {s.end_time}) &bull; {s.shift_type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
