-- Rôle métier « Administrateur » : périmètre large côté app (sauf actions réservées au super_admin).
INSERT INTO public.roles (code, label_fr)
VALUES ('admin', 'Administrateur')
ON CONFLICT (code) DO UPDATE
SET label_fr = EXCLUDED.label_fr;
