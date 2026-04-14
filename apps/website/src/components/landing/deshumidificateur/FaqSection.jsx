import React from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FaqSection = () => {
  const faqItems = [
    { 
      q: "Quel est le prix d'un déshumidificateur industriel ?", 
      a: "Le prix varie selon la taille de votre bâtiment, la puissance nécessaire et les options choisies. Contactez-nous pour un devis personnalisé gratuit adapté à vos besoins spécifiques. Nous proposons des solutions rentables avec un retour sur investissement rapide grâce aux économies d'énergie générées." 
    },
    { 
      q: "Quels types de bâtiments sont éligibles ?", 
      a: "Tous les bâtiments professionnels peuvent bénéficier de nos solutions : usines, entrepôts, bâtiments agricoles, serres, salles de sport, centres commerciaux, etc. Le mieux est de remplir notre formulaire pour un diagnostic gratuit et rapide adapté à votre situation spécifique." 
    },
    { 
      q: "Quelle est la garantie sur l'équipement ?", 
      a: "Nos déshumidificateurs industriels bénéficient d'une garantie complète incluant pièces et main-d'œuvre. Notre équipe assure également un suivi technique et une assistance continue pour garantir le bon fonctionnement de votre installation." 
    },
    { 
      q: "Y a-t-il des coûts cachés ou un abonnement ?", 
      a: "Non, aucun coût caché ni abonnement. Le prix que nous vous proposons est transparent et inclut l'équipement, l'installation par nos experts certifiés, et la garantie. Vous profitez ensuite des économies d'énergie générées sans aucun frais supplémentaire." 
    },
    { 
      q: "Combien de temps prend l'installation ?", 
      a: "L'installation se fait généralement en une journée et peut être programmée sous 10 jours ouvrés après validation de votre éligibilité. Nos équipes sont formées pour intervenir rapidement et efficacement." 
    },
    { 
      q: "Quels sont les bénéfices pour mon activité ?", 
      a: "Un déshumidificateur industriel améliore la qualité de l'air, réduit les risques de condensation, protège vos équipements et matériaux, et crée un environnement de travail plus sain pour vos équipes. Tout cela en réduisant votre consommation énergétique." 
    },
  ];

  return (
    <section id="faq" className="py-16 md:py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl text-center font-bold mb-12"
        >
          Des questions ? On répond à tout.
        </motion.h2>
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto bg-white dark:bg-slate-800/50 p-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem 
                value={`item-${index}`} 
                key={index} 
                className={index === faqItems.length - 1 ? "border-b-0" : ""}
              >
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



