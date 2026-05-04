-- Fix: articles créés directement en "published" (INSERT) n'avaient pas published_at.
-- Le trigger existant ne couvrait que UPDATE → RLS publique (published_at NOT NULL) les excluait.

BEGIN;

CREATE OR REPLACE FUNCTION public.set_blog_articles_published_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
      NEW.published_at := now();
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status = 'published'
     AND OLD.status IS DISTINCT FROM 'published'
     AND NEW.published_at IS NULL
  THEN
    NEW.published_at := now();
  END IF;

  IF NEW.status <> 'published' AND OLD.status = 'published' THEN
    NEW.published_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_articles_published_at_insert
  ON public.blog_articles;
CREATE TRIGGER trg_blog_articles_published_at_insert
  BEFORE INSERT ON public.blog_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_blog_articles_published_at();

UPDATE public.blog_articles
SET published_at = COALESCE(created_at, now())
WHERE status = 'published'
  AND published_at IS NULL;

COMMIT;
