import type { ReactNode } from "react";

import { EffinorLogo } from "@/components/brand/effinor-logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/35 p-6">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <EffinorLogo href="/" subtitle="ERP" markSize={44} wordmarkClassName="text-xl" />
        <p className="max-w-md text-sm text-muted-foreground">
          Certificats d’économies d’énergie — accès sécurisé.
        </p>
      </div>
      {children}
    </div>
  );
}
