-- Workflow métier unique pour les opérations (libellés FR côté app).
-- Ajout des valeurs d’enum puis migration des anciennes valeurs.

ALTER TYPE public.operation_status ADD VALUE 'technical_qualification';
ALTER TYPE public.operation_status ADD VALUE 'quote_preparation';
ALTER TYPE public.operation_status ADD VALUE 'quote_sent';
ALTER TYPE public.operation_status ADD VALUE 'quote_signed';
ALTER TYPE public.operation_status ADD VALUE 'installation_planned';
ALTER TYPE public.operation_status ADD VALUE 'installation_in_progress';
ALTER TYPE public.operation_status ADD VALUE 'installation_completed';
ALTER TYPE public.operation_status ADD VALUE 'delivered_without_install';
ALTER TYPE public.operation_status ADD VALUE 'cee_compliance_review';
ALTER TYPE public.operation_status ADD VALUE 'dossier_complete';
ALTER TYPE public.operation_status ADD VALUE 'anomaly_to_resubmit';
ALTER TYPE public.operation_status ADD VALUE 'polluter_filed';
ALTER TYPE public.operation_status ADD VALUE 'cofrac_control';
ALTER TYPE public.operation_status ADD VALUE 'invoicing_call';
ALTER TYPE public.operation_status ADD VALUE 'payment_pending';
ALTER TYPE public.operation_status ADD VALUE 'prime_paid';
ALTER TYPE public.operation_status ADD VALUE 'cancelled_off_target';
ALTER TYPE public.operation_status ADD VALUE 'not_eligible';
ALTER TYPE public.operation_status ADD VALUE 'cancelled_by_client';
ALTER TYPE public.operation_status ADD VALUE 'delivery_requested';

UPDATE public.operations
SET operation_status = 'installation_in_progress'
WHERE operation_status = 'in_progress';

UPDATE public.operations
SET operation_status = 'payment_pending'
WHERE operation_status = 'on_hold';

UPDATE public.operations
SET operation_status = 'dossier_complete'
WHERE operation_status IN ('completed', 'archived');

UPDATE public.operations
SET operation_status = 'cancelled_off_target'
WHERE operation_status = 'cancelled';
