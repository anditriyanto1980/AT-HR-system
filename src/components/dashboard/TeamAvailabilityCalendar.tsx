import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  Palmtree,
  Briefcase,
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  Plus,
  Plane,
  HeartPulse,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { LeaveRequest, Holiday, Employee } from '../../types';
import { formatDate } from '../../utils/attendance';

interface TeamAvailabilityCalendarProps {
  onNavigateTab?: (tab: string) => void;
  departmentFilterDefault?: string;
}

export const TeamAvailabilityCalendar: React.FC<TeamAvailabilityCalendarProps> = ({
  onNavigateTab,
  departmentFilterDefault = 'all',
}) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [currentDate, setCurrentDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDept, setSelectedDept] = useState<string>(departmentFilterDefault);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const departments = dataService.getDepartments();
  const employees = dataService.getEmployees();
  const leaveRequests: LeaveRequest[] = dataService.getLeaveRequests();
  const holidays: Holiday[] = dataService.getHolidays();
  const businessTrips = dataService.getBusinessTrips ? dataService.getBusinessTrips() : [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(todayStr);
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Helper: check if a date falls within start_date and end_date (inclusive)
  const isDateInRange = (checkDate: string, startDate: string, endDate: string) => {
    return checkDate >= startDate && checkDate <= endDate;
  };

  // Filtered leaves according to selected department
  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter((lr) => {
      if (lr.status !== 'APPROVED' && lr.status !== 'PENDING') return false;
      if (selectedDept !== 'all') {
        const emp = employees.find((e) => e.id === lr.employee_id);
        if (emp && emp.department_name !== selectedDept) return false;
        if (!emp && lr.department_name !== selectedDept) return false;
      }
      return true;
    });
  }, [leaveRequests, selectedDept, employees]);

  // People away today
  const awayToday = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      department: string;
      type: string;
      badgeColor: string;
      reason: string;
      period: string;
      status: string;
    }> = [];

    // Check leaves
    filteredLeaves.forEach((lr) => {
      if (isDateInRange(todayStr, lr.start_date, lr.end_date)) {
        const isSick = lr.leave_type_name?.toLowerCase().includes('sick') || lr.leave_type_id === 'lt-sick';
        list.push({
          id: lr.id,
          name: lr.employee_name || 'Karyawan',
          department: lr.department_name || 'Operasional',
          type: isSick ? 'Cuti Sakit' : 'Cuti Tahunan',
          badgeColor: isSick ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300',
          reason: lr.reason,
          period: `${formatDate(lr.start_date)} - ${formatDate(lr.end_date)}`,
          status: lr.status,
        });
      }
    });

    // Check business trips
    businessTrips.forEach((bt: any) => {
      if (bt.status === 'APPROVED' && isDateInRange(todayStr, bt.start_date, bt.end_date)) {
        if (selectedDept === 'all' || bt.department_name === selectedDept) {
          list.push({
            id: bt.id,
            name: bt.employee_name || 'Karyawan',
            department: bt.department_name || 'Operasional',
            type: 'Dinas Luar (SPPD)',
            badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
            reason: bt.purpose || bt.destination,
            period: `${formatDate(bt.start_date)} - ${formatDate(bt.end_date)}`,
            status: bt.status,
          });
        }
      }
    });

    return list;
  }, [filteredLeaves, businessTrips, todayStr, selectedDept]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon...
    // Adjust so Monday is 0, Sunday is 6
    const startDayIndex = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      holiday?: Holiday;
      leaves: LeaveRequest[];
    }> = [];

    // Previous month padding
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      const isWeekend = prevDate.getDay() === 0 || prevDate.getDay() === 6;
      const hol = holidays.find((h) => h.date === prevDateStr);
      const lvs = filteredLeaves.filter((l) => isDateInRange(prevDateStr, l.start_date, l.end_date));

      days.push({
        dateStr: prevDateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: prevDateStr === todayStr,
        isWeekend,
        holiday: hol,
        leaves: lvs,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const curDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isWeekend = curDate.getDay() === 0 || curDate.getDay() === 6;
      const hol = holidays.find((h) => h.date === curDateStr);
      const lvs = filteredLeaves.filter((l) => isDateInRange(curDateStr, l.start_date, l.end_date));

      days.push({
        dateStr: curDateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: curDateStr === todayStr,
        isWeekend,
        holiday: hol,
        leaves: lvs,
      });
    }

    // Remaining slots to make multiple of 7
    const remainder = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainder; i++) {
      const nextDate = new Date(year, month + 1, i);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      const isWeekend = nextDate.getDay() === 0 || nextDate.getDay() === 6;
      const hol = holidays.find((h) => h.date === nextDateStr);
      const lvs = filteredLeaves.filter((l) => isDateInRange(nextDateStr, l.start_date, l.end_date));

      days.push({
        dateStr: nextDateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: nextDateStr === todayStr,
        isWeekend,
        holiday: hol,
        leaves: lvs,
      });
    }

    return days;
  }, [year, month, filteredLeaves, holidays, todayStr]);

  // Selected date details
  const selectedDateEvents = useMemo(() => {
    const hol = holidays.find((h) => h.date === selectedDateStr);
    const leaves = filteredLeaves.filter((l) => isDateInRange(selectedDateStr, l.start_date, l.end_date));
    const trips = businessTrips.filter((bt: any) =>
      bt.status === 'APPROVED' &&
      isDateInRange(selectedDateStr, bt.start_date, bt.end_date) &&
      (selectedDept === 'all' || bt.department_name === selectedDept)
    );

    return { holiday: hol, leaves, trips };
  }, [selectedDateStr, holidays, filteredLeaves, businessTrips, selectedDept]);

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-lg shadow-slate-200/40 space-y-6">
      {/* 1. Top Section: Header, Month Selector, Department Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Kalender Ketersediaan Tim & Cuti Bersama
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Fitur 5 Unggulan
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pantau rekan kerja yang sedang cuti, dinas luar, atau libur nasional agar koordinasi tim tetap solid
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Month Switcher Controls */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-white text-slate-600 transition-all cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2 min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-white text-slate-600 transition-all cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-all cursor-pointer"
          >
            Hari Ini
          </button>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('leave')}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Ajukan Cuti</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Banner "Siapa yang Sedang Cuti Hari Ini" (Who's Away Today) */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50/50 rounded-2xl p-4 border border-indigo-100/70">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Rekan Kerja Tidak di Kantor Hari Ini ({formatDate(todayStr)})
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 font-mono">
            {awayToday.length} Karyawan
          </span>
        </div>

        {awayToday.length === 0 ? (
          <div className="text-xs text-slate-500 bg-white/80 rounded-xl p-3 border border-slate-200/80 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Semua rekan kerja hadir bertugas hari ini! Tidak ada yang sedang cuti atau dinas luar.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {awayToday.map((person) => (
              <div
                key={person.id}
                className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{person.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{person.department}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{person.reason}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${person.badgeColor}`}>
                    {person.type}
                  </span>
                  <div className="text-[9px] text-slate-400 mt-1 font-mono">{person.period}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Monthly Calendar Grid */}
      <div className="space-y-2">
        {/* Day Header Row: Sen s/d Min */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-500 pb-1">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, idx) => (
            <div
              key={day}
              className={`py-1.5 rounded-lg ${
                idx >= 5 ? 'text-rose-500 font-extrabold' : 'text-slate-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((item) => {
            const isSelected = item.dateStr === selectedDateStr;
            const hasLeaves = item.leaves.length > 0;
            const hasHoliday = !!item.holiday;

            return (
              <div
                key={item.dateStr}
                onClick={() => setSelectedDateStr(item.dateStr)}
                className={`min-h-[70px] sm:min-h-[85px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/40 shadow-xs'
                    : item.isToday
                    ? 'border-indigo-300 bg-indigo-50/20'
                    : item.isCurrentMonth
                    ? 'border-slate-200 bg-white hover:bg-slate-50'
                    : 'border-slate-100 bg-slate-50/50 text-slate-300'
                }`}
              >
                {/* Date Number and Badges */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold font-mono px-1 rounded-md ${
                      item.isToday
                        ? 'bg-indigo-600 text-white font-extrabold'
                        : hasHoliday
                        ? 'text-rose-600 font-black'
                        : item.isWeekend
                        ? 'text-rose-400 font-semibold'
                        : item.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-300'
                    }`}
                  >
                    {item.dayNumber}
                  </span>

                  {item.isToday && (
                    <span className="hidden sm:inline-block text-[9px] font-bold text-indigo-600 uppercase">
                      Hari Ini
                    </span>
                  )}
                </div>

                {/* Holiday Indicator */}
                {hasHoliday && (
                  <div
                    className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded px-1 py-0.5 truncate mt-0.5"
                    title={item.holiday?.name}
                  >
                    🔴 {item.holiday?.name}
                  </div>
                )}

                {/* Leaves Indicator */}
                {hasLeaves && (
                  <div className="space-y-0.5 mt-1">
                    {item.leaves.slice(0, 2).map((l) => (
                      <div
                        key={l.id}
                        className="text-[9px] font-bold px-1 py-0.5 rounded truncate bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                        title={`${l.employee_name}: ${l.leave_type_name || 'Cuti'} (${l.reason})`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{l.employee_name?.split(' ')[0]}</span>
                      </div>
                    ))}
                    {item.leaves.length > 2 && (
                      <div className="text-[8px] font-bold text-slate-500 text-center font-mono">
                        +{item.leaves.length - 2} rekan lagi
                      </div>
                    )}
                  </div>
                )}

                {/* Empty spacer if nothing */}
                {!hasHoliday && !hasLeaves && <div className="h-2" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Detail Panel for Selected Date */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h5 className="text-xs sm:text-sm font-bold text-slate-900">
              Detail Agenda Tanggal: {formatDate(selectedDateStr)}
            </h5>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {selectedDateEvents.leaves.length} Cuti • {selectedDateEvents.trips.length} Dinas •{' '}
            {selectedDateEvents.holiday ? '1 Hari Libur' : 'Hari Kerja Normal'}
          </span>
        </div>

        {/* If Holiday on this date */}
        {selectedDateEvents.holiday && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
              LIBUR
            </div>
            <div>
              <div className="font-bold text-rose-900">{selectedDateEvents.holiday.name}</div>
              <div className="text-[11px] text-rose-700">Hari Libur Resmi Nasional / Cuti Bersama Pemerintah</div>
            </div>
          </div>
        )}

        {/* If Leaves on this date */}
        {selectedDateEvents.leaves.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Karyawan Mengajukan Cuti:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedDateEvents.leaves.map((l) => (
                <div
                  key={l.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{l.employee_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {l.leave_type_name || 'Cuti'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{l.department_name}</span>
                    <span>•</span>
                    <span className="font-mono">{formatDate(l.start_date)} s/d {formatDate(l.end_date)}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 italic">
                    Alasan: &ldquo;{l.reason}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* If Business trips on this date */}
        {selectedDateEvents.trips.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Karyawan Tugas Dinas Luar (SPPD):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedDateEvents.trips.map((bt: any) => (
                <div
                  key={bt.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{bt.employee_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      Dinas Luar
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Tujuan: <b>{bt.destination}</b> ({formatDate(bt.start_date)} s/d {formatDate(bt.end_date)})
                  </div>
                  <div className="text-[11px] text-slate-600 italic">
                    Keperluan: &ldquo;{bt.purpose}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* If no events on this date */}
        {!selectedDateEvents.holiday && selectedDateEvents.leaves.length === 0 && selectedDateEvents.trips.length === 0 && (
          <div className="text-center py-4 text-xs text-slate-500">
            Tidak ada karyawan yang cuti atau bertugas luar pada tanggal ini. Seluruh tim tersedia.
          </div>
        )}
      </div>

      {/* 5. Legend footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-500 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Cuti Tahunan Disetujui</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Cuti Sakit / Izin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Dinas Luar (SPPD)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Libur Nasional / Cuti Bersama</span>
          </div>
        </div>
      </div>
    </div>
  );
};
