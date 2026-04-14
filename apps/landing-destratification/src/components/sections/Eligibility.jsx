import React from 'react';
import { motion } from 'framer-motion';
import { Check, Thermometer, Mic, Wind, Ruler, FileText } from 'lucide-react';

const Eligibility = () => {
  const criteria = [
    { icon: <Ruler className="w-8 h-8 text-primary" />, text: "<strong>Hauteur sous plafond ≥ 5 mètres</strong> dans le local à traiter." },
    { icon: <Thermometer className="w-8 h-8 text-primary" />, text: "<strong>Thermostat</strong> ou asservissement à une mesure de température en partie haute." },
    { icon: <Mic className="w-8 h-8 text-primary" />, text: "Niveau sonore de l'équipement <strong>inférieur à 45 dB(A)</strong>." },
    { icon: <Wind className="w-8 h-8 text-primary" />, text: "Vitesse de flux d'air au sol contrôlée (<strong>entre 0,1 et 0,3 m/s</strong>)." },
    { icon: <FileText className="w-8 h-8 text-primary" />, text: "<strong>Note de dimensionnement</strong> fournie par un professionnel qualifié." },
  ];

  return (
    <section id="eligibilite" className="section-padding bg-light-gray">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Éligibilité à la Fiche CEE BAT-TH-142 (fiche CEE officielle)</h2>
          <p className="text-xl text-gray-600">Assurez-vous que votre projet respecte les critères pour bénéficier de l'aide.</p>
        </motion.div>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            {criteria.map((item, index) => (
              <motion.div
                key={index}
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 mr-4">
                  {item.icon}
                </div>
                <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: item.text }}></p>
              </motion.div>
            ))}
          </div>
          <motion.div
            className="mt-8 text-center bg-blue-50 p-6 rounded-lg border border-blue-200"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h3 className="font-bold text-lg text-gray-800 mb-2">Le saviez-vous ?</h3>
            <p className="text-gray-600">Le système ne doit pas produire de chaleur lui-même ; son rôle est de redistribuer la chaleur déjà présente pour une <strong>homogénéisation de la température</strong> optimale. C'est la clé des <strong>économies d'énergie en tertiaire</strong>.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Eligibility;