import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const SocialProof = () => {
    const caseStudies = [
        {
            image: "A factory manager smiling in a warehouse",
            alt: "Portrait de Marc L., directeur de site logistique",
            name: "Marc L.",
            title: "Directeur de site logistique (2500 m²)",
            quote: "Un investissement nul pour un gain immédiat. Le confort est incomparable et les économies sont réelles. La prime CEE déduite directement du devis, sans rien avancer, nous a convaincus.",
            result: "-28% sur la facture de gaz"
        },
        {
            image: "A female municipal equipment manager standing in a gymnasium",
            alt: "Portrait de Sylvie D., gestionnaire d'équipements sportifs",
            name: "Sylvie D.",
            title: "Gestionnaire gymnase (1200 m²)",
            quote: "L'amélioration du confort a été immédiate. Nous avons pu baisser le chauffage tout en ayant de meilleurs retours des usagers. L'équipe s'est adaptée à notre planning pour le dimensionnement et l'installation.",
            result: "+2°C ressentis au sol"
        },
        {
            image: "A supermarket manager in a grocery store aisle",
            alt: "Portrait de Karim B., directeur de supermarché",
            name: "Karim B.",
            title: "Directeur de supermarché (3000 m²)",
            quote: "Une solution simple et efficace. Nos clients ne se plaignent plus des courants d'air froids dans les allées, et le devis reçu en quelques heures nous a permis d'avancer très vite.",
            result: "-22% sur la consommation électrique"
        }
    ];

  return (
    <section className="section-padding bg-light-gray">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Plus de 100 entreprises nous ont déjà fait confiance</h2>
          <p className="text-xl text-gray-600">Voici ce que nos clients disent de nous.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {caseStudies.map((study, index) => (
            <motion.div 
              key={index} 
              className="bg-white p-8 rounded-2xl shadow-xl flex flex-col transform hover:scale-105 transition-transform duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex-grow mb-6">
                <p className="text-gray-700 italic text-lg">"{study.quote}"</p>
              </div>
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-primary">
                  <img alt={study.alt} loading="lazy" src="https://images.unsplash.com/photo-1601429675201-f66be94607bb" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{study.name}</p>
                  <p className="text-sm text-gray-600">{study.title}</p>
                   <div className="flex mt-1">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />)}
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-r-lg">
                <p className="font-bold text-lg">Résultat : {study.result}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;