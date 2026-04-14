-- Galerie d'images produit

CREATE TABLE IF NOT EXISTS product_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         text NOT NULL,
  alt         text,
  sort_order  integer NOT NULL DEFAULT 100,
  is_cover    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id, sort_order);

-- RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images_select_authenticated"
  ON product_images FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "product_images_insert_authenticated"
  ON product_images FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "product_images_update_authenticated"
  ON product_images FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_images_delete_authenticated"
  ON product_images FOR DELETE TO authenticated
  USING (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-images', 'product-images', true, 10485760)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "product_images_storage_delete" ON storage.objects;

CREATE POLICY "product_images_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "product_images_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images');
