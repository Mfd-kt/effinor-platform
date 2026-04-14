import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const Faq = () => {
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    { 
      question: "L'installation est-elle vraiment 100% gratuite ?", 
      answer: "Oui. Grâce au dispositif des Certificats d'Économies d'Énergie (CEE), l'opération est entièrement financée par les 'pollueurs-obligés'. Vous n'avez aucun reste à charge, ni aucune avance de frais." 
    },
    { 
      question: "Pourquoi n'y a-t-il pas de visite technique ?", 
      answer: "Notre processus optimisé nous permet de réaliser un dimensionnement précis à distance grâce aux informations et photos que vous nous fournissez. Cela nous permet de vous donner un devis en 4h et d'accélérer l'installation, tout en vous faisant gagner du temps." 
    },
    { 
      question: "Combien de temps dure l'installation ?", 
      answer: "L'installation est très rapide. En moyenne, elle dure entre 1 et 3 jours et est planifiée pour ne pas perturber votre activité. Pas d'arrêt de production nécessaire !" 
    },
    { 
      question: "Ça marche aussi en été ?", 
      answer: "Absolument ! En été, le destratificateur crée une légère brise qui peut faire baisser la température ressentie jusqu'à 4°C, améliorant le confort de vos équipes sans les coûts d'une climatisation." 
    },
    { 
      question: "Mon bâtiment fait 4,8m de haut, suis-je éligible ?", 
      answer: "La hauteur minimale standard pour la fiche CEE est de 5m. Cependant, des dérogations sont parfois possibles. Remplissez le formulaire, un expert étudiera votre cas spécifique et vous donnera une réponse claire et gratuite."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section id="faq" className="section-padding bg-white">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Vos questions, nos réponses</h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              className="bg-light-gray rounded-lg card-shadow overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-200 transition-colors"
                onClick={() => toggleFaq(index)}
              >
                <h3 className="font-semibold text-gray-800 text-lg">{faq.question}</h3>
                {openFaq === index ? (
                  <ChevronUp className="w-6 h-6 text-primary" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-500" />
                )}
              </button>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: openFaq === index ? 'auto' : 0, opacity: openFaq === index ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-2">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;