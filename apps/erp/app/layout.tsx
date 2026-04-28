import type { Metadata } from "next";
import { Inter, Poppins, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "sonner";

import { RuntimeSupabaseInjectClient } from "@/components/runtime-supabase-inject-client";
import { getPublicSupabaseAnonKey, getPublicSupabaseUrl } from "@/lib/supabase/public-env";
import { THEME_COOKIE } from "@/components/layout/theme-toggle";

import "./globals.css";

/** Lit les variables Supabase au runtime du conteneur (PUBLIC_* / NEXT_PUBLIC_*). Sans cela, le layout serait figé au build sans script d’injection. */
export const dynamic = "force-dynamic";

/** Même duo que le site vitrine Effinor (Inter corps, Poppins titres). */
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-family-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Effinor ERP",
    template: "%s · Effinor ERP",
  },
  description:
    "Pilotage des dossiers CEE — leads, bénéficiaires, opérations, documents et finance.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";
  const supabaseUrl = getPublicSupabaseUrl();
  const supabaseAnon = getPublicSupabaseAnonKey();
  const publicSupabase =
    supabaseUrl && supabaseAnon ? { url: supabaseUrl, anonKey: supabaseAnon } : null;

  return (
    <html
      lang="fr"
      className={`${inter.variable} ${poppins.variable} ${geistMono.variable} h-full antialiased ${theme === "dark" ? "dark" : ""}`}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body className="flex h-full flex-col overflow-hidden">
        <RuntimeSupabaseInjectClient config={publicSupabase} />
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
