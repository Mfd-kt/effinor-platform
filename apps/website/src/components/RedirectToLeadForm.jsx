import { Navigate, useLocation } from 'react-router-dom';
import { LEAD_FORM_PATH } from '@/lib/leadFormDestination';

/** Conserve la query string (utm, contexte formulaire). */
export function RedirectToLeadForm() {
  const { search } = useLocation();
  return <Navigate to={`${LEAD_FORM_PATH}${search}`} replace />;
}
