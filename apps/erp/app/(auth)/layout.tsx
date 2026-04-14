import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/35 p-6">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Effinor
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          ERP · Certificats d’économies d’énergie
        </h1>
      </div>
      {children}
    </div>
  );
}
