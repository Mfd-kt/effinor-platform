import { Benefits } from '@/components/benefits'
import { Faq } from '@/components/faq'
import { Footer } from '@/components/footer'
import { Hero } from '@/components/hero'
import { HowItWorks } from '@/components/how-it-works'
import { SimulatorSection } from '@/components/simulator-section'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Benefits />
      <HowItWorks />
      <SimulatorSection />
      <Faq />
      <Footer />
    </>
  )
}
