import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

const styles: Record<NonNullable<ButtonProps["variant"]>, CSSProperties> = {
  primary: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "none",
    background: "#0f766e",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondary: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    color: "#111",
    cursor: "pointer",
    fontWeight: 500,
  },
};

/** Bouton partagé Effinor — exemple minimal pour valider le monorepo. */
export function Button({ children, variant = "primary", style, ...props }: ButtonProps) {
  return (
    <button type="button" style={{ ...styles[variant], ...style }} {...props}>
      {children}
    </button>
  );
}
