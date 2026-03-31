import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export function useReminder() {
  const { profile } = useAuth();
  const lastNotifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profile?.reminder_enabled || !profile?.reminder_time) return;
    if (!('Notification' in window)) return;

    const checkTime = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = now.toDateString();

      if (currentTime === profile.reminder_time && lastNotifiedRef.current !== today) {
        lastNotifiedRef.current = today;
        if (Notification.permission === 'granted') {
          new Notification('🕌 Spiritual Reminder', {
            body: 'Time for your daily Quran reflection. Your soul deserves this moment of peace.',
            icon: '/placeholder.svg',
          });
        }
      }
    };

    const interval = setInterval(checkTime, 30_000); // check every 30s
    checkTime();
    return () => clearInterval(interval);
  }, [profile?.reminder_enabled, profile?.reminder_time]);
}
