import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const Differentiation = () => {
  const data = [
    { feature: 'Prime CEE (pour vous)', ecps: 'Déduite du devis, zéro avance', competitor1: 'Déduite du devis', competitor2: 'Déduite du devis', highlight: true },
    { feature: 'Visite technique sur site', ecps: 'Selon projet (à distance ou sur site)', competitor1: 'Oui (obligatoire)', competitor2: 'Oui (obligatoire)' },
    { feature: 'Délai d\'obtention du devis', ecps: '4 heures', competitor1: '2 semaines', competitor2: '1 semaine' },
    { feature: 'Reste à charge', ecps: '0 €', competitor1: '0 €', competitor2: '0 €' },
  ];

  return (
    <section className="section-padding bg-light-gray">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Pourquoi choisir ECPS ?</h2>
          <p className="text-xl text-gray-600">Plus rapide, plus simple. Voici la différence.</p>
        </motion.div>

        <motion.div
          className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600 uppercase">Caractéristique</th>
                  <th className="p-4 text-sm font-semibold text-white uppercase bg-primary rounded-t-lg">ECPS</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Hellio</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Effy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((row, index) => (
                  <tr key={index} className={`${row.highlight ? 'bg-blue-50' : ''}`}>
                    <td className="p-4 text-left font-medium text-gray-800">{row.feature}</td>
                    <td className={`p-4 font-bold ${row.highlight ? 'text-primary text-lg' : 'text-gray-900'}`}>{row.ecps}</td>
                    <td className="p-4 text-gray-600">{row.competitor1}</td>
                    <td className="p-4 text-gray-600">{row.competitor2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Differentiation;