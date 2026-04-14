import React from 'react';
import { Leaf, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = ({ navItems, scrollToSection }) => {
  const companyName = "Groupe Effinor";
  const contactEmail = "contact@effinor.fr";
  const contactPhone = "09 78 45 50 63";

  return (
    <footer className="bg-slate-800 dark:bg-black text-slate-300 dark:text-slate-400 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <Leaf className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-white">AGRI-TH-117</span>
            </div>
            <p className="text-sm">Solution de déshumidification pour serre agricole. Luttez contre l'humidité et la condensation grâce au financement CEE.</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-3">Navigation</p>
            <ul className="space-y-2 text-sm">
              {navItems.map(item => (
                <li key={`footer-${item.label}`}>
                  <button
                    onClick={() => {
                      if (window.location.pathname !== '/') {
                        window.location.href = `/#${item.sectionId}`;
                      } else {
                        scrollToSection(item.sectionId);
                      }
                    }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-3">Contact & Devis Gratuit</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center"><Mail className="h-4 w-4 mr-2 text-primary" /> <a href={`mailto:${contactEmail}`} className="hover:text-emerald-400">{contactEmail}</a></li>
              <li className="flex items-center font-semibold text-base">
                <Phone className="h-5 w-5 mr-2 text-primary" /> 
                <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="text-white hover:text-emerald-400">{contactPhone}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-8 text-center text-sm">
          <p className="mb-2">Groupe Effinor – Expert en équipements énergétiques agricoles et tertiaires, certifié CEE.</p>
          <p>&copy; {new Date().getFullYear()} {companyName}. Tous droits réservés.</p>
          <p className="mt-1">
            <Link to="/mentions-legales" className="hover:text-emerald-400 transition-colors">Mentions Légales</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;