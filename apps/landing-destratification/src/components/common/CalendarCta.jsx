import React from 'react';
import { openCalendarWithTracking, CALENDAR_URL } from '@/lib/calendarTracking';

/**
 * CTA réutilisable pour ouvrir le calendrier de prise de rendez-vous.
 *
 * Props:
 * - position: 'hero' | 'sticky' | 'form' | 'post_submit' | string (emplacement de l'appel)
 * - variant: 'button' | 'link'
 * - className: classes Tailwind additionnelles
 * - label: texte du CTA (sinon children, sinon libellé par défaut)
 */
const CalendarCta = ({ position, variant = 'button', className = '', label, children }) => {
  const handleClick = (event) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    openCalendarWithTracking(position, 'google_calendar');
  };

  const content = children || label || 'Choisir un créneau de rappel';

  if (variant === 'link') {
    return (
      <a
        href={CALENDAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {content}
    </button>
  );
};

export default CalendarCta;

