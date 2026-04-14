-- Étape 4 : Créer la table visites_events pour suivre le parcours détaillé

CREATE TABLE IF NOT EXISTS public.visites_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- lien vers la session VISITEUR
  visiteur_id uuid NOT NULL REFERENCES public.visiteurs(id) ON DELETE CASCADE,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- contexte de l'événement
  page text NOT NULL,              -- ex : /produits-solutions/highbay-led
  page_title text,                 -- titre de la page côté front
  referrer text,                   -- document.referrer
  
  -- type d'événement
  event_type text NOT NULL DEFAULT 'page_view',  -- 'page_view', 'scroll', 'click_cta', 'conversion', etc.
  
  -- métriques comportement
  scroll_pct int,                  -- 0–100
  time_on_page_ms int,             -- temps passé sur la page au moment de l'événement
  
  -- extra data (flex)
  extra jsonb                      -- ex : { "cta_id": "hero_devis", "form_step": 2 }
);

-- Index pour les rapports
CREATE INDEX IF NOT EXISTS visites_events_visiteur_id_idx
  ON public.visites_events (visiteur_id);

CREATE INDEX IF NOT EXISTS visites_events_created_at_idx
  ON public.visites_events (created_at DESC);

CREATE INDEX IF NOT EXISTS visites_events_event_type_idx
  ON public.visites_events (event_type);

CREATE INDEX IF NOT EXISTS visites_events_visiteur_created_idx
  ON public.visites_events (visiteur_id, created_at DESC);

-- RLS Policies pour permettre l'insertion anonyme
CREATE POLICY "Allow anonymous visitor events"
  ON public.visites_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow system to update visitor events"
  ON public.visites_events
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view visitor events"
  ON public.visites_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );












