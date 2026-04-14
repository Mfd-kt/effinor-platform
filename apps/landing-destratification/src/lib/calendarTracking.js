import { useEffect } from 'react';
import { pushEvent } from '@/lib/tracking';

export const CALENDAR_URL = 'https://calendar.app.google/ZCYyXGu4wvMURhJr7';
const CALENDAR_STORAGE_KEY = 'calendar_opened_at';
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

/**
 * Ouvre le calendrier de prise de rendez-vous avec tracking GA4 + GTM.
 * - Enregistre un flag en localStorage pour détecter le retour (calendar_return).
 * - Pousse l'événement calendar_open.
 */
export function openCalendarWithTracking(position, method = 'google_calendar') {
  if (typeof window === 'undefined') return;

  try {
    const payload = {
      ts: Date.now(),
      position,
    };
    window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {}

  pushEvent('calendar_open', {
    position,
    method,
    url: CALENDAR_URL,
  });

  try {
    window.open(CALENDAR_URL, '_blank', 'noopener,noreferrer');
  } catch (_) {
    // fallback minimal : lien direct
    window.location.href = CALENDAR_URL;
  }
}

/**
 * Hook global à placer au niveau App pour détecter le retour après ouverture du calendrier.
 * Écoute visibilitychange + focus, et envoie calendar_return si retour < 30 minutes.
 */
export function useCalendarReturnTracking() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = () => {
      try {
        const raw = window.localStorage.getItem(CALENDAR_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        const ts = parsed?.ts;
        const position = parsed?.position || 'unknown';
        if (!ts) {
          window.localStorage.removeItem(CALENDAR_STORAGE_KEY);
          return;
        }

        const now = Date.now();
        const diffMs = now - ts;
        if (diffMs <= 0 || diffMs > THIRTY_MINUTES_MS) {
          window.localStorage.removeItem(CALENDAR_STORAGE_KEY);
          return;
        }

        const minutesSinceOpen = Math.round(diffMs / 60000);

        pushEvent('calendar_return', {
          position,
          minutes_since_open: minutesSinceOpen,
        });

        window.localStorage.removeItem(CALENDAR_STORAGE_KEY);
      } catch (_) {}
    };

    window.addEventListener('visibilitychange', handler);
    window.addEventListener('focus', handler);

    return () => {
      window.removeEventListener('visibilitychange', handler);
      window.removeEventListener('focus', handler);
    };
  }, []);
}

