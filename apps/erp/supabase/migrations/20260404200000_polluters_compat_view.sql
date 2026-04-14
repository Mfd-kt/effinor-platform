-- Après fusion polluteurs → delegators (20260404160000), tout client encore ciblant
-- public.polluters (cache navigateur, ancien bundle, outil externe) recevait une erreur
-- « table absente du schema cache ». Cette vue réexpose le même nom sur delegators.

CREATE OR REPLACE VIEW public.polluters
WITH (security_invoker = true)
AS
SELECT *
FROM public.delegators;

COMMENT ON VIEW public.polluters IS
  'Compatibilité API : référentiel unique = delegators (migration merge polluteurs).';

GRANT SELECT ON public.polluters TO authenticated;
GRANT SELECT ON public.polluters TO service_role;

NOTIFY pgrst, 'reload schema';
