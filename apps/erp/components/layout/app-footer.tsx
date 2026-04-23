import Link from "next/link";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "v1.0.0";

const FOOTER_LINKS = [
  { label: "Documentation", href: "/docs", external: false },
  { label: "Support", href: "mailto:support@effinor.fr", external: true },
  { label: "Changelog", href: "/changelog", external: false },
] as const;

export function AppFooter() {
  return (
    <footer className="flex h-10 shrink-0 items-center justify-center gap-2 border-t border-border/70 bg-background px-4 text-[11.5px] text-muted-foreground">
      <span className="font-mono tabular-nums">{APP_VERSION}</span>
      <span aria-hidden>·</span>
      <span className="font-medium tracking-tight">EFFINOR ERP</span>
      {FOOTER_LINKS.map((link) => (
        <span key={link.href} className="hidden items-center gap-2 sm:inline-flex">
          <span aria-hidden>·</span>
          {link.external ? (
            <a
              href={link.href}
              className="transition-colors hover:text-foreground"
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
            >
              {link.label}
            </a>
          ) : (
            <Link href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          )}
        </span>
      ))}
    </footer>
  );
}
