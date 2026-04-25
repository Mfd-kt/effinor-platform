import { siteStats } from '@/lib/site-stats'

export function TrustBar() {
  return (
    <section className="bg-white border-b border-gray-100 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {siteStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="text-3xl font-bold text-primary-900">{stat.value}</dt>
              <dd className="mt-1 text-sm text-gray-600">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
