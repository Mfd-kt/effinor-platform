import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: "Thomas L.",
    location: "Ferme des Lilas (44)",
    quote: "On n’y croyait pas : installation gratuite, et depuis, nos tomates poussent comme jamais ! Moins de maladies, plus de rendement. Zéro euro dépensé.",
    image: "Un homme souriant dans une serre de tomates",
  },
  {
    name: "Sophie D.",
    location: "Horticulture du Sud (83)",
    quote: "L'équipe a tout géré, de la paperasse CEE à l'installation du déshumidificateur thermodynamique. C'est incroyable d'avoir un tel équipement sans rien payer. Je recommande à 1000% !",
    image: "Une femme tenant un pot de fleur coloré",
  },
];

const SocialProofSection = () => {
  return (
    <section id="avis" className="py-16 md:py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5 }}
          className="text-3xl text-center font-bold mb-12"
        >
          Ils ont boosté leurs récoltes <span className="gradient-text">gratuitement</span>. Et vous ?
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 italic">"{testimonial.quote}"</p>
                </div>
                <div className="mt-auto p-6 flex items-center gap-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="w-14 h-14 rounded-full overflow-hidden">
                    <img class="w-full h-full object-cover" alt={testimonial.name} src="https://images.unsplash.com/photo-1595872018818-97555653a011" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{testimonial.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.location}</p>
                  </div>
                </div>
                 <div className="bg-primary/10 text-primary dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-bold p-2 flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4"/>
                    Financement validé par le programme CEE
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;