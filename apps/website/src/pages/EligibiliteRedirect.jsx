import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildLeadFormHref } from '@/lib/leadFormDestination';

const EligibiliteRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(
      buildLeadFormHref({
        source: 'eligibilite',
        project: 'cee',
        cta: 'redirect',
        page: '/eligibilite',
      }),
      { replace: true },
    );
  }, [navigate]);
  return null;
};

export default EligibiliteRedirect;
