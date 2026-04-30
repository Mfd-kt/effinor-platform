import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeadB2BInsert } from "@/features/leads/schemas/lead-b2b.schema";
import type { LeadB2CInsert } from "@/features/leads/schemas/lead-b2c.schema";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

export type LeadB2BExtensionRow = LeadB2BInsert & {
  id: string;
  created_at: string;
  updated_at: string;
};

export type LeadB2BActiveRow = LeadB2BExtensionRow & { archived_at: null };
export type LeadB2BArchivedRow = LeadB2BExtensionRow & { archived_at: string };

export type LeadB2CExtensionRow = LeadB2CInsert & {
  id: string;
  created_at: string;
  updated_at: string;
};

export type LeadB2CActiveRow = LeadB2CExtensionRow & { archived_at: null };
export type LeadB2CArchivedRow = LeadB2CExtensionRow & { archived_at: string };

export async function getActiveB2BExtension(
  supabase: Supabase,
  leadId: string,
): Promise<LeadB2BActiveRow | null> {
  const { data, error } = await supabase
    .from("leads_b2b")
    .select("*")
    .eq("lead_id", leadId)
    .is("archived_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as LeadB2BActiveRow;
}

export async function getActiveB2CExtension(
  supabase: Supabase,
  leadId: string,
): Promise<LeadB2CActiveRow | null> {
  const { data, error } = await supabase
    .from("leads_b2c")
    .select("*")
    .eq("lead_id", leadId)
    .is("archived_at", null)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as LeadB2CActiveRow;
}

export async function getActiveLeadExtensions(
  supabase: Supabase,
  leadId: string,
): Promise<{ b2b: LeadB2BActiveRow | null; b2c: LeadB2CActiveRow | null }> {
  const [b2b, b2c] = await Promise.all([
    getActiveB2BExtension(supabase, leadId),
    getActiveB2CExtension(supabase, leadId),
  ]);
  return { b2b, b2c };
}

export async function findLatestArchivedB2BExtension(
  supabase: Supabase,
  leadId: string,
): Promise<LeadB2BArchivedRow | null> {
  const { data, error } = await supabase
    .from("leads_b2b")
    .select("*")
    .eq("lead_id", leadId)
    .not("archived_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as LeadB2BArchivedRow;
}

export async function findLatestArchivedB2CExtension(
  supabase: Supabase,
  leadId: string,
): Promise<LeadB2CArchivedRow | null> {
  const { data, error } = await supabase
    .from("leads_b2c")
    .select("*")
    .eq("lead_id", leadId)
    .not("archived_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as LeadB2CArchivedRow;
}
