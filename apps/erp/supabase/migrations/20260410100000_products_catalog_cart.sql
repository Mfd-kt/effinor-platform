-- =============================================================================
-- Products catalog enrichment + project carts
-- =============================================================================
-- Extends the existing products table with catalog/e-commerce columns,
-- creates normalized specs/metrics tables, and adds a project cart system.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enrich products table
-- ---------------------------------------------------------------------------

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_code    text,
  ADD COLUMN IF NOT EXISTS category        text NOT NULL DEFAULT 'destratificateur',
  ADD COLUMN IF NOT EXISTS short_label     text,
  ADD COLUMN IF NOT EXISTS description_short text,
  ADD COLUMN IF NOT EXISTS description_long  text,
  ADD COLUMN IF NOT EXISTS image_url         text,
  ADD COLUMN IF NOT EXISTS fallback_image_url text,
  ADD COLUMN IF NOT EXISTS is_active       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order      integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS usage_contexts  jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS unit_label      text NOT NULL DEFAULT 'unité',
  ADD COLUMN IF NOT EXISTS default_price_ht numeric(14,2);

-- Back-fill product_code from existing reference for any pre-existing rows
UPDATE public.products
SET product_code = reference
WHERE product_code IS NULL AND reference IS NOT NULL;

-- Now enforce NOT NULL + UNIQUE
ALTER TABLE public.products
  ALTER COLUMN product_code SET NOT NULL;

ALTER TABLE public.products
  ADD CONSTRAINT products_product_code_unique UNIQUE (product_code);

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_products_product_code ON public.products (product_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active) WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- 2. Product specs (normalized)
-- ---------------------------------------------------------------------------

CREATE TABLE public.product_specs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  spec_key    text NOT NULL,
  spec_label  text NOT NULL,
  spec_value  text NOT NULL,
  spec_group  text,
  sort_order  integer NOT NULL DEFAULT 100,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_specs_product_sort
  ON public.product_specs (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- 3. Product key metrics (normalized)
-- ---------------------------------------------------------------------------

CREATE TABLE public.product_key_metrics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label       text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 100,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_key_metrics_product_sort
  ON public.product_key_metrics (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- 4. Project carts
-- ---------------------------------------------------------------------------

CREATE TABLE public.project_carts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_code         text UNIQUE,
  lead_id           uuid,
  simulation_id     uuid,
  created_by_user_id uuid NOT NULL,
  owner_user_id     uuid NOT NULL,
  status            text NOT NULL DEFAULT 'active',
  currency          text NOT NULL DEFAULT 'EUR',
  total_items       integer NOT NULL DEFAULT 0,
  total_quantity    numeric(14,4) NOT NULL DEFAULT 0,
  subtotal_ht       numeric(14,2) NOT NULL DEFAULT 0,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_carts_lead_id ON public.project_carts (lead_id);
CREATE INDEX idx_project_carts_created_by ON public.project_carts (created_by_user_id);
CREATE INDEX idx_project_carts_owner ON public.project_carts (owner_user_id);
CREATE INDEX idx_project_carts_status ON public.project_carts (status);

-- ---------------------------------------------------------------------------
-- 5. Project cart items
-- ---------------------------------------------------------------------------

CREATE TABLE public.project_cart_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id        uuid NOT NULL REFERENCES public.project_carts(id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES public.products(id),
  quantity       numeric(14,4) NOT NULL DEFAULT 1,
  unit_price_ht  numeric(14,2),
  line_total_ht  numeric(14,2),
  display_order  integer NOT NULL DEFAULT 100,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_cart_items_quantity_positive CHECK (quantity > 0)
);

CREATE INDEX idx_project_cart_items_cart_order
  ON public.project_cart_items (cart_id, display_order);

-- ---------------------------------------------------------------------------
-- 6. updated_at triggers for new tables
-- ---------------------------------------------------------------------------

CREATE TRIGGER set_project_carts_updated_at
  BEFORE UPDATE ON public.project_carts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_project_cart_items_updated_at
  BEFORE UPDATE ON public.project_cart_items
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_key_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_cart_items ENABLE ROW LEVEL SECURITY;

-- Product specs & metrics: same baseline as products (active profile)
CREATE POLICY "product_specs_all_active"
  ON public.product_specs FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "product_key_metrics_all_active"
  ON public.product_key_metrics FOR ALL TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

-- Project carts: owner or creator can manage; other active users can read
CREATE POLICY "project_carts_select_active"
  ON public.project_carts FOR SELECT TO authenticated
  USING (public.is_active_profile());

CREATE POLICY "project_carts_insert_own"
  ON public.project_carts FOR INSERT TO authenticated
  WITH CHECK (
    public.is_active_profile()
    AND created_by_user_id = auth.uid()
  );

CREATE POLICY "project_carts_update_own"
  ON public.project_carts FOR UPDATE TO authenticated
  USING (
    public.is_active_profile()
    AND (owner_user_id = auth.uid() OR created_by_user_id = auth.uid())
  )
  WITH CHECK (
    public.is_active_profile()
    AND (owner_user_id = auth.uid() OR created_by_user_id = auth.uid())
  );

CREATE POLICY "project_carts_delete_own"
  ON public.project_carts FOR DELETE TO authenticated
  USING (
    public.is_active_profile()
    AND (owner_user_id = auth.uid() OR created_by_user_id = auth.uid())
  );

-- Cart items: cascade from cart visibility
CREATE POLICY "project_cart_items_select_active"
  ON public.project_cart_items FOR SELECT TO authenticated
  USING (public.is_active_profile());

CREATE POLICY "project_cart_items_insert_active"
  ON public.project_cart_items FOR INSERT TO authenticated
  WITH CHECK (public.is_active_profile());

CREATE POLICY "project_cart_items_update_active"
  ON public.project_cart_items FOR UPDATE TO authenticated
  USING (public.is_active_profile())
  WITH CHECK (public.is_active_profile());

CREATE POLICY "project_cart_items_delete_active"
  ON public.project_cart_items FOR DELETE TO authenticated
  USING (public.is_active_profile());
