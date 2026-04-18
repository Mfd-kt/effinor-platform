-- Réglages des 3 actions principales (générer / préparer / auto-dispatch)

INSERT INTO public.lead_generation_settings (key, value, description)
VALUES
  (
    'main_actions_defaults',
    '{
      "apify": {
        "search_strings": ["Plombier", "Électricien", "Couvreur"],
        "max_crawled_places_per_search": 50,
        "include_web_results": false,
        "location_query": null
      },
      "post_import_enrich_limit": 20,
      "prepare_batch_limit": 40,
      "agent_stock_cap": 100
    }'::jsonb,
    'Défauts des actions principales lead-generation (Apify + limites pipelines).'
  )
ON CONFLICT (key) DO NOTHING;
