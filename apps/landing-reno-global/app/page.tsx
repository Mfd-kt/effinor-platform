import { AidesSection } from '@/components/aides-section'
import { EligibilitySection } from '@/components/eligibility-section'
import { Faq } from '@/components/faq'
import { FinalCta } from '@/components/final-cta'
import { Footer } from '@/components/footer'
import { Hero } from '@/components/hero'
import { HowItWorks } from '@/components/how-it-works'
import { MidCta } from '@/components/mid-cta'
import { ScenariosSection } from '@/components/scenarios-section'
import { TrustBar } from '@/components/trust-bar'

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <EligibilitySection />
      <ScenariosSection />
      <AidesSection />
      <HowItWorks />
      <MidCta />
      <Faq />
      <FinalCta />
      <Footer />
    </>
  )
}
