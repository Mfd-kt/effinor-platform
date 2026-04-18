/** Compatible jsonb / Supabase Json si `database.types` est indisponible. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
