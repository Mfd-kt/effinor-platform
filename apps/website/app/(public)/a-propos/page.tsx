import type { Metadata } from 'next'
import { AboutHero } from '@/components/sections/about-hero'
import { OurStory } from '@/components/sections/our-story'
import { OurMission } from '@/components/sections/our-mission'
import { TeamStats } from '@/components/sections/team-stats'
import { Certifications } from '@/components/sections/certifications'
import { FinalCTA } from '@/components/sections/final-cta'

export const metadata: Metadata = {
  title: 'À propos',
  description:
    "Découvrez Effinor : entreprise spécialisée dans la rénovation énergétique depuis 2018. Notre mission, nos valeurs, notre équipe certifiée RGE et nos engagements qualité.",
  openGraph: {
    title: "À propos d'Effinor",
    description:
      "Effinor accompagne particuliers et professionnels dans leur transition énergétique. Certifié RGE QualiPAC, délégataire CEE.",
  },
}

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <OurStory />
      <OurMission />
      <TeamStats />
      <Certifications />
      <FinalCTA />
    </>
  )
}
