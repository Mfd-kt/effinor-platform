"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateMyProfile } from "@/features/account/actions/update-my-profile";
import { uploadMyAvatar } from "@/features/account/actions/upload-my-avatar";
import type { UpdateMyProfileResult } from "@/features/account/actions/update-my-profile";
import { profileInitials } from "@/lib/user-display";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfileLocationQuality } from "@/features/technical-visits/lib/location-validation";

export type AccountProfile = {
  email: string;
  full_name: string | null;
  phone: string | null;
  job_title: string | null;
  avatar_url: string | null;
  address_line_1: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geocoding_status?: string | null;
};

export function AccountForm({ profile }: { profile: AccountProfile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);
  const [avatarPending, setAvatarPending] = useState(false);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [jobTitle, setJobTitle] = useState(profile.job_title ?? "");
  const [addressLine1, setAddressLine1] = useState(profile.address_line_1 ?? "");
  const [postalCode, setPostalCode] = useState(profile.postal_code ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [country, setCountry] = useState(profile.country ?? "France");
  const locationQuality = getProfileLocationQuality(profile);

  useEffect(() => {
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setJobTitle(profile.job_title ?? "");
    setAddressLine1(profile.address_line_1 ?? "");
    setPostalCode(profile.postal_code ?? "");
    setCity(profile.city ?? "");
    setCountry(profile.country ?? "France");
  }, [
    profile.full_name,
    profile.phone,
    profile.job_title,
    profile.address_line_1,
    profile.postal_code,
    profile.city,
    profile.country,
  ]);

  const [profileResult, profileAction, profilePending] = useActionState(
    async (_prev: UpdateMyProfileResult | null, formData: FormData) => {
      return updateMyProfile(formData);
    },
    null as UpdateMyProfileResult | null,
  );

  const initials = profileInitials(profile.full_name, profile.email);

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarMsg(null);
    setAvatarPending(true);
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadMyAvatar(fd);
    setAvatarPending(false);
    e.target.value = "";
    if (result.ok) {
      setAvatarMsg("Photo mise à jour.");
      router.refresh();
      return;
    }
    setAvatarMsg(result.error);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
          <CardDescription>JPEG, PNG ou WebP — maximum 2 Mo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-20">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="" />
            ) : null}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => void onAvatarChange(e)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={avatarPending}
              onClick={() => fileRef.current?.click()}
            >
              {avatarPending ? "Envoi…" : "Choisir une photo"}
            </Button>
            {avatarMsg ? (
              <p
                className={cn(
                  "text-sm",
                  avatarMsg.startsWith("Photo") ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                )}
              >
                {avatarMsg}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
          <CardDescription>Nom affiché, téléphone et fonction dans l’entreprise.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              {/* Champ natif : évite l’avertissement Base UI (contrôle / defaultValue) sur les champs en lecture seule. */}
              <input
                id="email"
                type="email"
                readOnly
                disabled
                value={profile.email}
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-muted/50 px-2.5 py-1 text-sm text-muted-foreground outline-none md:text-sm"
              />
              <p className="text-xs text-muted-foreground">L’e-mail de connexion est géré par l’administrateur.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                placeholder="Prénom Nom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+33 …"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Fonction</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex. Chargé d’affaires"
              />
            </div>
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="addressLine1">Adresse</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                autoComplete="street-address"
                placeholder="Ex. 1 Avenue de l'Europe"
              />
              <p className="text-xs text-muted-foreground">
                Cette adresse sert de point de départ pour le calcul de distance côté technicien.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  autoComplete="postal-code"
                  placeholder="94320"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  placeholder="Thiais"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input
                id="country"
                name="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                autoComplete="country-name"
                placeholder="France"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Qualité localisation:{" "}
              <span className="font-medium text-foreground">{locationQuality}</span>
            </p>
            {profileResult ? (
              <p
                className={cn(
                  "text-sm",
                  profileResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
                )}
                role="status"
              >
                {profileResult.ok ? profileResult.message : profileResult.error}
              </p>
            ) : null}
            <Button type="submit" disabled={profilePending}>
              {profilePending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
