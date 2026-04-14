import React from 'react';
import { motion } from 'framer-motion';
import { Camera, FileSearch, FileCheck, Wrench, Ruler, Thermometer, Mic, Wind, FileText, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Section from '@/components/layout/Section';

const steps = [
  { icon: Camera, label: 'Audit & dimensionnement', desc: 'Photos et données du bâtiment ; visite sur site organisée si nécessaire pour votre projet.' },
  { icon: FileSearch, label: 'Dimensionnement', desc: 'Bureau d\'études dédié : volume, usage, puissance chauffage.' },
  { icon: FileCheck, label: 'Dépôt dossier CEE', desc: 'Nous déposons le dossier CEE ; la prime est déduite de votre devis, sans avance de trésorerie.' },
  { icon: Wrench, label: 'Installation RGE', desc: 'Pose par installateur qualifié, planifiée hors production.' },
];

const criteria = [
  { icon: Ruler, text: 'Hauteur sous plafond ≥ 5 mètres dans le local à traiter.' },
  { icon: Thermometer, text: 'Thermostat ou asservissement à une mesure de température en partie haute.' },
  { icon: Mic, text: 'Niveau sonore de l\'équipement inférieur à 45 dB(A).' },
  { icon: Wind, text: 'Vitesse de flux d\'air au sol entre 0,1 et 0,3 m/s.' },
  { icon: FileText, text: 'Note de dimensionnement fournie par un professionnel qualifié.' },
];

const Credibilite = () => {
  return (
    <Section variant="soft">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-gray-900 mb-10 text-center"
        >
          Pourquoi c'est crédible
        </motion.h2>

        {/* Timeline horizontale 1→4 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-10"
        >
          <div className="hidden md:flex items-center justify-between gap-4 relative mb-4">
            <div className="absolute left-4 right-4 top-1/2 h-[2px] bg-blue-100 -z-10" />
            {['Audit gratuit', 'Validation CEE', 'Installation rapide', 'Économies immédiates'].map((label, index) => (
              <div key={label} className="flex flex-col items-center flex-1">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow">
                  {index + 1}
                </div>
                <p className="mt-2 text-xs font-semibold text-gray-800 text-center">{label}</p>
              </div>
            ))}
          </div>
          <div className="md:hidden flex flex-col gap-3">
            {['Audit gratuit', 'Validation CEE', 'Installation rapide', 'Économies immédiates'].map((label, index) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mb-3">
                <s.icon className="w-6 h-6" />
              </div>
              <p className="font-semibold text-gray-900">{s.label}</p>
              <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-section-card mb-8"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                Conformité réglementaire officielle
              </h3>
              <p className="text-sm text-gray-700">
                Fiches officielles CEE&nbsp;
                <a href="https://www.ecologie.gouv.fr/sites/default/files/documents/BAT-TH-142%20vA54-3%20%C3%A0%20compter%20du%2001-01-2024.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">BAT-TH-142</a>
                {' / '}
                <a href="https://www.ecologie.gouv.fr/sites/default/files/documents/IND-BA-110%20v69-3%20%C3%A0%20compter%20du%2001-07-2025%20D%C3%A9stratificateur%20ou%20brasseur%20d%E2%80%99air.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">IND-BA-110</a>.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-800">
                Dispositif officiel Certificats d'Économies d'Énergie
              </span>
            </div>
          </div>
          <ul className="space-y-3">
            {criteria.map((c, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 rounded-lg bg-white border border-gray-200">
                  <c.icon className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-gray-700 text-sm">{c.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg p-4"
        >
          <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900 mb-1">Transparence des démarches</p>
            <p className="text-sm text-gray-700">
              Nous déposons le dossier CEE pour vous. Délai de traitement habituel : quelques semaines. 
              En cas de refus d'éligibilité (rare si critères respectés), nous vous proposons un devis classique — aucun engagement avant signature.
              Installation réalisée par des professionnels qualifiés RGE.
            </p>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

export default Credibilite;
