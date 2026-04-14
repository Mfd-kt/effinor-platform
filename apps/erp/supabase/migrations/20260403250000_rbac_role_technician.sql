-- Rôle métier « Technicien » : affectation des visites techniques (champ technician_id).
INSERT INTO public.roles (code, label_fr)
VALUES ('technician', 'Technicien')
ON CONFLICT (code) DO UPDATE
SET label_fr = EXCLUDED.label_fr;
