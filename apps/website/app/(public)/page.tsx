import { Hero } from '@/components/sections/hero'
import { TrustBar } from '@/components/sections/trust-bar'
import { ServicesGrid } from '@/components/sections/services-grid'
import { WhyEffinor } from '@/components/sections/why-effinor'
import { HowItWorks } from '@/components/sections/how-it-works'
import { AidesInfo } from '@/components/sections/aides-info'
import { Testimonials } from '@/components/sections/testimonials'
import { FinalCTA } from '@/components/sections/final-cta'

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ServicesGrid />
      <WhyEffinor />
      <HowItWorks />
      <AidesInfo />
      <Testimonials />
      <FinalCTA />
    </>
  )
}
