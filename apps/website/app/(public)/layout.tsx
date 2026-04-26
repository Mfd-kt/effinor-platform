import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getSiteContact } from '@/lib/site-settings'

export const revalidate = 300

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const contact = await getSiteContact()

  return (
    <>
      <Header contact={contact} />
      <main>{children}</main>
      <Footer contact={contact} />
    </>
  )
}
