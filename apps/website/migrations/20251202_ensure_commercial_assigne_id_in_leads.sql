-- ============================================
-- Migration: Ensure commercial_assigne_id column exists in leads table
-- Date: 2025-12-02
-- Description: Adds commercial_assigne_id column to leads table if it doesn't exist
-- ============================================

-- Add commercial_assigne_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'commercial_assigne_id'
  ) THEN
    ALTER TABLE public.leads 
    ADD COLUMN commercial_assigne_id UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL;
    
    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_leads_commercial_assigne_id 
    ON public.leads(commercial_assigne_id);
    
    RAISE NOTICE 'Column commercial_assigne_id added to leads table';
  ELSE
    RAISE NOTICE 'Column commercial_assigne_id already exists in leads table';
  END IF;
END $$;

-- Add index if it doesn't exist (in case column existed but index didn't)
CREATE INDEX IF NOT EXISTS idx_leads_commercial_assigne_id 
ON public.leads(commercial_assigne_id);

-- Add comment to column
COMMENT ON COLUMN public.leads.commercial_assigne_id IS 
'ID du commercial assigné au lead (référence vers utilisateurs.id)';

