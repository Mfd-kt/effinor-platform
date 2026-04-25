"use client";

import { Mail, MapPin, Phone, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SimulationAddress, SimulationContact } from "@/features/simulator-cee/domain/types";

export function LeadInfoCard({
  contact,
  adresse,
}: {
  contact: SimulationContact | undefined;
  adresse: SimulationAddress;
}) {
  return (
    <Card className="rounded-2xl border-violet-100 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-violet-950">Coordonnées</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
          <span>
            {adresse.adresse}
            <br />
            {adresse.codePostal} {adresse.ville}
          </span>
        </div>
        {contact ? (
          <>
            <div className="flex gap-2">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
              <span>
                {contact.civilite} {contact.prenom} {contact.nom}
              </span>
            </div>
            <div className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
              <a className="text-violet-700 underline" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </div>
            <div className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
              <span>{contact.telephone}</span>
            </div>
          </>
        ) : (
          <p className="text-slate-500">Pas de contact (parcours locataire)</p>
        )}
      </CardContent>
    </Card>
  );
}
