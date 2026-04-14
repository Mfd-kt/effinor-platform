import React from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FaqSection = ({ faqItems }) => {
  return (
    <section id="faq" className="py-16 md:py-24 bg-slate-100 dark:bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y:20 }} whileInView={{ opacity: 1, y:0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-3xl text-center font-bold mb-12"
        >
          Trop beau pour être vrai ? On répond à tout.
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto bg-white dark:bg-slate-800/50 p-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index} className={index === faqItems.length - 1 ? "border-b-0" : ""}>
                <AccordionTrigger className="text-left hover:no-underline px-6 text-slate-800 dark:text-slate-100 font-semibold">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="px-6 text-slate-600 dark:text-slate-400 prose dark:prose-invert max-w-none">
                  <p>{item.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FaqSection;