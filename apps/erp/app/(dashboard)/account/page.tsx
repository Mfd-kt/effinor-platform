import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { AccountForm } from "@/features/account/components/account-form";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("email, full_name, phone, job_title, avatar_url, address_line_1, postal_code, city, country, latitude, longitude, geocoding_status")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return (
      <div>
        <PageHeader title="Mon compte" description="Profil utilisateur." />
        <p className="text-sm text-destructive">
          Impossible de charger votre profil : {error?.message ?? "profil introuvable."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Mon compte"
        description="Photo, coordonnées et adresse technicien — utilisées pour le calcul de distance."
      />
      <AccountForm profile={profile} />
    </div>
  );
}
