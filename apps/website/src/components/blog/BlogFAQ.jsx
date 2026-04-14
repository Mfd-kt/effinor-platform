import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/**
 * FAQ accordion pour les articles de blog.
 * Génère aussi le JSON-LD FAQPage en inline script.
 *
 * Props:
 *   items — Array<{ q: string, a: string }>
 */
const BlogFAQ = ({ items = [] }) => {
  const [open, setOpen] = useState(null);

  if (!items.length) return null;

  const toggle = (i) => setOpen(open === i ? null : i);

  const jsonLd = {
    '@context':   'https://schema.org',
    '@type':      'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type':          'Question',
      name:             q,
      acceptedAnswer:   { '@type': 'Answer', text: a },
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <section className="my-8 md:my-10" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="mb-4 text-xl font-bold text-gray-900 md:text-2xl">
        Questions fréquentes
      </h2>

      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 overflow-hidden">
        {items.map(({ q, a }, i) => (
          <div key={i} className="bg-white">
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left text-gray-900 font-semibold text-sm md:text-base hover:bg-gray-50 transition-colors"
              aria-expanded={open === i}
            >
              <span>{q}</span>
              <motion.span
                animate={{ rotate: open === i ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 text-primary-600"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 pt-1 text-gray-600 text-sm leading-relaxed">
                    {a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
    </>
  );
};

export default BlogFAQ;
