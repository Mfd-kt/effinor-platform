import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Building2 } from 'lucide-react';
import Section from '@/components/layout/Section';

const cases = [
  {
    type: 'Entrepôt logistique',
    surface: '2 500 m²',
    hsp: '8 m',
    heating: 'Gaz',
    economy: '22 000 €/an',
    reduction: '-28 %',
    installDays: '2 jours',
  },
  {
    type: 'Gymnase municipal',
    surface: '1 200 m²',
    hsp: '9 m',
    heating: 'Fioul',
    economy: '8 500 €/an',
    reduction: '-24 %',
    installDays: '1 jour',
  },
  {
    type: 'Usine agroalimentaire',
    surface: '4 800 m²',
    hsp: '11 m',
    heating: 'Gaz',
    economy: '41 000 €/an',
    reduction: '-31 %',
    installDays: '3 jours',
  },
];

const CasClients = () => {
  return (
    <Section variant="page">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center"
        >
          3 cas documentés — données réelles
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-gray-600 text-center mb-10"
        >
          Bâtiments professionnels équipés en déstratification. Résultats mesurés sur facture.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6">
          {cases.map((c, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 shadow-section-card hover:shadow-section-card-hover transition-shadow overflow-hidden flex flex-col"
            >
              <div className="h-32 w-full overflow-hidden">
                <img
                  src={
                    index === 0
                      ? 'https://adarsolutions.fr/wp-content/uploads/2025/02/photo-qu-est-ce-qu-destratificateur.webp'
                      : index === 1
                      ? 'https://cdn-s-www.leprogres.fr/images/69C606BF-92BE-4F49-B046-1A96E025EEDE/MF_contenu/economies-d-energie-six-batiments-equipes-de-destratificateurs-d-air-a-saint-just-saint-rambert-1697130523.jpg'
                      : 'https://www.polypoles.com/wp-content/uploads/2024/06/instal-destrat-CEE-solidays.jpg'
                  }
                  alt={c.type}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-gray-700 text-sm font-semibold">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span>{c.type}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Résultat mesuré</span>
                  </div>
                </div>
                <p className="font-bold text-gray-900 text-base mb-3">{c.surface} · HSP {c.hsp} · {c.heating}</p>
              <ul className="space-y-2 text-sm text-gray-700 mb-4 flex-grow">
                <li>Surface : <span className="font-medium text-gray-900">{c.surface}</span></li>
                <li>Hauteur sous plafond : <span className="font-medium text-gray-900">{c.hsp}</span></li>
                <li>Chauffage : <span className="font-medium text-gray-900">{c.heating}</span></li>
              </ul>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-lg font-bold text-emerald-700">{c.economy}</p>
                <p className="text-sm text-gray-600">{c.reduction} sur la facture — Installation : {c.installDays}</p>
              </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default CasClients;
