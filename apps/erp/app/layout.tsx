import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { RuntimeSupabaseScript } from "@/components/runtime-supabase-script";

import "./globals.css";

/** Lit les variables Supabase au runtime du conteneur (PUBLIC_* / NEXT_PUBLIC_*). Sans cela, le layout serait figé au build sans script d’injection. */
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <RuntimeSupabaseScript />
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
