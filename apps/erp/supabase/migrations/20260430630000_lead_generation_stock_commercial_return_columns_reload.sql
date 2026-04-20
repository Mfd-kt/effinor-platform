-- Ensure commercial-return columns exist and PostgREST picks them up (fixes
-- "Could not find the 'returned_from_commercial_at' column ... in the schema cache").
ALTER TABLE public.lead_generation_stock
  ADD COLUMN IF NOT EXISTS returned_from_commercial_at timestamptz,
  ADD COLUMN IF NOT EXISTS returned_from_commercial_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS returned_from_commercial_note text;

NOTIFY pgrst, 'reload schema';