import React from 'react';

/**
 * @param {{ label: string, value: string }[]} figures
 */
export function RealisationKeyFigures({ figures = [] }) {
  if (!figures.length) return null;

  return (
    <section className="my-6 md:my-8" aria-label="Chiffres clés">
      <h2 className="heading-subsection mb-4 text-gray-900">Chiffres clés</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {figures.map((item, i) => (
          <li
            key={`${item.label}-${i}`}
            className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-slate-50/80 px-4 py-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{item.label}</p>
            <p className="mt-1 text-lg font-bold text-gray-900 md:text-xl">{item.value}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RealisationKeyFigures;
