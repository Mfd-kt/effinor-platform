"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export const THEME_COOKIE = "theme";
export type ThemeValue = "light" | "dark";

function readInitialTheme(): ThemeValue {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function persistThemeCookie(value: ThemeValue) {
  if (typeof document === "undefined") return;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${THEME_COOKIE}=${value}; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
}

type ThemeToggleProps = {
  className?: string;
  /** Affichage compact (icône seule) ou avec label (menu profil). */
  variant?: "icon" | "labeled";
};

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeValue>("light");

  /** Synchronise l'état après mount avec la classe réellement présente sur <html>. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture initiale du DOM (SSR-safe)
    setTheme(readInitialTheme());
  }, []);

  function toggle() {
    const next: ThemeValue = theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
    }
    persistThemeCookie(next);
    setTheme(next);
  }

  const label = theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre";

  if (variant === "labeled") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground",
          className,
        )}
      >
        {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
        <span>{theme === "dark" ? "Thème clair" : "Thème sombre"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0", className)}
    >
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:-rotate-90 dark:scale-0" aria-hidden />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:rotate-0 dark:scale-100" aria-hidden />
      <span className="sr-only">{label}</span>
    </button>
  );
}
