import React from 'react';
import BlogImage from '@/components/blog/BlogImage';

/**
 * Galerie à partir d’images normalisées (même forme que coverImage).
 */
export function RealisationGallery({ images = [], title = '', category = null }) {
  if (!images.length) return null;

  return (
    <section className="my-6 md:my-8" aria-label="Galerie photos">
      <h2 className="heading-subsection mb-4 text-gray-900">Galerie</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {images.map((img, i) => (
          <li
            key={`${img.url || img.largeUrl || i}-${i}`}
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 shadow-sm"
          >
            <BlogImage
              coverImage={img}
              title={title}
              category={category}
              variant="card"
              altOverride={img.alt}
              imgClassName="absolute inset-0 h-full w-full object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RealisationGallery;
