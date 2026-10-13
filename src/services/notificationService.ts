import { Employee, Shift } from '../types';
import { dataService } from './dataService';

export interface ClockInReminderEventDetail {
  userName: string;
  shiftName: string;
  startTime: string;
  isTest?: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private readonly REMINDER_STORAGE_KEY = 'athr_last_clockin_reminder_date';
  private readonly REMINDER_PREF_KEY = 'athr_push_reminder_enabled';

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Check if the browser supports native Web Notification API
   */
  public isPushSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Check current browser notification permission
   */
  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isPushSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request permission from user to display browser push notifications
   */
  public async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isPushSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.setReminderEnabled(true);
      }
      return permission;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  /**
   * Check if user has opted in for clock-in reminders
   */
  public isReminderEnabled(): boolean {
    const val = localStorage.getItem(this.REMINDER_PREF_KEY);
    return val !== 'false'; // Default enabled
  }

  /**
   * Toggle or set reminder preference
   */
  public setReminderEnabled(enabled: boolean): void {
    localStorage.setItem(this.REMINDER_PREF_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('reminder_pref_changed', { detail: enabled }));
  }

  /**
   * Play gentle notification sound chime using Web Audio API & optional vibration
   */
  public playChime(): void {
    try {
      if (typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.connect(gain);
          gain.connect(ctx.destination);

          // Two-tone pleasant chime (F5 -> A5)
          osc.frequency.setValueAtTime(698.46, now); // F5
          osc.frequency.setValueAtTime(880.0, now + 0.12); // A5

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

          osc.start(now);
          osc.stop(now + 0.55);
        }

        // Haptic feedback if supported on smartphone
        if (navigator.vibrate) {
          navigator.vibrate([150, 75, 150]);
        }
      }
    } catch {
      // Audio playback may be restricted if user hasn't interacted with page yet
    }
  }

  /**
   * Send native Web Browser Push Notification
   */
  public sendBrowserNotification(
    title: string,
    options: NotificationOptions,
    onClick?: () => void
  ): boolean {
    if (!this.isPushSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notif = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        onClick?.();
        notif.close();
      };
      return true;
    } catch (err) {
      console.warn('Unable to create native Notification:', err);
      return false;
    }
  }

  /**
   * Core logic: evaluate whether employee needs a clock-in reminder right now
   * Checks current time against shift start time and today's attendance records.
   */
  public checkAndTriggerClockInReminder(
    user: Employee,
    onNavigateTab?: (tab: string) => void
  ): boolean {
    if (!user || !this.isReminderEnabled()) return false;

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Check if already clocked in today
    const todayAtt = dataService.getTodayAttendance(user.id, todayStr);
    if (todayAtt?.clock_in_time) {
      return false; // Already clocked in, no reminder needed
    }

    // 2. Prevent spam: max once per day automatically
    const lastReminderDate = localStorage.getItem(this.REMINDER_STORAGE_KEY);
    if (lastReminderDate === todayStr) {
      return false; // Already reminded today
    }

    // 3. Get active shift
    const shifts = dataService.getShifts();
    const activeShift = shifts.find((s) => s.is_active) || shifts[0];
    if (!activeShift) return false;

    // 4. Compare current time with shift start time (e.g. "08:00")
    const now = new Date();
    const [startHour, startMin] = (activeShift.start_time || '08:00')
      .split(':')
      .map((n) => parseInt(n, 10));

    const shiftStartDate = new Date(now);
    shiftStartDate.setHours(startHour, startMin, 0, 0);

    // Trigger reminder if current time is within 15 minutes before shift or past shift start
    const diffMinutes = (now.getTime() - shiftStartDate.getTime()) / (1000 * 60);

    // If time is within 15 mins before shift or up to 4 hours after shift start
    if (diffMinutes >= -15 && diffMinutes <= 240) {
      this.executeClockInReminder(user, activeShift, false, onNavigateTab);
      localStorage.setItem(this.REMINDER_STORAGE_KEY, todayStr);
      return true;
    }

    return false;
  }

  /**
   * Manually trigger a clock-in reminder notification (For Testing & Simulation)
   */
  public triggerTestClockInReminder(
    user: Employee,
    onNavigateTab?: (tab: string) => void
  ): boolean {
    if (!user) return false;
    const shifts = dataService.getShifts();
    const activeShift = shifts.find((s) => s.is_active) || shifts[0];
    this.executeClockInReminder(user, activeShift, true, onNavigateTab);
    return true;
  }

  /**
   * Internal helper: Dispatches sound, browser push, in-app notification & toast
   */
  private executeClockInReminder(
    user: Employee,
    shift: Shift | undefined,
    isTest = false,
    onNavigateTab?: (tab: string) => void
  ): void {
    const shiftName = shift?.name || 'Shift Reguler';
    const startTime = shift?.start_time || '08:00';
    const title = isTest
      ? '⏰ [Uji Coba] Waktunya Absen Masuk!'
      : `⏰ Pengingat: Jam Masuk (${startTime} WIB) Telah Dimulai!`;

    const body = `Halo ${user.full_name}, Anda belum melakukan Clock In untuk ${shiftName}. Segera lakukan absensi selfie live sekarang agar kehadiran tercatat tepat waktu!`;

    // 1. Play audio chime
    this.playChime();

    // 2. Send Native Web Push Notification (if permission granted)
    this.sendBrowserNotification(
      title,
      {
        body,
        tag: 'clock-in-reminder',
        requireInteraction: true,
      },
      () => {
        onNavigateTab?.('clock-in');
      }
    );

    // 3. Save into App Notification Center (Header Bell)
    dataService.addNotification({
      user_id: user.id,
      title,
      message: body,
      type: 'ACTION_REQUIRED',
      target_tab: 'clock-in',
      read: false,
    });

    // 4. Dispatch in-app floating banner event for immediate UI feedback
    const detail: ClockInReminderEventDetail = {
      userName: user.full_name,
      shiftName,
      startTime,
      isTest,
    };

    window.dispatchEvent(
      new CustomEvent('clockin_reminder_triggered', {
        detail,
      })
    );
  }
}

export const notificationService = NotificationService.getInstance();
