import type { ReactNode } from "react";

export default function LeadGenerationLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lead-gen-premium -m-6 min-h-full bg-background text-foreground antialiased lg:-m-8">
      <div className="px-6 py-6 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}
