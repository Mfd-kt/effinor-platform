import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildLeadFormHref } from '@/lib/leadFormDestination';

/**
 * Point d'entrée "simulateur" : redirige vers le formulaire lead.
 */
const Simulator = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(
      buildLeadFormHref({
        source: 'simulateur',
        project: 'cee',
        cta: 'landing',
        page: '/simulateur',
      }),
      { replace: true },
    );
  }, [navigate]);
  return null;
};

export default Simulator;
