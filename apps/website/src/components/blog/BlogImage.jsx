import React, { useCallback, useEffect, useState } from 'react';
import {
  getBlogCoverFallbackPublicPath,
  buildEmptyCoverImage,
  getBestBlogImageUrl,
  getBlogImageAlt,
  hasUsableImage,
} from '@/lib/blogImages';
import { cn } from '@/lib/utils';

/**
 * Image de couverture blog : URL Airtable / miniature, fallback premium, erreurs réseau, LCP hero.
 *
 * @param {Object} props
 * @param {Object|null|undefined} props.coverImage — objet normalisé (url, largeUrl, smallUrl, alt, …)
 * @param {string} [props.title]
 * @param {string|null} [props.category]
 * @param {'card'|'hero'|'related'} [props.variant]
 * @param {string} [props.altOverride]
 * @param {string} [props.className]
 * @param {string} [props.imgClassName]
 * @param {string} [props.sizes]
 */
export function BlogImage({
  coverImage,
  title = '',
  category = null,
  variant = 'card',
  altOverride,
  className,
  imgClassName,
  sizes,
}) {
  const meta = { title, category };
  const base =
    coverImage && typeof coverImage === 'object'
      ? coverImage
      : buildEmptyCoverImage(meta);

  const alt =
    typeof altOverride === 'string' && altOverride.trim()
      ? altOverride.trim()
      : base.alt || getBlogImageAlt(meta);

  const context = variant === 'hero' ? 'hero' : 'listing';
  const remoteCandidate = hasUsableImage(base) ? getBestBlogImageUrl(base, context) : null;

  const [useFallback, setUseFallback] = useState(!remoteCandidate);

  useEffect(() => {
    setUseFallback(!remoteCandidate);
  }, [remoteCandidate]);

  const fallbackSrc = getBlogCoverFallbackPublicPath();
  const src = !useFallback && remoteCandidate ? remoteCandidate : fallbackSrc;

  const onError = useCallback(() => {
    if (!remoteCandidate || useFallback) return;
    if (import.meta.env.DEV) {
      console.warn('[BlogImage] Chargement échoué, affichage du fallback.', remoteCandidate);
    }
    setUseFallback(true);
  }, [remoteCandidate, useFallback]);

  const loading = variant === 'hero' ? 'eager' : 'lazy';
  const fetchPriorityProps = variant === 'hero' ? { fetchPriority: 'high' } : {};

  const hasDim =
    typeof base.width === 'number' &&
    base.width > 0 &&
    typeof base.height === 'number' &&
    base.height > 0;
  let w;
  let h;
  if (hasDim) {
    w = base.width;
    h = base.height;
  } else if (variant === 'hero') {
    w = 1200;
    h = 630;
  } else {
    w = 640;
    h = 400;
  }

  const isRemote = Boolean(remoteCandidate && src === remoteCandidate);

  return (
    <img
      src={src}
      alt={alt}
      width={w}
      height={h}
      sizes={sizes}
      loading={loading}
      decoding="async"
      onError={onError}
      /* Airtable / CDN : sans referrer, certains hôtes renvoient 403 ou bloquent l’affichage */
      referrerPolicy={isRemote ? 'no-referrer' : undefined}
      {...fetchPriorityProps}
      className={cn(imgClassName, className)}
    />
  );
}

export default BlogImage;
