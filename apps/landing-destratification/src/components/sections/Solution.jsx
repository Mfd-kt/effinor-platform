import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Users, BadgeCheck } from 'lucide-react';
const Solution = () => {
  return <section className="section-padding bg-light-gray">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{
          opacity: 0,
          x: -50
        }} whileInView={{
          opacity: 1,
          x: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
              La solution : le destratificateur d'air. Simple, efficace, financé.
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Le destratificateur récupère l'air chaud accumulé en hauteur et le redirige en douceur vers le sol. Il homogénéise la température de votre bâtiment pour un confort optimal et des économies immédiates.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <TrendingDown className="w-8 h-8 text-green-500 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">15 à 30% d'économies</h3>
                  <p className="text-gray-600">Réduisez drastiquement votre consommation de chauffage.</p>
                </div>
              </div>
              <div className="flex items-start">
                <Users className="w-8 h-8 text-blue-500 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Confort amélioré</h3>
                  <p className="text-gray-600">Offrez un environnement de travail agréable à vos salariés et clients.</p>
                </div>
              </div>
              <div className="flex items-start">
                <BadgeCheck className="w-8 h-8 text-primary mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Financement CEE à 100%</h3>
                  <p className="text-gray-600">L'installation est entièrement prise en charge, sans aucun reste à charge pour vous.</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <img alt="Photo d'un destratificateur d'air industriel suspendu au plafond" loading="lazy" src="https://horizons-cdn.hostinger.com/543865db-43d7-4121-9236-45edc785718c/10-1024x1024-glY1e.jpg" />
          </motion.div>
        </div>
      </div>
    </section>;
};
export default Solution;