import type { Database } from "@/types/database.types";

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

export type ProfileMini = {
  id: string;
  full_name: string | null;
  email: string;
  /** Photo de profil (Storage), si renseignée. */
  avatar_url?: string | null;
};

export type LeadDetailRow = LeadRow & {
  created_by_agent: ProfileMini | null;
  confirmed_by: ProfileMini | null;
};

export type LeadInternalNoteWithAuthor = {
  id: string;
  body: string;
  created_at: string;
  created_by: string;
  author: ProfileMini | null;
};
