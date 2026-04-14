-- ============================================
-- Migration: Fix notifications foreign key to point to utilisateurs instead of auth.users
-- Date: 2025-12-02
-- Description: Changes recipient_user_id foreign key from auth.users to utilisateurs
-- ============================================

-- Étape 1: Supprimer l'ancienne contrainte de foreign key
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_recipient_user_id_fkey;

-- Étape 2: Ajouter la nouvelle contrainte vers utilisateurs
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_recipient_user_id_fkey 
FOREIGN KEY (recipient_user_id) 
REFERENCES public.utilisateurs(id) 
ON DELETE CASCADE;

-- Vérification
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname = 'notifications_recipient_user_id_fkey';



















