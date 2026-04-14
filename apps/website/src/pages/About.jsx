import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Building2,
  Factory,
  Store,
  MapPin,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackCtaStudy, trackCtaCallback } from '@/lib/effinorAnalytics';
import { IMAGES } from '@/config/images';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const About = () => {
  const stats = [
    {
      icon: TrendingUp,
      number: '500+',
      label: 'dossiers qualifiés',
      color: 'text-blue-600',
    },
    {
      icon: Users,
      number: '10+ ans',
      label: "d'expertise Groupe Effinor",
      color: 'text-green-600',
    },
    {
      icon: Award,
      number: '2 offres',
      label: 'PAC & déstratification',
      color: 'text-yellow-600',
    },
    {
      icon: MapPin,
      number: 'France',
      label: "intervention nationale",
      color: 'text-purple-600',
    },
  ];

  const domains = [
    {
      icon: Factory,
      title: 'Industrie & logistique',
      description:
        "Entrepôts et ateliers à grand volume : déstratification pour améliorer le confort et réduire les coûts de chauffage.",
      img: IMAGES.inline.entrepotLogistique,
      imgAlt: 'Entrepôt logistique avec racks de stockage hauts et chariots élévateurs',
    },
    {
      icon: Building2,
      title: 'Tertiaire & bureaux',
      description:
        "Bureaux, établissements, bâtiments d'activité : pompe à chaleur et déstratification pour maîtriser les charges.",
      img: IMAGES.inline.bureauxOpenSpace,
      imgAlt: 'Open space tertiaire moderne — bureaux avec hauteur sous plafond',
    },
    {
      icon: Store,
      title: 'Commerces & accueil public',
      description:
        "Confort client, maîtrise des charges, image : solutions adaptées aux sites à fort passage.",
      img: IMAGES.inline.centreCommercialRetail,
      imgAlt: 'Centre commercial multi-niveaux — espace retail et accueil public',
    },
    {
      icon: Building2,
      title: 'Copropriétés & résidentiel collectif',
      description:
        "Pompe à chaleur pour copropriétés et logements collectifs : confort, économies et accompagnement complet.",
      img: IMAGES.inline.coproprieteImmeuble,
      imgAlt: 'Résidence de copropriété moderne — immeubles collectifs avec balcons',
    },
    {
      icon: Building2,
      title: 'Établissements & ERP',
      description:
        "Écoles, établissements de santé, ERP : solutions dimensionnées selon les exigences spécifiques de chaque usage.",
      img: IMAGES.inline.etablissementERP,
      imgAlt: 'Établissement recevant du public — grande surface commerciale avec plafond apparent',
    },
    {
      icon: MapPin,
      title: 'Intervention nationale',
      description:
        "Nous intervenons sur tout le territoire français avec la même approche : étude, préconisation, accompagnement.",
    },
  ];

  const processSteps = [
    {
      step: '1',
      title: 'Analyse de votre bâtiment',
      description:
        'Nous recueillons les informations essentielles : surface, usage, équipements actuels, contraintes spécifiques.',
    },
    {
      step: '2',
      title: 'Étude personnalisée',
      description:
        'Un bilan adapté à votre situation, avec une estimation des économies potentielles et des solutions adaptées.',
    },
    {
      step: '3',
      title: 'Préconisation adaptée',
      description:
        'Nous vous recommandons la solution la plus pertinente pour votre bâtiment et vos objectifs.',
    },
    {
      step: '4',
      title: 'Mise en œuvre',
      description:
        'Installation par des professionnels qualifiés, dans le respect de vos délais et de vos contraintes.',
    },
    {
      step: '5',
      title: 'Suivi',
      description:
        "Un accompagnement jusqu’à la clôture du projet, y compris les démarches CEE si applicable.",
    },
  ];

  const reassuranceItems = [
    'Un interlocuteur unique',
    'Une étude adaptée à votre situation',
    'Une solution dimensionnée',
    'Un accompagnement administratif (CEE)',
    'Un suivi après mise en œuvre',
  ];

  return (
    <>
      <Helmet>
        <title>Effinor : spécialiste chauffage, PAC et déstratification | À propos</title>
        <meta
          name="description"
          content="Découvrez Effinor, spécialiste des solutions de chauffage, pompe à chaleur et déstratification pour bâtiments tertiaires et industriels."
        />
        <meta
          name="keywords"
          content="effinor, pompe à chaleur, déstratification, CEE, chauffage tertiaire, entrepôt, copropriété"
        />
      </Helmet>

      {/* ── HERO ── */}
      <div
        className="w-full relative bg-dark-section py-10 md:py-16 pt-24 md:pt-32 overflow-hidden"
        style={{ backgroundImage: `url(${IMAGES.hero.about})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/78 via-primary-900/68 to-slate-900/72" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center relative z-10"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              À propos d&apos;Effinor
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-white/90 leading-relaxed mb-8 max-w-2xl mx-auto">
              Un interlocuteur unique pour réduire vos coûts de chauffage. Effinor accompagne les entreprises,
              copropriétés et gestionnaires de bâtiments dans leurs projets de pompe à chaleur et de
              déstratification, avec une approche claire : performance, confort et maîtrise des coûts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/contact"
                onClick={() => trackCtaStudy({ effinor_source: 'about', effinor_cta_location: 'hero' })}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--secondary-500)] text-white font-semibold px-6 py-3 hover:bg-[var(--secondary-600)] transition-colors"
              >
                Demander une étude gratuite
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                onClick={() => trackCtaCallback({ effinor_source: 'about', effinor_cta_location: 'hero' })}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 font-semibold px-6 py-3 hover:bg-white/15 transition-colors"
              >
                Être rappelé
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="container mx-auto py-8 md:py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-10 md:space-y-14">

          {/* ── MISSION ── */}
          <motion.div {...fadeUp} className="bg-white rounded-xl shadow-md p-6 md:p-10">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Notre mission</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Aider les <strong>entreprises, institutionnels et copropriétés</strong> à réduire durablement
                leurs dépenses de chauffage et le gaspillage thermique dans les bâtiments à grand volume.
              </p>
              <p>
                Nous intervenons avec deux leviers principaux : la <strong>pompe à chaleur</strong> et la{' '}
                <strong>déstratification d&apos;air</strong>, en intégrant lorsque c&apos;est possible les
                dispositifs CEE pour optimiser le financement.
              </p>
              <p>
                Notre objectif est simple : proposer des solutions adaptées à votre bâtiment, compréhensibles et
                rentables.
              </p>
            </div>
          </motion.div>

          {/* ── DIFFÉRENCIATION ── */}
          <motion.div {...fadeUp} className="bg-slate-50 rounded-xl border border-slate-200 p-6 md:p-10">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Une approche claire, sans discours flou
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>Nous ne proposons pas un catalogue de solutions énergétiques.</p>
              <p>
                Nous analysons votre bâtiment, vos contraintes et vos objectifs pour vous orienter vers les
                solutions réellement pertinentes.
              </p>
              <p className="font-medium text-gray-900">Chaque projet est étudié avec une logique simple :</p>
              <ul className="space-y-2 pt-1">
                {['Réduire les coûts', 'Améliorer le confort', 'Sécuriser le projet'].map((item) => (
                  <li key={item} className="flex gap-2 items-start">
                    <CheckCircle2 className="w-5 h-5 text-[var(--secondary-500)] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* ── QUI SOMMES-NOUS ── */}
          <motion.div {...fadeUp} className="bg-white rounded-xl shadow-md p-6 md:p-10">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Qui sommes-nous ?</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Effinor est une marque spécialisée dans les projets liés au chauffage, aux grands volumes et
                à l&apos;optimisation énergétique des bâtiments.
              </p>
              <p>
                Nous intervenons principalement sur des projets tertiaires, industriels et résidentiels
                collectifs, où les enjeux de consommation et de confort sont majeurs.
              </p>
              <p>
                Nos équipes travaillent avec une approche terrain et opérationnelle, en lien direct avec les
                contraintes réelles des bâtiments et des exploitants.
              </p>
            </div>
          </motion.div>

          {/* ── PROJETS CONCRETS / STATS ── */}
          <motion.div {...fadeUp}>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 text-center">
              Des projets concrets
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md p-5 text-center"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 bg-gray-50`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-gray-600 text-sm leading-snug">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── DOMAINES D'INTERVENTION ── */}
          <motion.div {...fadeUp}>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 text-center">
              Nos domaines d&apos;intervention
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {domains.map((domain, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className={`rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow ${domain.img ? 'relative' : 'bg-white p-5'}`}
                  style={domain.img ? { minHeight: '180px' } : {}}
                >
                  {domain.img ? (
                    <>
                      <img
                        src={domain.img}
                        alt={domain.imgAlt || domain.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={domain.imgPosition ? { objectPosition: domain.imgPosition } : undefined}
                        loading="lazy"
                        width="600"
                        height="400"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/10" />
                      <div className="relative z-10 p-5 h-full flex flex-col justify-end">
                        <div className="w-8 h-8 bg-[var(--secondary-500)] rounded-lg flex items-center justify-center mb-2">
                          <domain.icon className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-white mb-1 leading-snug">{domain.title}</h3>
                        <p className="text-white/75 text-xs leading-relaxed">{domain.description}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mb-3">
                        <domain.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{domain.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{domain.description}</p>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── VISUEL TERRAIN ── */}
          <motion.div {...fadeUp} className="rounded-2xl overflow-hidden shadow-lg">
            <div className="relative h-56 md:h-72">
              <img
                src={IMAGES.about.team}
                alt="Équipe Effinor en réunion projet"
                className="w-full h-full object-cover"
                loading="lazy"
                width="1200"
                height="500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-900/20" />
              <div className="absolute inset-0 flex items-center px-6 md:px-10">
                <div className="max-w-md">
                  <p className="text-sm font-medium text-[var(--secondary-400)] mb-1">Notre approche</p>
                  <p className="text-white text-lg md:text-xl font-semibold leading-snug">
                    Une équipe orientée terrain, avec une logique opérationnelle et des réponses concrètes.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── MÉTHODE ── */}
          <motion.div {...fadeUp} className="bg-white rounded-xl shadow-md p-6 md:p-10">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 text-center">
              Une méthode simple et structurée
            </h2>
            <ol className="space-y-4">
              {processSteps.map((step, index) => (
                <li
                  key={index}
                  className="flex gap-4 border border-gray-200 rounded-xl bg-slate-50 p-4"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--secondary-500)]/15 text-[var(--secondary-700)] font-bold flex items-center justify-center text-sm">
                    {step.step}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>

          {/* ── RÉASSURANCE ── */}
          <motion.div {...fadeUp} className="bg-slate-50 rounded-xl border border-slate-200 p-6 md:p-10">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-5">
              Un projet encadré de A à Z
            </h2>
            <ul className="space-y-3">
              {reassuranceItems.map((item) => (
                <li key={item} className="flex gap-3 items-start">
                  <CheckCircle2 className="w-5 h-5 text-[var(--secondary-500)] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ── CTA FINAL ── */}
          <motion.div
            {...fadeUp}
            className="bg-gradient-to-r from-primary-900 to-primary-800 bg-dark-section rounded-xl shadow-xl p-8 md:p-12 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Parlons de votre bâtiment
            </h2>
            <p className="text-white/85 mb-8 max-w-xl mx-auto leading-relaxed">
              Obtenez une étude personnalisée et identifiez les solutions adaptées à votre situation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                onClick={() => trackCtaStudy({ effinor_source: 'about', effinor_cta_location: 'about_cta_block' })}
              >
                <Button
                  size="lg"
                  className="bg-white text-primary-900 hover:bg-gray-100 font-semibold px-8 py-6 text-base"
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Demander une étude gratuite
                </Button>
              </Link>
              <Link
                to="/contact"
                onClick={() => trackCtaCallback({ effinor_source: 'about', effinor_cta_location: 'about_cta_block' })}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary-900 font-semibold px-8 py-6 text-base bg-transparent"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Être rappelé
                </Button>
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
};

export default About;
