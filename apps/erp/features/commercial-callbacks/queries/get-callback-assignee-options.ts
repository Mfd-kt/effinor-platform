import { createClient } from "@/lib/supabase/server";

/** Profils actifs pour le sélecteur « assigné à » (rappels commerciaux). */
export async function getCommercialCallbackAssigneeOptions(): Promise<{ id: string; label: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("full_name", { ascending: true, nullsFirst: false })
    .limit(500);

  if (error) {
    throw new Error(`Profils (rappels) : ${error.message}`);
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    label: p.full_name?.trim() || p.email?.trim() || p.id,
  }));
}
