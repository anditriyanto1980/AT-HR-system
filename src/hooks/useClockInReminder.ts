import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';

export function useClockInReminder(onNavigateTab?: (tab: string) => void) {
  const { currentUser } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isReminderEnabled, setIsReminderEnabled] = useState<boolean>(() =>
    notificationService.isReminderEnabled()
  );

  // Sync initial permission status
  useEffect(() => {
    setPermission(notificationService.getPermissionStatus());
  }, []);

  // Periodic checker: evaluates whether employee hasn't clocked in past shift start time
  useEffect(() => {
    if (!currentUser) return;

    // Check immediately on mount/login
    notificationService.checkAndTriggerClockInReminder(currentUser, onNavigateTab);

    // Check periodically every 30 seconds
    const interval = setInterval(() => {
      notificationService.checkAndTriggerClockInReminder(currentUser, onNavigateTab);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser, onNavigateTab, isReminderEnabled]);

  // Request browser permission
  const requestPushPermission = useCallback(async () => {
    const res = await notificationService.requestPermission();
    setPermission(res);
    return res;
  }, []);

  // Toggle reminder enabled
  const toggleReminderEnabled = useCallback((enabled: boolean) => {
    notificationService.setReminderEnabled(enabled);
    setIsReminderEnabled(enabled);
  }, []);

  // Manual test trigger (For Testing & Demonstration)
  const triggerTestReminder = useCallback(() => {
    if (!currentUser) return false;
    return notificationService.triggerTestClockInReminder(currentUser, onNavigateTab);
  }, [currentUser, onNavigateTab]);

  return {
    permission,
    isReminderEnabled,
    requestPushPermission,
    toggleReminderEnabled,
    triggerTestReminder,
  };
}
