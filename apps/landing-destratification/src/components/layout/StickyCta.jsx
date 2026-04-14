import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pushEvent } from '@/lib/tracking';

const StickyCta = () => {
  const location = useLocation();
  const [showSticky, setShowSticky] = useState(false);
  const [isInForm, setIsInForm] = useState(false);
  const [isStep2Visible, setIsStep2Visible] = useState(false);
  const impressionSentRef = useRef(false);

  const isThankYou = location.pathname === '/merci';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const computeProgress = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      return scrollTop / scrollable;
    };

    const onScroll = () => {
      const progress = computeProgress();
      setShowSticky(progress > 0.25);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById('form-container');
    if (!el) return;

    const updateStep = () => {
      const step = el.getAttribute('data-form-step') || el.dataset.formStep || '';
      setIsStep2Visible(String(step) === '2');
    };

    updateStep();
    const mo = new MutationObserver(updateStep);
    mo.observe(el, { attributes: true, attributeFilter: ['data-form-step'] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById('form-container');
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInForm(Boolean(entry?.isIntersecting));
      },
      { root: null, threshold: 0.1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isSubmitState = isInForm && isStep2Visible;

  const label = useMemo(() => {
    return isSubmitState ? "Valider & recevoir mon étude" : "Calculer mon éligibilité CEE";
  }, [isSubmitState]);

  useEffect(() => {
    if (isThankYou) return;
    if (!showSticky) return;
    if (impressionSentRef.current) return;
    impressionSentRef.current = true;
    pushEvent('sticky_impression', { variant: 'smart' });
  }, [isThankYou, showSticky]);

  const handleClick = () => {
    pushEvent('sticky_click', { variant: 'smart', state: isSubmitState ? 'in_form' : 'to_form' });

    if (isSubmitState) {
      const form = document.getElementById('eligibility-step2-form');
      if (form && typeof form.requestSubmit === 'function') {
        form.requestSubmit();
        return;
      }
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return;
      }
    }

    const form = document.getElementById('form-container');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isThankYou || !showSticky) return null;

  return (
    <>
      {/* Mobile full-width CTA */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-orange-500 text-white p-3 md:hidden z-40 shadow-lg"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center justify-center w-full text-center font-bold text-lg"
        >
          <Phone className="w-5 h-5 mr-3" />
          {label}
        </button>
      </motion.div>

      {/* Desktop bottom-right CTA */}
      <motion.div
        className="hidden md:flex fixed bottom-6 right-6 z-40"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120 }}
      >
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm md:text-base px-5 py-3 rounded-full shadow-lg"
        >
          <Phone className="w-4 h-4" />
          {label}
        </button>
      </motion.div>
    </>
  );
};

export default StickyCta;