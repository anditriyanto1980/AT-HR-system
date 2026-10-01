import { AttendanceStatus, Shift } from '../types';

/**
 * Calculates attendance status (present vs late) and late minutes based on shift and clock-in time
 */
export function evaluateClockInStatus(
  clockInDate: Date,
  shift: Shift
): { status: AttendanceStatus; lateMinutes: number } {
  const [shiftHours, shiftMinutes] = shift.start_time.split(':').map(Number);

  // Create target shift start date based on clockInDate's day
  const shiftStart = new Date(clockInDate);
  shiftStart.setHours(shiftHours, shiftMinutes, 0, 0);

  // Compute difference in minutes
  const diffMs = clockInDate.getTime() - shiftStart.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes <= shift.tolerance_minutes) {
    // Within tolerance period (e.g. 10 minutes)
    return {
      status: 'present',
      lateMinutes: 0,
    };
  } else {
    // Exceeded tolerance
    return {
      status: 'late',
      lateMinutes: diffMinutes,
    };
  }
}

/**
 * Calculates work duration in minutes and early checkout minutes if applicable
 */
export function evaluateClockOut(
  clockInDate: Date,
  clockOutDate: Date,
  shift?: Shift
): {
  workDurationMinutes: number;
  earlyCheckoutMinutes: number;
  overtimeMinutes: number;
} {
  const durationMs = clockOutDate.getTime() - clockInDate.getTime();
  const workDurationMinutes = Math.max(0, Math.floor(durationMs / (1000 * 60)));

  let earlyCheckoutMinutes = 0;
  let overtimeMinutes = 0;

  if (shift) {
    const [shiftEndHours, shiftEndMinutes] = shift.end_time.split(':').map(Number);
    const shiftEnd = new Date(clockOutDate);
    shiftEnd.setHours(shiftEndHours, shiftEndMinutes, 0, 0);

    // If cross day shift and end time is smaller than start time
    if (shift.is_cross_day && shiftEnd < clockInDate) {
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }

    const diffToEndMs = shiftEnd.getTime() - clockOutDate.getTime();
    const diffToEndMinutes = Math.floor(diffToEndMs / (1000 * 60));

    if (diffToEndMinutes > 10) {
      earlyCheckoutMinutes = diffToEndMinutes;
    } else if (diffToEndMinutes < -30) {
      // Overtime if stayed more than 30 mins after shift end
      overtimeMinutes = Math.abs(diffToEndMinutes);
    }
  }

  return {
    workDurationMinutes,
    earlyCheckoutMinutes,
    overtimeMinutes,
  };
}

/**
 * Formats minutes into human readable string e.g. "8h 15m"
 */
export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Formats time from ISO string or Date to "HH:mm"
 */
export function formatTime(isoStringOrDate?: string | Date): string {
  if (!isoStringOrDate) return '--:--';
  const d = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Formats date to "DD MMM YYYY"
 */
export function formatDate(dateString?: string | Date): string {
  if (!dateString) return '-';
  const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
