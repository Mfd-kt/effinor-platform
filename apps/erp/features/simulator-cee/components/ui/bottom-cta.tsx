"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BottomCtaProps = {
  children: ReactNode;
  className?: string;
  /** Quand vrai : rendu en `sticky bottom-0` dans le parent (cas modal). */
  embedded?: boolean;
};

/** Barre d’action sticky bas (style Effy : CTA contrasté). */
export function BottomCta({ children, className, embedded }: BottomCtaProps) {
  return (
    <div
      className={cn(
        embedded
          ? "sticky bottom-0 z-10 border-t border-violet-200/80 bg-[#f4f0ff]/95 px-4 py-3 backdrop-blur-md"
          : "fixed bottom-0 left-0 right-0 z-40 border-t border-violet-200/80 bg-[#f4f0ff]/95 px-4 py-3 backdrop-blur-md md:pl-[var(--sidebar-width,0px)]",
        className,
      )}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-end gap-3">{children}</div>
    </div>
  );
}

export function PrimaryCtaButton({
  children,
  disabled,
  loading,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <Button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="min-w-[140px] rounded-full bg-amber-400 font-semibold text-slate-900 shadow-md hover:bg-amber-300"
    >
      {loading ? "…" : children}
    </Button>
  );
}

export function GhostCtaButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Button type="button" variant="outline" onClick={onClick} disabled={disabled} className="rounded-full">
      {children}
    </Button>
  );
}
