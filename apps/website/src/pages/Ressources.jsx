import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/lib/supabaseClient';
import {
  Loader2,
  Download,
  FileText,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  Clock,
  Tag,
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { useToast } from '@/components/ui/use-toast';
import { trackCtaStudy, trackCtaCallback } from '@/lib/effinorAnalytics';
import { IMAGES } from '@/config/images';

const SEO_TITLE = 'Ressources Effinor | Guides PAC, déstratification et CEE';
const SEO_DESCRIPTION =
  'Guides et ressources pour vos projets de pompe à chaleur, déstratification et financement CEE.';

const WHY_ITEMS = [
  'Comprendre les solutions avant d’investir',
  'Éviter les erreurs de dimensionnement',
  'Identifier les aides disponibles',
  'Comparer les options et leur pertinence',
];

/**
 * Formulaire inline de capture email avant téléchargement (gated download).
 * Sauvegarde l'email dans leads puis déclenche le download.
 */
const GatedDownload = ({ ressource, onDownload }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Email invalide', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await supabase.from('leads').insert([{
        email: email.trim(),
        source: 'Ressources — téléchargement',
        statut: 'Nouveau',
        type_projet: 'ressource',
        page_origine: '/ressources',
        message: `Téléchargement : ${ressource.titre || ressource.file_name || 'ressource'}`,
      }]);
    } catch (err) {
      logger.warn('[Ressources] Lead insert error (non-blocking):', err);
    } finally {
      setSubmitting(false);
      setDone(true);
      onDownload(ressource.url, ressource.file_name || 'document');
      toast({ title: 'Téléchargement lancé', description: 'Merci, votre fichier se télécharge.' });
    }
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-[var(--secondary-600)] font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Téléchargé
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-colors font-semibold text-sm"
      >
        <Download className="h-4 w-4" />
        Télécharger
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
      <p className="text-xs text-gray-600">Indiquez votre email pour accéder au fichier.</p>
      <input
        type="email"
        required
        placeholder="votre@email.fr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--secondary-500)] focus:ring-2 focus:ring-[var(--secondary-500)]/20 bg-gray-50"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--secondary-500)] text-white rounded-lg hover:bg-[var(--secondary-600)] transition-colors font-semibold text-sm disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Accéder
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

/**
 * Section capture email pour recevoir les prochains guides.
 */
const LeadMagnet = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Email invalide', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await supabase.from('leads').insert([{
        email: email.trim(),
        source: 'Ressources — inscription guides',
        statut: 'Nouveau',
        type_projet: 'newsletter_guides',
        page_origine: '/ressources',
        message: 'Inscription pour recevoir les prochains guides Effinor.',
      }]);
      setDone(true);
      setEmail('');
      toast({ title: 'Inscription enregistrée !', description: 'Vous recevrez nos guides dès leur publication.' });
    } catch (err) {
      logger.error('[Ressources] Lead magnet error:', err);
      toast({ title: 'Erreur', description: 'Veuillez réessayer.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--secondary-500)] text-white rounded-2xl p-8 md:p-10 max-w-2xl mx-auto text-center">
      <Mail className="h-10 w-10 mx-auto mb-4 opacity-90" />
      <h2 className="text-xl md:text-2xl font-bold mb-2">Recevez nos prochains guides</h2>
      <p className="text-white/85 mb-6 text-sm leading-relaxed">
        Laissez votre email pour recevoir nos contenus dès leur publication.
      </p>
      {done ? (
        <div className="flex items-center justify-center gap-2 bg-white/15 rounded-xl px-6 py-4">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold text-sm">Inscription confirmée — à bientôt !</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
          <input
            type="email"
            required
            placeholder="votre@email.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-[var(--secondary-600)] font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Recevoir les guides
          </button>
        </form>
      )}
      <p className="text-white/60 text-xs mt-4">Aucun spam. Désinscription à tout moment.</p>
    </div>
  );
};

const Ressources = () => {
  const seo = usePageSEO('/ressources');
  const [ressources, setRessources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRessources();
  }, []);

  const fetchRessources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medias')
        .select('*')
        .eq('category', 'ressource')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRessources(data || []);
    } catch (err) {
      logger.error('[Ressources] Error fetching ressources:', err);
      setRessources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url, fileName) => {
    try {
      const { data, error } = await supabase.storage.from('ressources').download(fileName);
      if (error) throw error;
      const blob = await data.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      logger.error('[Ressources] Error downloading file:', err);
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <SEOHead
        metaTitle={SEO_TITLE}
        metaDescription={SEO_DESCRIPTION}
        ogImage={seo.ogImage}
        isIndexable={seo.isIndexable !== false}
        h1="Ressources & documentation"
        intro={null}
      />

      <div className="min-h-screen bg-gray-50">

        {/* ── HERO ── */}
        <div
          className="w-full relative bg-dark-section py-10 md:py-14 pt-24 md:pt-32 overflow-hidden"
          style={{ backgroundImage: `url(${IMAGES.hero.ressources})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/78 via-primary-900/68 to-slate-900/72" />
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              Ressources &amp; documentation
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-2xl leading-relaxed mb-5">
              Guides pratiques pour vos projets de chauffage. Accédez à des ressources concrètes pour
              comprendre, optimiser et financer vos projets de pompe à chaleur et déstratification.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
              {['Guides pratiques', 'Études de cas', 'Explications CEE'].map((tag) => (
                <span key={tag} className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[var(--secondary-400)]" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 md:py-14 max-w-5xl space-y-14">

          {/* ── POURQUOI CONSULTER ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
              Pourquoi consulter ces ressources ?
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {WHY_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[var(--secondary-500)] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── RESSOURCES ── */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--secondary-500)]" />
            </div>
          ) : ressources.length === 0 ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-w-3xl mx-auto">
              {/* Photo de fond mockup guides */}
              <div className="relative h-44 md:h-56">
                <img
                  src={IMAGES.ressources.guide}
                  alt="Guides pratiques Effinor — pompe à chaleur et déstratification"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width="900"
                  height="400"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-900/20" />
                <div className="absolute bottom-4 left-6">
                  <span className="text-xs font-semibold text-[var(--secondary-300)] uppercase tracking-wide">
                    Prochainement
                  </span>
                  <p className="text-white font-bold text-lg leading-snug">
                    Guides PAC, déstratification &amp; CEE
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 p-8 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Nos ressources arrivent</h2>
                <p className="text-gray-600 mb-6 leading-relaxed max-w-xl mx-auto">
                  Nous préparons actuellement des guides pratiques pour vous aider à mieux comprendre les
                  solutions et les financements disponibles.
                  <br />
                  En attendant, vous pouvez demander une étude adaptée à votre bâtiment.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/contact"
                    onClick={() => trackCtaStudy({ effinor_source: 'ressources', effinor_cta_location: 'empty_state' })}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--secondary-500)] text-white font-semibold px-6 py-3 text-sm hover:bg-[var(--secondary-600)] transition-colors"
                  >
                    Demander une étude gratuite
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => trackCtaCallback({ effinor_source: 'ressources', effinor_cta_location: 'empty_state' })}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 text-gray-700 font-semibold px-6 py-3 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    Être rappelé
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Nos guides disponibles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ressources.map((ressource) => {
                  const isPDF =
                    ressource.mime_type === 'application/pdf' || ressource.file_name?.endsWith('.pdf');
                  const Icon = isPDF ? FileText : Download;

                  return (
                    <div
                      key={ressource.id}
                      className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 flex flex-col gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-[var(--secondary-500)]/10 rounded-xl flex-shrink-0">
                          <Icon className="h-7 w-7 text-[var(--secondary-500)]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base leading-snug">
                            {ressource.titre || ressource.file_name || 'Document'}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {isPDF && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">Guide PDF</span>
                            )}
                            {ressource.file_size && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {(ressource.file_size / 1024 / 1024).toFixed(1)} MB
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {ressource.alt_text && (
                        <p className="text-sm text-gray-600 leading-relaxed">{ressource.alt_text}</p>
                      )}

                      <div className="mt-auto">
                        <GatedDownload ressource={ressource} onDownload={handleDownload} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── LEAD MAGNET ── */}
          <LeadMagnet />

          {/* ── CRÉDIBILITÉ ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 text-center max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Des contenus basés sur le terrain</h2>
            <p className="text-gray-600 leading-relaxed">
              Nos ressources sont construites à partir de projets réels et des problématiques
              rencontrées sur le terrain. Chaque guide a pour objectif de vous aider à prendre de
              meilleures décisions pour votre bâtiment.
            </p>
          </div>

          {/* ── CTA FINAL ── */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-10 md:p-14 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Vous préférez aller plus vite ?</h2>
            <p className="text-white/85 mb-8 max-w-xl mx-auto leading-relaxed">
              Obtenez directement une étude adaptée à votre bâtiment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                onClick={() => trackCtaStudy({ effinor_source: 'ressources', effinor_cta_location: 'ressources_bottom_cta' })}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--secondary-500)] text-white font-semibold px-7 py-3.5 hover:bg-[var(--secondary-600)] transition-colors"
              >
                Demander une étude gratuite
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                onClick={() => trackCtaCallback({ effinor_source: 'ressources', effinor_cta_location: 'ressources_bottom_cta' })}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 font-semibold px-7 py-3.5 hover:bg-white/15 transition-colors"
              >
                <Phone className="h-4 w-4" />
                Être rappelé
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Ressources;
