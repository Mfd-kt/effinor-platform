import { AidesMax } from '@/components/aides-max'
import { Benefits } from '@/components/benefits'
import { Faq } from '@/components/faq'
import { FinalCta } from '@/components/final-cta'
import { Footer } from '@/components/footer'
import { Hero } from '@/components/hero'
import { HowItWorks } from '@/components/how-it-works'
import { MidCta } from '@/components/mid-cta'
import { Partners } from '@/components/partners'
import { Testimonials } from '@/components/testimonials'
import { TrustBar } from '@/components/trust-bar'
import { TypesPac } from '@/components/types-pac'

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <AidesMax />
      <Benefits />
      <TypesPac />
      <HowItWorks />
      <MidCta />
      <Partners />
      <Testimonials />
      <Faq />
      <FinalCta />
      <Footer />
    </>
  )
}
