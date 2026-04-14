"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = await createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signError) {
        if (process.env.NODE_ENV === "development") {
          console.error("[auth signInWithPassword]", signError.message, signError);
        }
        const hint =
          process.env.NODE_ENV === "development" ? ` (${signError.message})` : "";
        setError(`Identifiants incorrects ou compte indisponible.${hint}`);
        return;
      }

      router.push(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inattendue.";
      setError(
        msg.includes("NEXT_PUBLIC_SUPABASE") ||
          msg.includes("PUBLIC_SUPABASE") ||
          msg.includes("Configuration Supabase publique manquante")
          ? "Configuration Supabase manquante côté application (variables publiques). En production Docker, définir PUBLIC_SUPABASE_URL et PUBLIC_SUPABASE_ANON_KEY au runtime, ou voir la doc de déploiement."
          : `Connexion impossible. ${msg}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold tracking-tight">Connexion</CardTitle>
        <CardDescription>
          Effinor ERP — accès sécurisé à votre espace métier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@entreprise.fr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
