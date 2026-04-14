import React from 'react';
import { Helmet } from 'react-helmet-async';
import { absoluteUrl } from '@/lib/site';
import HeroTrustFirst from '@/components/sections/HeroTrustFirst';
import TrustBar from '@/components/sections/TrustBar';
import CasClients from '@/components/sections/CasClients';
import CeeExplication from '@/components/sections/CeeExplication';
import Credibilite from '@/components/sections/Credibilite';
import Transparence from '@/components/sections/Transparence';
import EnergySimulator from '@/components/sections/EnergySimulator';
import Faq from '@/components/sections/Faq';
import FinalCta from '@/components/sections/FinalCta';

const Home = () => {
    const canonical = absoluteUrl('/');
    return (
        <>
            <Helmet>
                <title>Déstratificateur BAT-TH-142 | Économies & Prime CEE</title>
                <meta name="description" content="Réduisez jusqu'à 30% votre facture de chauffage avec un déstratificateur d'air éligible CEE (BAT-TH-142). Confort et économies garantis." />
                {canonical ? <link rel="canonical" href={canonical} /> : null}
                <meta property="og:title" content="Déstratificateur BAT-TH-142 | Économies & Prime CEE" />
                <meta property="og:description" content="Solution 2-en-1 : économies en hiver, confort en été. Calculez vos économies gratuitement en 5 minutes." />
                {canonical ? <meta property="og:url" content={canonical} /> : null}
                <meta property="og:type" content="website" />
                {import.meta.env.VITE_OG_IMAGE_URL ? (
                  <meta property="og:image" content={import.meta.env.VITE_OG_IMAGE_URL} />
                ) : null}
                <meta name="keywords" content="destratificateur, CEE, BAT-TH-142, économies énergie, chauffage industriel, confort thermique, financement CEE, paiement rapide CEE" />
            </Helmet>
            <HeroTrustFirst />
            <EnergySimulator />
            <TrustBar />
            <CasClients />
            <CeeExplication />
            <Credibilite />
            <Transparence />
            <Faq />
            <FinalCta />
        </>
    );
};

export default Home;