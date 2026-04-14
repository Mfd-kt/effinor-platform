import type { Database } from "@/types/database.types";

export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export type DocumentListRow = DocumentRow;

export type ProfileOption = {
  id: string;
  label: string;
};

export type DocumentFormOptions = {
  profiles: ProfileOption[];
};

export type DocumentDetailRow = DocumentRow & {
  checked_by_profile: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
};
