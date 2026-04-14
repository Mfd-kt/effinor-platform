import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const ContactFormSection = () => {
  const [formData, setFormData] = useState({
    nom: '', email: '', telephone: '', surface: '', codePostal: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "Demande envoyée !",
      description: "Nous vous contacterons sous 24h pour votre étude gratuite.",
    });
    setFormData({ nom: '', email: '', telephone: '', surface: '', codePostal: '' });
  };

  return (
    <section id="contact-form" className="section-padding bg-light-gray">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Recevez votre étude gratuite</h2>
          <p className="text-xl text-gray-600">Nos experts analysent votre bâtiment et vous proposent une solution sur mesure.</p>
        </motion.div>

        <motion.div 
          className="bg-white p-8 md:p-12 rounded-lg card-shadow"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                <input type="text" id="nom" name="nom" value={formData.nom} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Votre nom complet" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email professionnel *</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="votre.email@entreprise.com" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                <input type="tel" id="telephone" name="telephone" value={formData.telephone} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="01 23 45 67 89" />
              </div>
              <div>
                <label htmlFor="codePostal" className="block text-sm font-medium text-gray-700 mb-2">Code postal *</label>
                <input type="text" id="codePostal" name="codePostal" value={formData.codePostal} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="75001" />
              </div>
            </div>
            <div>
              <label htmlFor="surface" className="block text-sm font-medium text-gray-700 mb-2">Surface du bâtiment (m²) *</label>
              <input type="number" id="surface" name="surface" value={formData.surface} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="1000" />
            </div>
            <div className="text-center pt-4">
              <Button type="submit" className="btn-secondary text-lg px-12 py-4 hover:scale-105 transition-transform">
                Recevoir mon étude gratuite
              </Button>
              <p className="text-sm text-gray-500 mt-4">* Champs obligatoires - Réponse sous 24h</p>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactFormSection;