import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Wrench, Gift } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <FileText className="w-12 h-12 text-primary" />,
      title: "Audit gratuit",
      description: "Nos experts vérifient votre éligibilité et évaluent les besoins spécifiques de votre bâtiment."
    },
    {
      icon: <Wrench className="w-12 h-12 text-primary" />,
      title: "Installation rapide",
      description: "Nos techniciens certifiés installent le matériel sans perturber votre activité."
    },
    {
      icon: <Gift className="w-12 h-12 text-primary" />,
      title: "Zéro reste à charge",
      description: "Grâce à la subvention CEE, l'intégralité de la prestation est financée. Vous ne payez rien."
    }
  ];

  return (
    <section id="comment-ca-marche" className="section-padding bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Comment ça marche ?</h2>
          <p className="text-xl text-gray-600">Un processus simple en 3 étapes pour des économies garanties.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 text-center">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative"
            >
              <div className="flex justify-center items-center mb-4">
                <div className="bg-blue-100 rounded-full p-4">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 left-full transform -translate-y-1/2 w-full">
                  <svg className="w-full text-gray-300" fill="none" viewBox="0 0 100 2">
                    <path stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" d="M0 1h100" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;