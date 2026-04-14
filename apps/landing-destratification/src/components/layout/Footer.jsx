import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, ShieldCheck, FileText, Smartphone } from 'lucide-react';

const Footer = () => {
  const reassurances = [
    { icon: <ShieldCheck className="w-5 h-5 mr-2" />, text: "Données sécurisées RGPD" },
    { icon: <FileText className="w-5 h-5 mr-2" />, text: "Sans engagement" },
    { icon: <Smartphone className="w-5 h-5 mr-2" />, text: "Réponse sous 24h" },
  ];

  return (
    <footer className="bg-gray-800 text-white pt-12 pb-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <span className="text-2xl font-bold text-blue-400 mb-4 block">Effinor (ECPS)</span>
            <p className="text-gray-300 mb-4">
              Spécialiste des solutions d'efficacité énergétique pour les professionnels.
            </p>
            <div className="flex space-x-4 mt-4">
                <img loading="lazy" alt="Logo EDF" className="h-8 grayscale" src="https://horizons-cdn.hostinger.com/543865db-43d7-4121-9236-45edc785718c/logo-edf.png" />
                <img loading="lazy" alt="Logo TotalEnergies" className="h-8 grayscale" src="https://horizons-cdn.hostinger.com/543865db-43d7-4121-9236-45edc785718c/logo-total-energies.png" />
            </div>
          </div>
          
          <div>
            <span className="text-lg font-semibold mb-4 block">Contact</span>
            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-blue-400 flex-shrink-0 mt-1" />
                <span className="text-gray-300">Avenue de l'Europe - Tour Europa - Thiais 94320</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-blue-400" />
                <span className="text-gray-300">09 78 45 50 63</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-blue-400" />
                <span className="text-gray-300">contact@effinor.fr</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-3 text-blue-400" />
                <span className="text-gray-300">Lun-Ven: 8h-18h</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Nos Garanties</span>
            <div className="space-y-3">
              {reassurances.map((item, index) => (
                <div key={index} className="flex items-center text-gray-300">
                  {item.icon}
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <span className="text-lg font-semibold mb-4 block">Informations</span>
            <div className="space-y-2 flex flex-col">
              <Link to="/mentions-legales" className="text-gray-300 hover:text-white transition-colors">Mentions légales</Link>
              <Link to="/politique-de-confidentialite" className="text-gray-300 hover:text-white transition-colors">Politique de confidentialité</Link>
              <Link to="/rgpd" className="text-gray-300 hover:text-white transition-colors">RGPD</Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 Effinor (ECPS). Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;