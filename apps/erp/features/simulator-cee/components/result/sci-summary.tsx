"use client";

import { Building2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SciSummary({ raisonSociale, profil }: { raisonSociale: string; profil: string }) {
  if (!raisonSociale.trim()) return null;
  return (
    <Card className="rounded-2xl border-violet-100 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-violet-950">
          <Building2 className="h-5 w-5" aria-hidden />
          Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>
          <span className="text-slate-500">Profil :</span>{" "}
          <span className="font-medium capitalize text-slate-900">{profil.replaceAll("_", " ")}</span>
        </p>
        <p>
          <span className="text-slate-500">Raison sociale :</span>{" "}
          <span className="font-medium text-slate-900">{raisonSociale}</span>
        </p>
      </CardContent>
    </Card>
  );
}
