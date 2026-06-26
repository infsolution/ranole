
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS is_home boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS pages_workspace_home_unique
  ON public.pages (workspace_id)
  WHERE is_home = true;

-- Resolve workspace + página inicial via domínio customizado (apenas verificado)
CREATE OR REPLACE FUNCTION public.resolve_custom_domain(_host text)
RETURNS TABLE(workspace_id uuid, workspace_slug text, home_page_slug text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id, w.slug,
    (SELECT p.slug FROM public.pages p
      WHERE p.workspace_id = w.id AND p.status = 'published' AND p.is_home = true
      LIMIT 1)
  FROM public.workspaces w
  WHERE w.custom_domain = lower(_host)
    AND w.custom_domain_status = 'active'
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_custom_domain(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_custom_domain(text) TO service_role;
