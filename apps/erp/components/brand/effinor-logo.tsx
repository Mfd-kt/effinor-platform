import Link from "next/link";

import { cn } from "@/lib/utils";

type EffinorLogoProps = {
  className?: string;
  /** Lien racine ERP ; `null` = pas de lien. */
  href?: string | null;
  showWordmark?: boolean;
  subtitle?: string | null;
  /** Taille du pictogramme (carré). */
  markSize?: number;
  wordmarkClassName?: string;
  /** Ex. fermer un menu mobile après navigation. */
  linkOnClick?: () => void;
};

/**
 * Marque alignée sur le site vitrine : pictogramme = public/favicon.svg (E sur fond #10b981).
 */
export function EffinorLogo({
  className,
  href = "/",
  showWordmark = true,
  subtitle = null,
  markSize = 32,
  wordmarkClassName,
  linkOnClick,
}: EffinorLogoProps) {
  const inner = (
    <>
      <img
        src="/favicon.svg"
        width={markSize}
        height={markSize}
        alt="Effinor"
        className="shrink-0 rounded-lg shadow-sm"
      />
      {showWordmark || subtitle ? (
        <span className="min-w-0 leading-tight">
          {showWordmark ? (
            <span
              className={cn(
                "font-heading font-bold tracking-tight text-foreground",
                wordmarkClassName,
              )}
            >
              EFFINOR
            </span>
          ) : null}
          {subtitle ? (
            <span className="mt-0.5 block truncate text-xs font-medium text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  const body = (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="Effinor"
    >
      {inner}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={linkOnClick}
        className="inline-flex shrink-0 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      >
        {body}
      </Link>
    );
  }

  return body;
}
